"use client";

import { useCallback, useEffect, useState } from "react";

type Difficulty = "Easy" | "Medium" | "Hard";
type Grid = number[];

type Puzzle = {
  difficulty: Difficulty;
  startingGrid: number[][];
  solution: number[][];
  clueCount: number;
};

const difficultySettings: Record<
  Difficulty,
  { targetClues: number; description: string }
> = {
  Easy: {
    targetClues: 42,
    description: "More starting numbers",
  },
  Medium: {
    targetClues: 34,
    description: "Balanced challenge",
  },
  Hard: {
    targetClues: 27,
    description: "Fewer starting numbers",
  },
};

function createEmptyGrid(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function copyGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function createSolvedGrid(): number[][] {
  const base = 3;
  const side = base * base;

  const groups = [0, 1, 2];

  const rows = shuffleArray(groups).flatMap((group) =>
    shuffleArray(groups).map((row) => group * base + row)
  );

  const columns = shuffleArray(groups).flatMap((group) =>
    shuffleArray(groups).map((column) => group * base + column)
  );

  const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  function pattern(row: number, column: number): number {
    return (base * (row % base) + Math.floor(row / base) + column) % side;
  }

  return rows.map((row) =>
    columns.map((column) => numbers[pattern(row, column)])
  );
}

function getCandidates(board: number[][], row: number, column: number): number[] {
  const usedNumbers = new Set<number>();

  for (let index = 0; index < 9; index++) {
    usedNumbers.add(board[row][index]);
    usedNumbers.add(board[index][column]);
  }

  const startingRow = Math.floor(row / 3) * 3;
  const startingColumn = Math.floor(column / 3) * 3;

  for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset++) {
      usedNumbers.add(
        board[startingRow + rowOffset][startingColumn + columnOffset]
      );
    }
  }

  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    (number) => !usedNumbers.has(number)
  );
}

function findBestEmptyCell(
  board: number[][]
): { row: number; column: number; candidates: number[] } | null {
  let bestCell: {
    row: number;
    column: number;
    candidates: number[];
  } | null = null;

  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 9; column++) {
      if (board[row][column] !== 0) {
        continue;
      }

      const candidates = getCandidates(board, row, column);

      if (!bestCell || candidates.length < bestCell.candidates.length) {
        bestCell = { row, column, candidates };
      }

      if (candidates.length <= 1) {
        return bestCell;
      }
    }
  }

  return bestCell;
}

function countSolutions(board: number[][], limit = 2): number {
  const emptyCell = findBestEmptyCell(board);

  if (!emptyCell) {
    return 1;
  }

  if (emptyCell.candidates.length === 0) {
    return 0;
  }

  let solutionCount = 0;

  for (const candidate of emptyCell.candidates) {
    board[emptyCell.row][emptyCell.column] = candidate;

    solutionCount += countSolutions(board, limit - solutionCount);

    board[emptyCell.row][emptyCell.column] = 0;

    if (solutionCount >= limit) {
      return solutionCount;
    }
  }

  return solutionCount;
}

function generatePuzzle(difficulty: Difficulty): Puzzle {
  const targetClues = difficultySettings[difficulty].targetClues;
  let bestPuzzle: Puzzle | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const solution = createSolvedGrid();
    const startingGrid = copyGrid(solution);

    const cellLocations = shuffleArray(
      Array.from({ length: 81 }, (_, index) => ({
        row: Math.floor(index / 9),
        column: index % 9,
      }))
    );

    let clueCount = 81;

    for (const location of cellLocations) {
      if (clueCount <= targetClues) {
        break;
      }

      const removedValue = startingGrid[location.row][location.column];

      startingGrid[location.row][location.column] = 0;

      const remainingSolutionCount = countSolutions(copyGrid(startingGrid));

      if (remainingSolutionCount !== 1) {
        startingGrid[location.row][location.column] = removedValue;
      } else {
        clueCount--;
      }
    }

    const generatedPuzzle: Puzzle = {
      difficulty,
      startingGrid,
      solution,
      clueCount,
    };

    if (!bestPuzzle || generatedPuzzle.clueCount < bestPuzzle.clueCount) {
      bestPuzzle = generatedPuzzle;
    }

    if (clueCount <= targetClues) {
      return generatedPuzzle;
    }
  }

  return bestPuzzle!;
}

