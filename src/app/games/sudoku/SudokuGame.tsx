"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Difficulty = "Easy" | "Medium" | "Hard";
type GameStatus = "ready" | "playing" | "completed";

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

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function isNumberComplete(
  number: number,
  grid: number[][],
  solution: number[][]
): boolean {
  let correctPlacements = 0;

  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 9; column++) {
      if (
        grid[row][column] === number &&
        solution[row][column] === number
      ) {
        correctPlacements++;
      }
    }
  }

  return correctPlacements === 9;
}

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [message, setMessage] = useState(
    "Choose your difficulty, then press Play."
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

  const completedNumbers = new Set<number>(
    activePuzzle
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((number) =>
          isNumberComplete(number, grid, activePuzzle.solution)
        )
      : []
  );

  const selectedValue = selectedCell
    ? grid[selectedCell[0]][selectedCell[1]]
    : 0;

  const selectedIsEditable =
    selectedCell !== null &&
    activePuzzle !== null &&
    activePuzzle.startingGrid[selectedCell[0]][selectedCell[1]] === 0;

  async function saveSudokuCompletion(finalTime: number, finalMistakes: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveMessage("Sign in to save your Sudoku results.");
      return;
    }

    const { error } = await supabase.from("sudoku_completions").insert({
      user_id: user.id,
      difficulty,
      elapsed_seconds: finalTime,
      mistakes: finalMistakes,
    });

    if (error) {
      setSaveMessage("Puzzle completed, but the result could not be saved.");
      return;
    }

    setSaveMessage("Result saved.");
  }

  function preparePuzzle(selectedDifficulty: Difficulty) {
    setDifficulty(selectedDifficulty);
    setGameStatus("ready");
    setActivePuzzle(null);
    setGrid(createEmptyGrid());
    setSelectedCell(null);
    setElapsedSeconds(0);
    setMistakes(0);
    setShowCompletionOverlay(false);
    setSaveMessage("");
    setMessage(
      `Ready to begin a ${selectedDifficulty} puzzle. Press Play.`
    );
  }

  function startPuzzle() {
    setMessage("Generating a new puzzle...");

    const nextPuzzle = generatePuzzle(difficulty);

    setActivePuzzle(nextPuzzle);
    setGrid(copyGrid(nextPuzzle.startingGrid));
    setSelectedCell(null);
    setElapsedSeconds(0);
    setMistakes(0);
    setShowCompletionOverlay(false);
    setGameStatus("playing");
    setSaveMessage("");
    setMessage("Select an empty square and choose a number.");
  }

  function resetPuzzle() {
    if (!activePuzzle) {
      return;
    }

    setGrid(copyGrid(activePuzzle.startingGrid));
    setSelectedCell(null);
    setElapsedSeconds(0);
    setMistakes(0);
    setShowCompletionOverlay(false);
    setGameStatus("playing");
    setSaveMessage("");
    setMessage("Puzzle reset. Select an empty square to continue.");
  }

  const enterNumber = useCallback(
    (value: number) => {
      if (
        !selectedCell ||
        !activePuzzle ||
        gameStatus !== "playing"
      ) {
        return;
      }

      const [row, column] = selectedCell;

      if (activePuzzle.startingGrid[row][column] !== 0) {
        return;
      }

      if (
        value !== 0 &&
        isNumberComplete(value, grid, activePuzzle.solution)
      ) {
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
        setMistakes((currentMistakes) => currentMistakes + 1);
        setMessage("That number is incorrect. Try again.");
        return;
      }

      if (isPuzzleComplete(updatedGrid, activePuzzle.solution)) {
        setGameStatus("completed");
        setShowCompletionOverlay(true);
        setMessage(`Completed! You solved the ${difficulty} puzzle.`);
        void saveSudokuCompletion(elapsedSeconds, mistakes);
        return;
      }

      setMessage("Correct entry. Keep going.");
    },
    [activePuzzle, difficulty, gameStatus, grid, selectedCell]
  );

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const timerId = window.setInterval(() => {
      setElapsedSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [gameStatus]);

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
    <div className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-950 p-3 sm:mt-12 sm:p-8">
      <div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-cyan-900/50 bg-linear-to-br from-neutral-900 to-cyan-950/35 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Puzzle Status
            </p>

            <p className="mt-3 text-lg font-medium text-white">{message}</p>
          </div>

          <div className="rounded-2xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/35 p-5">
            <label
              htmlFor="difficulty"
              className="text-sm uppercase tracking-[0.2em] text-blue-300"
            >
              Difficulty
            </label>

            <select
              id="difficulty"
              value={difficulty}
              onChange={(event) =>
                preparePuzzle(event.target.value as Difficulty)
              }
              className="mt-3 block w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-cyan-900/50 bg-linear-to-br from-neutral-900 to-cyan-950/30 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Time
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-900/50 bg-linear-to-br from-neutral-900 to-red-950/25 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-red-300">
              Mistakes
            </p>
            <p className="mt-2 text-xl font-semibold text-red-200">{mistakes}</p>
          </div>

          <div className="rounded-2xl border border-indigo-900/50 bg-linear-to-br from-neutral-900 to-indigo-950/30 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
              Clues
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {activePuzzle ? activePuzzle.clueCount : "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-8 xl:flex-row xl:items-start xl:justify-center">
        <div className="relative w-full max-w-108">
          <div className="grid w-full grid-cols-9 border-2 border-neutral-200 bg-neutral-200">
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

                const sameRow =
                  selectedCell !== null && selectedCell[0] === rowIndex;

                const sameColumn =
                  selectedCell !== null && selectedCell[1] === columnIndex;

                const sameBox =
                  selectedCell !== null &&
                  Math.floor(selectedCell[0] / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(columnIndex / 3);

                const relatedToSelected = sameRow || sameColumn || sameBox;

                const matchesSelectedNumber =
                  selectedValue !== 0 && value !== 0 && value === selectedValue;

                const backgroundStyle = selected
                  ? "bg-cyan-700/60 ring-2 ring-inset ring-cyan-300"
                  : matchesSelectedNumber
                    ? "bg-cyan-800/70"
                    : relatedToSelected
                      ? "bg-slate-800"
                      : "bg-neutral-800";

                const textStyle = incorrect
                  ? "font-medium text-red-400"
                  : startingCell
                    ? "font-semibold text-white"
                    : value !== 0
                      ? "font-medium text-cyan-300"
                      : "font-medium text-neutral-300";

                const rightBorder =
                  columnIndex === 2 || columnIndex === 5
                    ? "border-r-2 border-r-neutral-200"
                    : "border-r border-r-neutral-700";

                const bottomBorder =
                  rowIndex === 2 || rowIndex === 5
                    ? "border-b-2 border-b-neutral-200"
                    : "border-b border-b-neutral-700";

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    onClick={() => {
                      if (activePuzzle && gameStatus === "playing") {
                        setSelectedCell([rowIndex, columnIndex]);
                      }
                    }}
                    disabled={gameStatus !== "playing"}
                    className={`flex aspect-square w-full items-center justify-center text-base transition-colors sm:text-lg ${
                      gameStatus === "playing"
                        ? "hover:bg-cyan-700/50"
                        : "disabled:cursor-default"
                    } ${backgroundStyle} ${textStyle} ${rightBorder} ${bottomBorder}`}
                  >
                    {value === 0 ? "" : value}
                  </button>
                );
              })
            )}
          </div>

          {gameStatus === "ready" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-neutral-400/45">
              <button
                onClick={startPuzzle}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <span className="relative rounded-full bg-neutral-950 px-8 py-3 transition-all duration-200 group-hover:bg-transparent">
                  Play
                </span>
              </button>
            </div>
          )}

          {gameStatus === "completed" && showCompletionOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-400/45 px-6 text-center">
              <div className="rounded-3xl border border-neutral-700 bg-neutral-950/95 p-6 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                  Completed
                </p>

                <h2 className="mt-3 text-3xl font-bold text-white">
                  Puzzle Solved!
                </h2>

                <p className="mt-3 text-sm leading-6 text-neutral-300">
                  {difficulty} · {formatTime(elapsedSeconds)} · Mistakes{" "}
                  {mistakes}
                </p>

                {saveMessage && (
                  <p className="mt-3 text-sm text-neutral-400">{saveMessage}</p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => setShowCompletionOverlay(false)}
                    className="rounded-full border border-neutral-600 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-300 hover:text-white active:scale-[0.98]"
                  >
                    See Board
                  </button>

                  <button
                    onClick={() => preparePuzzle(difficulty)}
                    className="rounded-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 transition hover:bg-linear-to-br focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-[0.98]"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full max-w-108 flex-col rounded-2xl border border-cyan-900/50 bg-linear-to-br from-neutral-900 to-cyan-950/25 p-5 xl:h-108">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Number Pad
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => {
              const numberComplete = completedNumbers.has(number);

              return (
                <button
                  key={number}
                  onClick={() => enterNumber(number)}
                  disabled={
                    !selectedIsEditable ||
                    gameStatus !== "playing" ||
                    !activePuzzle ||
                    numberComplete
                  }
                  className={`relative overflow-hidden rounded-xl border px-4 py-2.5 text-lg font-medium transition ${
                    numberComplete
                      ? "cursor-not-allowed border-neutral-500 bg-neutral-700 text-neutral-400"
                      : "border-cyan-500/60 bg-neutral-950 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/15 active:border-cyan-300 active:bg-cyan-500 active:text-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500 disabled:opacity-60 disabled:hover:bg-neutral-950"
                  }`}
                >
                  <span>{number}</span>

                  {numberComplete && (
                    <span className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => enterNumber(0)}
            disabled={
              !selectedIsEditable || gameStatus !== "playing" || !activePuzzle
            }
            className="mt-3 w-full rounded-xl border border-cyan-500/60 bg-neutral-950 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/15 active:border-cyan-300 active:bg-cyan-500 active:text-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500 disabled:opacity-60 disabled:hover:bg-neutral-950"
          >
            Erase
          </button>

          <div className="mt-auto flex gap-3 pt-5">
            <button
              onClick={resetPuzzle}
              disabled={!activePuzzle}
              className="flex-1 rounded-full border border-amber-500/60 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20 active:scale-[0.98] active:border-amber-300 active:bg-amber-500/35 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-transparent disabled:text-neutral-500 disabled:opacity-60"
            >
              Reset Puzzle
            </button>

            <button
              onClick={() => preparePuzzle(difficulty)}
              className="flex-1 rounded-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 transition hover:bg-linear-to-br focus:outline-none focus:ring-2 focus:ring-blue-300"
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