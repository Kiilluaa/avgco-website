import type { CrosswordWord } from "./wordBank";

const WORD_LIST_URL =
	"https://github.com/nzfeng/crossword-dataset/raw/refs/heads/main/raw/core.txt";
const DATAMUSE_URL = "https://api.datamuse.com/words";
const TARGET_WORD_COUNT = 60;
const LOOKUP_BATCH_SIZE = 10;
const MIN_ANSWER_LENGTH = 4;
const MAX_ANSWER_LENGTH = 10;
const MIN_WORD_FREQUENCY = 2;

type DatamuseResult = {
	word: string;
	defs?: string[];
	tags?: string[];
};

function cleanAnswer(answer: string) {
	return answer.toUpperCase().replace(/[^A-Z]/g, "");
}

function shuffle<T>(items: T[]) {
	const copy = [...items];

	for (let index = copy.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
	}

	return copy;
}

function getFrequency(result: DatamuseResult) {
	const frequencyTag = result.tags?.find((tag) => tag.startsWith("f:"));
	const frequency = Number(frequencyTag?.slice(2));

	return Number.isFinite(frequency) ? frequency : 0;
}

function getDifficulty(
	answer: string,
	frequency: number
): CrosswordWord["difficulty"] {
	if (answer.length <= 5 || frequency >= 10) {
		return "easy";
	}

	if (answer.length <= 8 || frequency >= 5) {
		return "medium";
	}

	return "hard";
}

function cleanClue(rawDefinition: string, answer: string) {
	const definition = rawDefinition.includes("\t")
		? rawDefinition.slice(rawDefinition.indexOf("\t") + 1)
		: rawDefinition;
	const clue = definition
		.replace(/;\s*["“].*$/, "")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/[.;:,]+$/, "");

	if (clue.length < 8 || clue.length > 120) {
		return null;
	}

	const normalizedClue = clue.toUpperCase().replace(/[^A-Z]/g, "");

	if (normalizedClue.includes(answer)) {
		return null;
	}

	return clue.charAt(0).toUpperCase() + clue.slice(1);
}

async function fetchWordList() {
	const response = await fetch(WORD_LIST_URL, {
		headers: {
			"User-Agent": "AVGCO-Weekly-Crossword",
		},
	});

	if (!response.ok) {
		throw new Error(`Could not download crossword word list (${response.status}).`);
	}

	const text = await response.text();

	return text
		.split(/\r?\n/)
		.map((word) => word.trim())
		.filter((word) => /^[A-Za-z]+$/.test(word))
		.map(cleanAnswer)
		.filter(
			(answer) =>
				answer.length >= MIN_ANSWER_LENGTH &&
				answer.length <= MAX_ANSWER_LENGTH
		);
}

async function fetchClue(answer: string): Promise<CrosswordWord | null> {
	const query = new URLSearchParams({
		sp: answer.toLowerCase(),
		md: "df",
		max: "1",
	});
	const response = await fetch(`${DATAMUSE_URL}?${query.toString()}`);

	if (!response.ok) {
		return null;
	}

	const results = (await response.json()) as DatamuseResult[];
	const exactResult = results.find(
		(result) => cleanAnswer(result.word) === answer && result.defs?.length
	);

	if (!exactResult?.defs) {
		return null;
	}

	const frequency = getFrequency(exactResult);

	if (frequency < MIN_WORD_FREQUENCY) {
		return null;
	}

	for (const definition of exactResult.defs) {
		const clue = cleanClue(definition, answer);

		if (clue) {
			return {
				answer,
				clue,
				difficulty: getDifficulty(answer, frequency),
			};
		}
	}

	return null;
}

export async function sourceCrosswordWords(usedAnswers: Set<string>) {
	const downloadedWords = await fetchWordList();
	const uniqueCandidates = Array.from(new Set(downloadedWords)).filter(
		(answer) => !usedAnswers.has(answer)
	);
	const candidates = shuffle(uniqueCandidates);
	const sourcedWords: CrosswordWord[] = [];

	for (
		let index = 0;
		index < candidates.length && sourcedWords.length < TARGET_WORD_COUNT;
		index += LOOKUP_BATCH_SIZE
	) {
		const batch = candidates.slice(index, index + LOOKUP_BATCH_SIZE);
		const results = await Promise.all(batch.map(fetchClue));

		for (const result of results) {
			if (result) {
				sourcedWords.push(result);
			}
		}
	}

	if (sourcedWords.length < 20) {
		throw new Error(
			`Only ${sourcedWords.length} usable words and clues were found. No puzzle was published.`
		);
	}

	return sourcedWords;
}
