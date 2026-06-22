import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
	generateWeeklyCrossword,
	type GeneratedCrossword,
} from "../lib/crossword/generateWeeklyCrossword";
import { sourceCrosswordWords } from "../lib/crossword/crosswordSource";

const PREVIEW_FILE = path.join(process.cwd(), ".crossword-preview.json");

type StoredClue = {
	answer?: unknown;
};

type StoredClues = {
	across?: StoredClue[];
	down?: StoredClue[];
};

function getDateString(date: Date) {
	return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
	const date = new Date(`${dateString}T00:00:00Z`);

	date.setUTCDate(date.getUTCDate() + days);

	return date;
}

function cleanAnswer(answer: string) {
	return answer.toUpperCase().replace(/[^A-Z]/g, "");
}

function collectUsedAnswers(puzzles: { clues_data: unknown }[]) {
	const usedAnswers = new Set<string>();

	for (const puzzle of puzzles) {
		const clues = puzzle.clues_data as StoredClues | null;
		const entries = [...(clues?.across ?? []), ...(clues?.down ?? [])];

		for (const entry of entries) {
			if (typeof entry.answer === "string") {
				usedAnswers.add(cleanAnswer(entry.answer));
			}
		}
	}

	return usedAnswers;
}

async function loadPreviewPuzzle(): Promise<GeneratedCrossword | null> {
	try {
		const preview = JSON.parse(
			await readFile(PREVIEW_FILE, "utf8")
		) as GeneratedCrossword;

		if (
			!Array.isArray(preview.solution_data) ||
			!Array.isArray(preview.clues_data?.across) ||
			!Array.isArray(preview.clues_data?.down)
		) {
			throw new Error("The saved crossword preview is invalid.");
		}

		return preview;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return null;
		}

		throw error;
	}
}

async function main() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
	}

	const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

	const { data: previousPuzzles, error: previousPuzzlesError } = await supabase
		.from("crossword_puzzles")
		.select("clues_data");

	if (previousPuzzlesError) {
		throw previousPuzzlesError;
	}

	const usedAnswers = collectUsedAnswers(previousPuzzles ?? []);
	const previewPuzzle = await loadPreviewPuzzle();
	let generatedPuzzle: GeneratedCrossword;

	console.log(`Excluded ${usedAnswers.size} previously used answers.`);

	if (previewPuzzle) {
		const previewAnswers = [
			...previewPuzzle.clues_data.across,
			...previewPuzzle.clues_data.down,
		].map((entry) => cleanAnswer(entry.answer));
		const repeatedAnswer = previewAnswers.find((answer) =>
			usedAnswers.has(answer)
		);

		if (repeatedAnswer) {
			throw new Error(
				`The preview contains the previously used answer ${repeatedAnswer}. Run crossword:test-source again.`
			);
		}

		console.log("Using the exact puzzle saved by crossword:test-source.");
		generatedPuzzle = previewPuzzle;
	} else {
		console.log("No saved preview found. Sourcing a new puzzle...");

		const crosswordWordBank = await sourceCrosswordWords(usedAnswers);
		generatedPuzzle = generateWeeklyCrossword(crosswordWordBank);
	}

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

	if (previewPuzzle) {
		await unlink(PREVIEW_FILE);
	}

	console.log(`Weekly crossword ${nextWeekNumber} published.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