function isPuzzleComplete(grid: number[][], solution: number[][]): boolean {
  return grid.every((row, rowIndex) =>
    row.every(
      (value, columnIndex) => value === solution[rowIndex][columnIndex]
    )
  );
}

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [message, setMessage] = useState("Generating a new puzzle...");
  const [completed, setCompleted] = useState(false);

  function loadPuzzle(selectedDifficulty: Difficulty) {
    setMessage("Generating a new puzzle...");

    const nextPuzzle = generatePuzzle(selectedDifficulty);

    setDifficulty(selectedDifficulty);
    setActivePuzzle(nextPuzzle);
    setGrid(copyGrid(nextPuzzle.startingGrid));
    setSelectedCell(null);
    setCompleted(false);
    setMessage("Select an empty square and choose a number.");
  }

  function resetPuzzle() {
    if (!activePuzzle) {
      return;
    }

    setGrid(copyGrid(activePuzzle.startingGrid));
    setSelectedCell(null);
    setCompleted(false);
    setMessage("Puzzle reset. Select an empty square to continue.");
  }

  const enterNumber = useCallback(
    (value: number) => {
      if (!selectedCell || !activePuzzle || completed) {
        return;
      }

      const [row, column] = selectedCell;

      if (activePuzzle.startingGrid[row][column] !== 0) {
        return;
      }

      const updatedGrid = copyGrid(grid);

      updatedGrid[row][column] = value;

      setGrid(updatedGrid);

      if (value === 0) {
        setMessage("Entry erased. Continue solving the puzzle.");
        return;
      }

      if (value !== activePuzzle.solution[row][column]) {
        setMessage("That number is incorrect. Try again.");
        return;
      }

      if (isPuzzleComplete(updatedGrid, activePuzzle.solution)) {
        setCompleted(true);
        setMessage(`Completed! You solved the ${difficulty} puzzle.`);
        return;
      }

      setMessage("Correct entry. Keep going.");
    },
    [activePuzzle, completed, difficulty, grid, selectedCell]
  );

  useEffect(() => {
    const initialPuzzle = generatePuzzle("Easy");

    setActivePuzzle(initialPuzzle);
    setGrid(copyGrid(initialPuzzle.startingGrid));
    setMessage("Select an empty square and choose a number.");
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key >= "1" && event.key <= "9") {
        enterNumber(Number(event.key));
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        enterNumber(0);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enterNumber]);

  return (
    <div className="mt-12 rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Puzzle Status
          </p>

          <p className="mt-3 text-lg font-medium text-white">{message}</p>

          {activePuzzle && (
            <p className="mt-2 text-sm text-neutral-400">
              {difficulty} puzzle · {activePuzzle.clueCount} starting numbers
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <label
            htmlFor="difficulty"
            className="text-sm uppercase tracking-[0.2em] text-neutral-500"
          >
            Difficulty
          </label>

          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) =>
              loadPuzzle(event.target.value as Difficulty)
            }
            className="mt-3 block w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-8 xl:flex-row xl:items-start xl:justify-center">
        <div className="grid grid-cols-9 border-2 border-neutral-300 bg-neutral-300">
          {grid.map((row, rowIndex) =>
            row.map((value, columnIndex) => {
              const startingCell =
                activePuzzle?.startingGrid[rowIndex][columnIndex] !== 0;

              const selected =
                selectedCell?.[0] === rowIndex &&
                selectedCell?.[1] === columnIndex;

              const incorrect =
                activePuzzle !== null &&
                value !== 0 &&
                !startingCell &&
                value !== activePuzzle.solution[rowIndex][columnIndex];

              const rightBorder =
                columnIndex === 2 || columnIndex === 5
                  ? "border-r-2 border-r-neutral-300"
                  : "border-r border-r-neutral-700";

              const bottomBorder =
                rowIndex === 2 || rowIndex === 5
                  ? "border-b-2 border-b-neutral-300"
                  : "border-b border-b-neutral-700";

              return (
                <button
                  key={`${rowIndex}-${columnIndex}`}
                  onClick={() => {
                    if (!startingCell && activePuzzle) {
                      setSelectedCell([rowIndex, columnIndex]);
                    }
                  }}
                  disabled={!activePuzzle}
                  className={`flex h-10 w-10 items-center justify-center bg-neutral-800 text-lg transition hover:bg-neutral-700 sm:h-12 sm:w-12 ${
                    startingCell
                      ? "font-semibold text-white"
                      : "font-medium text-neutral-300"
                  } ${selected ? "ring-2 ring-inset ring-white" : ""} ${
                    incorrect ? "text-red-400" : ""
                  } ${rightBorder} ${bottomBorder}`}
                >
                  {value === 0 ? "" : value}
                </button>
              );
            })
          )}
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Number Pad
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button
                key={number}
                onClick={() => enterNumber(number)}
                disabled={!selectedCell || completed || !activePuzzle}
                className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-lg font-medium text-white transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => enterNumber(0)}
            disabled={!selectedCell || completed || !activePuzzle}
            className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-300 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Erase
          </button>

          <div className="mt-6 flex gap-3">
            <button
              onClick={resetPuzzle}
              disabled={!activePuzzle}
              className="flex-1 rounded-full border border-neutral-700 px-4 py-2.5 text-sm text-neutral-300 transition hover:border-neutral-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset Puzzle
            </button>

            <button
              onClick={() => loadPuzzle(difficulty)}
              className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              New Puzzle
            </button>
          </div>

          <p className="mt-6 text-sm leading-6 text-neutral-400">
            Incorrect entries are shown immediately. You can also use the
            number keys and Backspace on your keyboard.
          </p>
        </div>
      </div>
    </div>
  );
}