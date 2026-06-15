import type { CrosswordWord } from "./wordBank";

type Direction = "across" | "down";

type PlacedWord = {
	answer: string;
	clue: string;
	row: number;
	col: number;
	direction: Direction;
};

type CrosswordEntry = {
	number: number;
	answer: string;
	row: number;
	col: number;
	clue: string;
};

export type GeneratedCrossword = {
	grid_size: number;
	solution_data: (string | null)[][];
	clues_data: {
		across: CrosswordEntry[];
		down: CrosswordEntry[];
	};
};

type CandidatePlacement = {
	word: CrosswordWord;
	row: number;
	col: number;
	direction: Direction;
	intersections: number;
};

const GRID_SIZE = 15;
const MAX_WORDS = 12;
const GENERATION_ATTEMPTS = 300;

function cleanAnswer(answer: string) {
	return answer.toUpperCase().replace(/[^A-Z]/g, "");
}

function getCellKey(row: number, col: number) {
	return `${row}-${col}`;
}

function shuffle<T>(items: T[]) {
	const copy = [...items];

	for (let index = copy.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
	}

	return copy;
}

function createEmptyGrid() {
	return Array.from({ length: GRID_SIZE }, () =>
		Array.from<string | null>({ length: GRID_SIZE }).fill(null)
	);
}

