import { createClient } from "@supabase/supabase-js";
import { crosswordWordBank } from "../lib/crossword/wordBank";
import { generateWeeklyCrossword } from "../lib/crossword/generateWeeklyCrossword";

function getDateString(date: Date) {
	return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
	const date = new Date(`${dateString}T00:00:00Z`);

	date.setUTCDate(date.getUTCDate() + days);

	return date;
}

async function main() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
	}

	const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

	const { data: latestPuzzle, error: latestPuzzleError } = await supabase
		.from("crossword_puzzles")
		.select("week_number, week_end_date")
		.order("week_number", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (latestPuzzleError) {
		throw latestPuzzleError;
	}

	const nextWeekNumber = latestPuzzle ? latestPuzzle.week_number + 1 : 1;
	const weekStart = latestPuzzle
		? addDays(latestPuzzle.week_end_date, 1)
		: new Date();

	const weekEnd = new Date(weekStart);

	weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

	const generatedPuzzle = generateWeeklyCrossword(crosswordWordBank);

	const { error } = await supabase.from("crossword_puzzles").insert({
		week_number: nextWeekNumber,
		week_start_date: getDateString(weekStart),
		week_end_date: getDateString(weekEnd),
		grid_size: generatedPuzzle.grid_size,
		solution_data: generatedPuzzle.solution_data,
		clues_data: generatedPuzzle.clues_data,
	});

	if (error) {
		throw error;
	}

	console.log(`Weekly crossword ${nextWeekNumber} published.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});