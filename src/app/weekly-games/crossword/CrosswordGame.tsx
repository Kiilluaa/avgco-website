"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type Direction = "across" | "down";

type CrosswordEntry = {
    number: number;
    answer: string;
    row: number;
    col: number;
    clue: string;
};

type CrosswordPuzzle = {
    id: number;
    week_number: number;
    week_start_date: string;
    week_end_date: string;
    grid_size: number;
    solution_data: (string | null)[][];
    clues_data: {
        across: CrosswordEntry[];
        down: CrosswordEntry[];
    };
};

type CrosswordAttempt = {
    id: number;
    user_id: string;
    puzzle_id: number;
    filled_grid_data: Record<string, string>;
    incorrect_submissions: number;
    failed: boolean;
    completed: boolean;
    completed_at: string | null;
};

const MAX_INCORRECT_SUBMISSIONS = 5;

function formatDate(dateString: string) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function getCellKey(row: number, col: number) {
    return `${row}-${col}`;
}

function getInputId(row: number, col: number) {
    return `crossword-cell-${row}-${col}`;
}

function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

export default function CrosswordGame() {
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
    const [attempt, setAttempt] = useState<CrosswordAttempt | null>(null);
    const [filledGrid, setFilledGrid] = useState<Record<string, string>>({});
    const [userId, setUserId] = useState<string | null>(null);
    const [activeDirection, setActiveDirection] = useState<Direction>("across");
    const [activeCell, setActiveCell] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Loading weekly crossword...");
    const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

    const startNumbers = useMemo(() => {
        if (!puzzle) {
            return {};
        }

        const numbers: Record<string, number> = {};

        for (const entry of puzzle.clues_data.across) {
            numbers[getCellKey(entry.row, entry.col)] = entry.number;
        }

        for (const entry of puzzle.clues_data.down) {
            numbers[getCellKey(entry.row, entry.col)] = entry.number;
        }

        return numbers;
    }, [puzzle]);

    useEffect(() => {
        loadCrossword();

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    function isPlayableCell(row: number, col: number) {
        if (!puzzle) {
            return false;
        }

        if (
            row < 0 ||
            col < 0 ||
            row >= puzzle.grid_size ||
            col >= puzzle.grid_size
        ) {
            return false;
        }

        return Boolean(puzzle.solution_data[row][col]);
    }

    function focusCell(row: number, col: number) {
        const input = document.getElementById(getInputId(row, col));
        input?.focus();
    }

    function blurActiveCell() {
        setActiveCell(null);

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    function findAdjacentCell(
        row: number,
        col: number,
        direction: Direction,
        step: 1 | -1
    ) {
        const nextRow = direction === "down" ? row + step : row;
        const nextCol = direction === "across" ? col + step : col;

        if (isPlayableCell(nextRow, nextCol)) {
            return { row: nextRow, col: nextCol };
        }

        return null;
    }

    function getBestDirection(row: number, col: number, currentDirection: Direction) {
        const currentNextCell = findAdjacentCell(row, col, currentDirection, 1);

        if (currentNextCell) {
            return currentDirection;
        }

        const alternateDirection = currentDirection === "across" ? "down" : "across";
        const alternateNextCell = findAdjacentCell(row, col, alternateDirection, 1);

        if (alternateNextCell) {
            return alternateDirection;
        }

        return currentDirection;
    }

    async function loadCrossword() {
        setLoading(true);

        const today = getTodayDateString();

        const { data: puzzleData, error: puzzleError } = await supabase
            .from("crossword_puzzles")
            .select("*")
            .lte("week_start_date", today)
            .gte("week_end_date", today)
            .order("week_number", { ascending: false })
            .limit(1)
            .single();

        if (puzzleError || !puzzleData) {
            setMessage("No weekly crossword is available right now.");
            setLoading(false);
            return;
        }

        const loadedPuzzle = puzzleData as CrosswordPuzzle;
        setPuzzle(loadedPuzzle);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setUserId(null);
            setFilledGrid({});
            setAttempt(null);
            setLoading(false);
            return;
        }

        setUserId(user.id);

        const { data: existingAttempt } = await supabase
            .from("crossword_attempts")
            .select("*")
            .eq("user_id", user.id)
            .eq("puzzle_id", loadedPuzzle.id)
            .maybeSingle();

        if (existingAttempt) {
            const savedAttempt = existingAttempt as CrosswordAttempt;

            setAttempt(savedAttempt);
            setFilledGrid(savedAttempt.filled_grid_data ?? {});

            if (savedAttempt.completed && !savedAttempt.failed) {
                setShowCompletionOverlay(true);
            }

            setLoading(false);
            return;
        }

        const { data: newAttempt, error: insertError } = await supabase
            .from("crossword_attempts")
            .insert({
                user_id: user.id,
                puzzle_id: loadedPuzzle.id,
                filled_grid_data: {},
            })
            .select("*")
            .single();

        if (insertError || !newAttempt) {
            setMessage("Could not create your crossword attempt.");
            setLoading(false);
            return;
        }

        setAttempt(newAttempt as CrosswordAttempt);
        setFilledGrid({});
        setLoading(false);
    }

    function saveProgress(nextFilledGrid: Record<string, string>) {
        if (!attempt || !userId) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            const { data, error } = await supabase
                .from("crossword_attempts")
                .update({
                    filled_grid_data: nextFilledGrid,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", attempt.id)
                .eq("user_id", userId)
                .select("*")
                .single();

            if (!error && data) {
                setAttempt(data as CrosswordAttempt);
            }
        }, 250);
    }

    function handleCellChange(row: number, col: number, value: string) {
        if (!puzzle || attempt?.completed) {
            return;
        }

        const cleanValue = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);

        if (!cleanValue) {
            return;
        }

        const key = getCellKey(row, col);

        const nextFilledGrid = {
            ...filledGrid,
            [key]: cleanValue,
        };

        setFilledGrid(nextFilledGrid);
        saveProgress(nextFilledGrid);

        const bestDirection = getBestDirection(row, col, activeDirection);
        setActiveDirection(bestDirection);

        const nextCell = findAdjacentCell(row, col, bestDirection, 1);

        if (nextCell) {
            setTimeout(() => focusCell(nextCell.row, nextCell.col), 0);
        } else {
            setTimeout(() => blurActiveCell(), 0);
        }
    }

    function handleCellKeyDown(
        row: number,
        col: number,
        event: React.KeyboardEvent<HTMLInputElement>
    ) {
        const key = getCellKey(row, col);

        if (/^[a-zA-Z]$/.test(event.key) && filledGrid[key]) {
            event.preventDefault();

            const bestDirection = getBestDirection(row, col, activeDirection);
            setActiveDirection(bestDirection);

            const nextCell = findAdjacentCell(row, col, bestDirection, 1);

            if (!nextCell) {
                blurActiveCell();
                return;
            }

            const nextKey = getCellKey(nextCell.row, nextCell.col);

            const nextFilledGrid = {
                ...filledGrid,
                [nextKey]: event.key.toUpperCase(),
            };

            setFilledGrid(nextFilledGrid);
            saveProgress(nextFilledGrid);

            const afterNextCell = findAdjacentCell(
                nextCell.row,
                nextCell.col,
                bestDirection,
                1
            );

            if (afterNextCell) {
                focusCell(afterNextCell.row, afterNextCell.col);
            } else {
                blurActiveCell();
            }

            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            setActiveDirection("across");

            const nextCell = findAdjacentCell(row, col, "across", 1);

            if (nextCell) {
                focusCell(nextCell.row, nextCell.col);
            }

            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            setActiveDirection("across");

            const previousCell = findAdjacentCell(row, col, "across", -1);

            if (previousCell) {
                focusCell(previousCell.row, previousCell.col);
            }

            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveDirection("down");

            const nextCell = findAdjacentCell(row, col, "down", 1);

            if (nextCell) {
                focusCell(nextCell.row, nextCell.col);
            }

            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveDirection("down");

            const previousCell = findAdjacentCell(row, col, "down", -1);

            if (previousCell) {
                focusCell(previousCell.row, previousCell.col);
            }

            return;
        }

        if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();

            const nextFilledGrid = { ...filledGrid };
            delete nextFilledGrid[key];

            setFilledGrid(nextFilledGrid);
            saveProgress(nextFilledGrid);

            const previousCell = findAdjacentCell(
                row,
                col,
                activeDirection,
                -1
            );

            if (previousCell) {
                focusCell(previousCell.row, previousCell.col);
            } else {
                blurActiveCell();
            }

            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            setActiveDirection((current) =>
                current === "across" ? "down" : "across"
            );

            return;
        }
    }

    function isPuzzleCorrect() {
        if (!puzzle) {
            return false;
        }

        for (let row = 0; row < puzzle.grid_size; row += 1) {
            for (let col = 0; col < puzzle.grid_size; col += 1) {
                const solutionLetter = puzzle.solution_data[row][col];

                if (!solutionLetter) {
                    continue;
                }

                const userLetter = filledGrid[getCellKey(row, col)];

                if (userLetter !== solutionLetter) {
                    return false;
                }
            }
        }

        return true;
    }

    async function finishPuzzle() {
        if (!puzzle || !attempt || !userId) {
            return;
        }

        if (attempt.completed && !attempt.failed) {
            setShowCompletionOverlay(true);
            return;
        }

        const correct = isPuzzleCorrect();

        if (correct && !attempt.failed) {
            const { data, error } = await supabase
                .from("crossword_attempts")
                .update({
                    completed: true,
                    completed_at: new Date().toISOString(),
                    filled_grid_data: filledGrid,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", attempt.id)
                .eq("user_id", userId)
                .select("*")
                .single();

            if (error || !data) {
                setMessage("Puzzle solved, but the result could not be saved.");
                return;
            }

            setAttempt(data as CrosswordAttempt);
            setShowCompletionOverlay(true);
            return;
        }

        if (correct && attempt.failed) {
            setShowCompletionOverlay(true);
            return;
        }

        const nextIncorrectSubmissions = attempt.incorrect_submissions + 1;
        const nextFailed =
            nextIncorrectSubmissions >= MAX_INCORRECT_SUBMISSIONS ||
            attempt.failed;

        const { data, error } = await supabase
            .from("crossword_attempts")
            .update({
                incorrect_submissions: nextIncorrectSubmissions,
                failed: nextFailed,
                filled_grid_data: filledGrid,
                updated_at: new Date().toISOString(),
            })
            .eq("id", attempt.id)
            .eq("user_id", userId)
            .select("*")
            .single();

        if (error || !data) {
            setMessage("Incorrect submission could not be saved.");
            return;
        }

        setAttempt(data as CrosswordAttempt);
    }

    function clearBoard() {
        if (attempt?.completed) {
            return;
        }

        setFilledGrid({});
        saveProgress({});
        blurActiveCell();
    }

    function renderClues(
        title: string,
        direction: Direction,
        clues: CrosswordEntry[]
    ) {
        return (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
                <h3 className="text-lg font-semibold text-white">{title}</h3>

                <div className="mt-4 space-y-3">
                    {clues.map((clue) => (
                        <p
                            key={`${direction}-${clue.number}`}
                            className="text-sm leading-6 text-neutral-400"
                        >
                            <span className="font-semibold text-white">
                                {clue.number}.
                            </span>{" "}
                            {clue.clue}
                        </p>
                    ))}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <main className="flex-1 bg-neutral-950 px-6 py-20 text-white">
                <p className="text-center text-neutral-400">{message}</p>
            </main>
        );
    }

    if (!puzzle) {
        return (
            <main className="flex-1 bg-neutral-950 px-6 py-20 text-white">
                <section className="mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl font-bold">Weekly Crossword</h1>
                    <p className="mt-5 text-neutral-400">{message}</p>
                </section>
            </main>
        );
    }

    return (
        <main className="flex-1 bg-neutral-950 text-white">
            <section className="mx-auto max-w-7xl px-3 py-20 sm:px-6">
                <Link
                    href="/weekly-games"
                    className="text-sm text-neutral-400 transition hover:text-white"
                >
                    ← Back to Weekly Games
                </Link>

                <div className="mt-10">
                    <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                        Weekly Crossword
                    </p>

                    <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                        Week {puzzle.week_number}
                    </h1>

                    <p className="mt-4 text-neutral-400">
                        {formatDate(puzzle.week_start_date)} -{" "}
                        {formatDate(puzzle.week_end_date)}
                    </p>
                </div>

                <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,42rem)_24rem] xl:justify-center">
                    <div className="rounded-3xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/25 p-5">
                        <div
                            className="mx-auto grid max-w-115 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
                            style={{
                                gridTemplateColumns: `repeat(${puzzle.grid_size}, minmax(0, 1fr))`,
                            }}
                        >
                            {puzzle.solution_data.map((row, rowIndex) =>
                                row.map((solutionLetter, colIndex) => {
                                    const key = getCellKey(rowIndex, colIndex);
                                    const startNumber = startNumbers[key];

                                    if (!solutionLetter) {
                                        return (
                                            <div
                                                key={key}
                                                className="aspect-square border border-neutral-900 bg-neutral-950"
                                            />
                                        );
                                    }

                                    return (
                                        <label
                                            key={key}
                                            className="relative aspect-square border border-neutral-400 bg-neutral-100 text-neutral-950"
                                        >
                                            {startNumber && (
                                                <span className="absolute left-1 top-0.5 text-[10px] font-bold text-neutral-600 sm:text-xs">
                                                    {startNumber}
                                                </span>
                                            )}

                                            <input
                                                id={getInputId(
                                                    rowIndex,
                                                    colIndex
                                                )}
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="characters"
                                                spellCheck={false}
                                                name={`crossword-${rowIndex}-${colIndex}`}
                                                value={filledGrid[key] ?? ""}
                                                onFocus={(event) => {
                                                    setActiveCell(key);

                                                    const inputLength =
                                                        event.currentTarget.value
                                                            .length;

                                                    event.currentTarget.setSelectionRange(
                                                        inputLength,
                                                        inputLength
                                                    );
                                                }}
                                                onClick={(event) => {
                                                    setActiveCell(key);

                                                    const inputLength =
                                                        event.currentTarget.value
                                                            .length;

                                                    event.currentTarget.setSelectionRange(
                                                        inputLength,
                                                        inputLength
                                                    );
                                                }}
                                                onChange={(event) =>
                                                    handleCellChange(
                                                        rowIndex,
                                                        colIndex,
                                                        event.target.value
                                                    )
                                                }
                                                onKeyDown={(event) =>
                                                    handleCellKeyDown(
                                                        rowIndex,
                                                        colIndex,
                                                        event
                                                    )
                                                }
                                                disabled={
                                                    attempt?.completed === true
                                                }
                                                className="h-full w-full bg-transparent text-center text-lg font-bold uppercase outline-none transition focus:bg-blue-200 disabled:cursor-not-allowed sm:text-2xl"
                                                maxLength={1}
                                            />
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <div className="rounded-2xl border border-purple-900/50 bg-purple-950/20 px-5 py-3 text-center">
                                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                    Incorrect Submissions
                                </p>
                                <p className="mt-1 text-xl font-bold text-white">
                                    {attempt?.incorrect_submissions ?? 0}/
                                    {MAX_INCORRECT_SUBMISSIONS}
                                </p>
                            </div>

                            <button
                                onClick={finishPuzzle}
                                disabled={
                                    !userId || attempt?.completed === true
                                }
                                className="rounded-full bg-linear-to-r from-purple-500 via-blue-600 to-blue-700 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-linear-to-br active:scale-[0.98] disabled:cursor-not-allowed disabled:from-neutral-700 disabled:via-neutral-700 disabled:to-neutral-700 disabled:text-neutral-400 disabled:shadow-none"
                            >
                                Finished
                            </button>

                            <button
                                onClick={clearBoard}
                                disabled={attempt?.completed === true}
                                className="rounded-full border border-red-500/60 bg-red-500/10 px-6 py-3 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Clear Board
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {renderClues(
                            "Across",
                            "across",
                            puzzle.clues_data.across
                        )}
                        {renderClues(
                            "Down",
                            "down",
                            puzzle.clues_data.down
                        )}
                    </div>
                </div>

                {showCompletionOverlay && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 px-6 backdrop-blur-sm">
                        <div className="max-w-md rounded-3xl border border-blue-900/60 bg-neutral-950 p-8 text-center shadow-2xl">
                            <p className="text-sm uppercase tracking-[0.25em] text-blue-300">
                                Crossword Complete
                            </p>

                            <h2 className="mt-4 text-3xl font-bold">
                                {attempt?.failed
                                    ? "Completed after failing"
                                    : "Solved!"}
                            </h2>

                            <p className="mt-4 leading-7 text-neutral-400">
                                {attempt?.failed
                                    ? "You finished the crossword, but this week does not count as a solve because the mistake limit was reached."
                                    : "This has been saved to your account."}
                            </p>

                            <button
                                onClick={() =>
                                    setShowCompletionOverlay(false)
                                }
                                className="mt-7 rounded-full border border-blue-500/60 bg-blue-500/10 px-6 py-3 text-sm font-medium text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/20 active:scale-[0.98]"
                            >
                                See Board
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}