function isInside(row: number, col: number) {
	return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

function getLetterAt(grid: (string | null)[][], row: number, col: number) {
	if (!isInside(row, col)) {
		return null;
	}

	return grid[row][col];
}

function canPlaceWord(
	grid: (string | null)[][],
	cellDirections: Map<string, Set<Direction>>,
	answer: string,
	row: number,
	col: number,
	direction: Direction
) {
	let intersections = 0;

	const rowStep = direction === "down" ? 1 : 0;
	const colStep = direction === "across" ? 1 : 0;

	const beforeRow = row - rowStep;
	const beforeCol = col - colStep;
	const afterRow = row + rowStep * answer.length;
	const afterCol = col + colStep * answer.length;

	if (!isInside(row, col)) {
		return null;
	}

	if (!isInside(row + rowStep * (answer.length - 1), col + colStep * (answer.length - 1))) {
		return null;
	}

	if (getLetterAt(grid, beforeRow, beforeCol) || getLetterAt(grid, afterRow, afterCol)) {
		return null;
	}

	for (let index = 0; index < answer.length; index += 1) {
		const currentRow = row + rowStep * index;
		const currentCol = col + colStep * index;
		const currentLetter = getLetterAt(grid, currentRow, currentCol);
		const key = getCellKey(currentRow, currentCol);
		const directions = cellDirections.get(key);

		if (currentLetter && currentLetter !== answer[index]) {
			return null;
		}

		if (currentLetter && directions?.has(direction)) {
			return null;
		}

		if (currentLetter) {
			intersections += 1;
			continue;
		}

		if (direction === "across") {
			if (getLetterAt(grid, currentRow - 1, currentCol) || getLetterAt(grid, currentRow + 1, currentCol)) {
				return null;
			}
		}

		if (direction === "down") {
			if (getLetterAt(grid, currentRow, currentCol - 1) || getLetterAt(grid, currentRow, currentCol + 1)) {
				return null;
			}
		}
	}

	return intersections;
}

function placeWord(
	grid: (string | null)[][],
	cellDirections: Map<string, Set<Direction>>,
	placedWords: PlacedWord[],
	placement: CandidatePlacement
) {
	const answer = cleanAnswer(placement.word.answer);
	const rowStep = placement.direction === "down" ? 1 : 0;
	const colStep = placement.direction === "across" ? 1 : 0;

	for (let index = 0; index < answer.length; index += 1) {
		const row = placement.row + rowStep * index;
		const col = placement.col + colStep * index;
		const key = getCellKey(row, col);

		grid[row][col] = answer[index];

		if (!cellDirections.has(key)) {
			cellDirections.set(key, new Set());
		}

		cellDirections.get(key)?.add(placement.direction);
	}

	placedWords.push({
		answer,
		clue: placement.word.clue,
		row: placement.row,
		col: placement.col,
		direction: placement.direction,
	});
}

function findCandidates(
	grid: (string | null)[][],
	cellDirections: Map<string, Set<Direction>>,
	word: CrosswordWord
) {
	const answer = cleanAnswer(word.answer);
	const candidates: CandidatePlacement[] = [];

	for (let row = 0; row < GRID_SIZE; row += 1) {
		for (let col = 0; col < GRID_SIZE; col += 1) {
			const gridLetter = grid[row][col];

			if (!gridLetter) {
				continue;
			}

			for (let index = 0; index < answer.length; index += 1) {
				if (answer[index] !== gridLetter) {
					continue;
				}

				const acrossRow = row;
				const acrossCol = col - index;
				const downRow = row - index;
				const downCol = col;

				const acrossIntersections = canPlaceWord(
					grid,
					cellDirections,
					answer,
					acrossRow,
					acrossCol,
					"across"
				);

				if (acrossIntersections) {
					candidates.push({
						word,
						row: acrossRow,
						col: acrossCol,
						direction: "across",
						intersections: acrossIntersections,
					});
				}

				const downIntersections = canPlaceWord(
					grid,
					cellDirections,
					answer,
					downRow,
					downCol,
					"down"
				);

				if (downIntersections) {
					candidates.push({
						word,
						row: downRow,
						col: downCol,
						direction: "down",
						intersections: downIntersections,
					});
				}
			}
		}
	}

	return candidates.sort((a, b) => b.intersections - a.intersections);
}

function scorePuzzle(grid: (string | null)[][], placedWords: PlacedWord[]) {
	let filledCells = 0;
	let minRow = GRID_SIZE;
	let maxRow = 0;
	let minCol = GRID_SIZE;
	let maxCol = 0;

	for (let row = 0; row < GRID_SIZE; row += 1) {
		for (let col = 0; col < GRID_SIZE; col += 1) {
			if (!grid[row][col]) {
				continue;
			}

			filledCells += 1;
			minRow = Math.min(minRow, row);
			maxRow = Math.max(maxRow, row);
			minCol = Math.min(minCol, col);
			maxCol = Math.max(maxCol, col);
		}
	}

	const height = maxRow - minRow + 1;
	const width = maxCol - minCol + 1;
	const area = height * width;

	return placedWords.length * 100 + filledCells * 3 - area;
}

function trimPuzzle(grid: (string | null)[][], placedWords: PlacedWord[]) {
	let minRow = GRID_SIZE;
	let maxRow = 0;
	let minCol = GRID_SIZE;
	let maxCol = 0;

	for (let row = 0; row < GRID_SIZE; row += 1) {
		for (let col = 0; col < GRID_SIZE; col += 1) {
			if (!grid[row][col]) {
				continue;
			}

			minRow = Math.min(minRow, row);
			maxRow = Math.max(maxRow, row);
			minCol = Math.min(minCol, col);
			maxCol = Math.max(maxCol, col);
		}
	}

	const solution_data = grid
		.slice(minRow, maxRow + 1)
		.map((row) => row.slice(minCol, maxCol + 1));

	const shiftedWords = placedWords.map((word) => ({
		...word,
		row: word.row - minRow,
		col: word.col - minCol,
	}));

	return {
		grid_size: solution_data.length,
		solution_data,
		placedWords: shiftedWords,
	};
}

function buildClues(placedWords: PlacedWord[]) {
	const starts = new Map<string, number>();
	let nextNumber = 1;

	const sortedWords = [...placedWords].sort((a, b) => {
		if (a.row !== b.row) {
			return a.row - b.row;
		}

		return a.col - b.col;
	});

	for (const word of sortedWords) {
		const key = getCellKey(word.row, word.col);

		if (!starts.has(key)) {
			starts.set(key, nextNumber);
			nextNumber += 1;
		}
	}

	const across: CrosswordEntry[] = [];
	const down: CrosswordEntry[] = [];

	for (const word of sortedWords) {
		const entry = {
			number: starts.get(getCellKey(word.row, word.col)) ?? 0,
			answer: word.answer,
			row: word.row,
			col: word.col,
			clue: word.clue,
		};

		if (word.direction === "across") {
			across.push(entry);
		} else {
			down.push(entry);
		}
	}

	return {
		across: across.sort((a, b) => a.number - b.number),
		down: down.sort((a, b) => a.number - b.number),
	};
}

function generateOnePuzzle(words: CrosswordWord[]) {
	const grid = createEmptyGrid();
	const cellDirections = new Map<string, Set<Direction>>();
	const placedWords: PlacedWord[] = [];

	const validWords = shuffle(words)
		.map((word) => ({
			...word,
			answer: cleanAnswer(word.answer),
		}))
		.filter((word) => word.answer.length >= 3 && word.answer.length <= GRID_SIZE)
		.slice(0, MAX_WORDS)
		.sort((a, b) => b.answer.length - a.answer.length);

	const firstWord = validWords[0];

	if (!firstWord) {
		return null;
	}

	placeWord(grid, cellDirections, placedWords, {
		word: firstWord,
		row: Math.floor(GRID_SIZE / 2),
		col: Math.floor((GRID_SIZE - firstWord.answer.length) / 2),
		direction: "across",
		intersections: 0,
	});

	for (const word of validWords.slice(1)) {
		const candidates = findCandidates(grid, cellDirections, word);

		if (!candidates.length) {
			continue;
		}

		placeWord(grid, cellDirections, placedWords, candidates[0]);
	}

	if (placedWords.length < 6) {
		return null;
	}

	return {
		grid,
		placedWords,
		score: scorePuzzle(grid, placedWords),
	};
}

export function generateWeeklyCrossword(words: CrosswordWord[]): GeneratedCrossword {
	let bestPuzzle: ReturnType<typeof generateOnePuzzle> = null;

	for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
		const puzzle = generateOnePuzzle(words);

		if (!puzzle) {
			continue;
		}

		if (!bestPuzzle || puzzle.score > bestPuzzle.score) {
			bestPuzzle = puzzle;
		}
	}

	if (!bestPuzzle) {
		throw new Error("Could not generate a valid crossword puzzle.");
	}

	const trimmedPuzzle = trimPuzzle(bestPuzzle.grid, bestPuzzle.placedWords);

	return {
		grid_size: trimmedPuzzle.grid_size,
		solution_data: trimmedPuzzle.solution_data,
		clues_data: buildClues(trimmedPuzzle.placedWords),
	};
}