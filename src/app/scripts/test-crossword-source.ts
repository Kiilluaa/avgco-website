import { writeFile } from "node:fs/promises";
import path from "node:path";
import { sourceCrosswordWords } from "../lib/crossword/crosswordSource";
import { generateWeeklyCrossword } from "../lib/crossword/generateWeeklyCrossword";

const PREVIEW_FILE = path.join(process.cwd(), ".crossword-preview.json");

async function main() {
	console.log("Testing the public crossword sources...");

	const words = await sourceCrosswordWords(new Set());
	const generatedPuzzle = generateWeeklyCrossword(words);
	const previewEntries = [
		...generatedPuzzle.clues_data.across.map((entry) => ({
			direction: "across",
			number: entry.number,
			answer: entry.answer,
			clue: entry.clue,
		})),
		...generatedPuzzle.clues_data.down.map((entry) => ({
			direction: "down",
			number: entry.number,
			answer: entry.answer,
			clue: entry.clue,
		})),
	].sort((a, b) => a.number - b.number);

	console.log(`Found ${words.length} usable words and clues.`);
	console.table(previewEntries);

	await writeFile(PREVIEW_FILE, JSON.stringify(generatedPuzzle, null, 2), "utf8");

	console.log("Preview saved. Nothing was published to Supabase.");
	console.log("The publish command will use this exact puzzle.");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
