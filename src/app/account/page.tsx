"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type Difficulty = "Easy" | "Medium" | "Hard";

type SudokuCompletion = {
    difficulty: Difficulty;
    elapsed_seconds: number;
    mistakes: number;
    completed_at: string;
};

type BestSudokuResult = {
    elapsed_seconds: number;
    mistakes: number;
    completed_at: string;
};

type SudokuStats = {
    totalCompleted: number;
    completedByDifficulty: Record<Difficulty, number>;
    bestByDifficulty: Record<Difficulty, BestSudokuResult | null>;
};

type CrosswordPuzzleSummary = {
    week_number: number;
    week_start_date: string;
    week_end_date: string;
};

type CrosswordAttemptWithPuzzle = {
    completed: boolean;
    failed: boolean;
    incorrect_submissions: number;
    completed_at: string | null;
    crossword_puzzles: CrosswordPuzzleSummary | CrosswordPuzzleSummary[] | null;
};

type CrosswordHistoryItem = {
    weekNumber: number;
    weekStartDate: string;
    weekEndDate: string;
    status: "Solved" | "Failed" | "In Progress";
    incorrectSubmissions: number;
};

type CrosswordStats = {
    solved: number;
    currentStreak: number;
    history: CrosswordHistoryItem[];
};

const emptySudokuStats: SudokuStats = {
    totalCompleted: 0,
    completedByDifficulty: {
        Easy: 0,
        Medium: 0,
        Hard: 0,
    },
    bestByDifficulty: {
        Easy: null,
        Medium: null,
        Hard: null,
    },
};

const emptyCrosswordStats: CrosswordStats = {
    solved: 0,
    currentStreak: 0,
    history: [],
};

function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function calculateSudokuStats(completions: SudokuCompletion[]): SudokuStats {
    const stats: SudokuStats = {
        totalCompleted: completions.length,
        completedByDifficulty: {
            Easy: 0,
            Medium: 0,
            Hard: 0,
        },
        bestByDifficulty: {
            Easy: null,
            Medium: null,
            Hard: null,
        },
    };

    for (const completion of completions) {
        stats.completedByDifficulty[completion.difficulty] += 1;

        const currentBest = stats.bestByDifficulty[completion.difficulty];

        if (
            !currentBest ||
            completion.elapsed_seconds < currentBest.elapsed_seconds ||
            (completion.elapsed_seconds === currentBest.elapsed_seconds &&
                completion.mistakes < currentBest.mistakes)
        ) {
            stats.bestByDifficulty[completion.difficulty] = {
                elapsed_seconds: completion.elapsed_seconds,
                mistakes: completion.mistakes,
                completed_at: completion.completed_at,
            };
        }
    }

    return stats;
}

function getPuzzleSummary(
    attempt: CrosswordAttemptWithPuzzle
): CrosswordPuzzleSummary | null {
    if (!attempt.crossword_puzzles) {
        return null;
    }

    if (Array.isArray(attempt.crossword_puzzles)) {
        return attempt.crossword_puzzles[0] ?? null;
    }

    return attempt.crossword_puzzles;
}

function calculateCrosswordStats(
    attempts: CrosswordAttemptWithPuzzle[]
): CrosswordStats {
    const history: CrosswordHistoryItem[] = attempts
        .map((attempt) => {
            const puzzle = getPuzzleSummary(attempt);

            if (!puzzle) {
                return null;
            }

            let status: CrosswordHistoryItem["status"] = "In Progress";

            if (attempt.completed && !attempt.failed) {
                status = "Solved";
            } else if (attempt.failed) {
                status = "Failed";
            }

            return {
                weekNumber: puzzle.week_number,
                weekStartDate: puzzle.week_start_date,
                weekEndDate: puzzle.week_end_date,
                status,
                incorrectSubmissions: attempt.incorrect_submissions,
            };
        })
        .filter((item): item is CrosswordHistoryItem => Boolean(item))
        .sort((first, second) => second.weekNumber - first.weekNumber);

    const solved = history.filter((item) => item.status === "Solved").length;

    const solvedWeeks = new Set(
        history
            .filter((item) => item.status === "Solved")
            .map((item) => item.weekNumber)
    );

    const highestWeek = history[0]?.weekNumber ?? 0;
    let currentStreak = 0;

    for (let week = highestWeek; week > 0; week -= 1) {
        if (!solvedWeeks.has(week)) {
            break;
        }

        currentStreak += 1;
    }

    return {
        solved,
        currentStreak,
        history,
    };
}

export default function AccountPage() {
    const [loginUsername, setLoginUsername] = useState("");
    const [password, setPassword] = useState("");

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [profileUsername, setProfileUsername] = useState<string | null>(null);
    const [showEmail, setShowEmail] = useState(false);

    const [sudokuStats, setSudokuStats] = useState<SudokuStats>(emptySudokuStats);
    const [crosswordStats, setCrosswordStats] =
        useState<CrosswordStats>(emptyCrosswordStats);

    const [message, setMessage] = useState("Sign in to your AVGCO account.");
    const [loading, setLoading] = useState(false);

    async function loadProfile(userId: string) {
        const { data, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", userId)
            .single();

        if (error) {
            setProfileUsername("Profile not found");
            return;
        }

        setProfileUsername(data.username);
    }

    async function loadSudokuStats() {
        const { data, error } = await supabase
            .from("sudoku_completions")
            .select("difficulty, elapsed_seconds, mistakes, completed_at")
            .order("elapsed_seconds", { ascending: true });

        if (error || !data) {
            setSudokuStats(emptySudokuStats);
            return;
        }

        setSudokuStats(calculateSudokuStats(data as SudokuCompletion[]));
    }

    async function loadCrosswordStats() {
        const { data, error } = await supabase
            .from("crossword_attempts")
            .select(
                "completed, failed, incorrect_submissions, completed_at, crossword_puzzles(week_number, week_start_date, week_end_date)"
            );

        if (error || !data) {
            setCrosswordStats(emptyCrosswordStats);
            return;
        }

        setCrosswordStats(
            calculateCrosswordStats(data as CrosswordAttemptWithPuzzle[])
        );
    }

    async function loadAccountData() {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        setUserEmail(session?.user.email ?? null);

        if (session?.user.id) {
            await loadProfile(session.user.id);
            await loadSudokuStats();
            await loadCrosswordStats();
        } else {
            setProfileUsername(null);
            setShowEmail(false);
            setSudokuStats(emptySudokuStats);
            setCrosswordStats(emptyCrosswordStats);
        }
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get("created") === "1") {
            setMessage("Account created. Check your email to confirm your account.");
        }

        loadAccountData();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserEmail(session?.user.email ?? null);

            if (session?.user.id) {
                loadProfile(session.user.id);
                loadSudokuStats();
                loadCrosswordStats();
            } else {
                setProfileUsername(null);
                setShowEmail(false);
                setSudokuStats(emptySudokuStats);
                setCrosswordStats(emptyCrosswordStats);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function signIn() {
        const cleanUsername = loginUsername.trim().toLowerCase();

        if (!cleanUsername || !password) {
            setMessage("Enter your username and password.");
            return;
        }

        setLoading(true);
        setMessage("Signing in...");

        const { data: emailForUsername, error: lookupError } = await supabase.rpc(
            "get_email_for_username",
            {
                input_username: cleanUsername,
            }
        );

        if (lookupError || !emailForUsername) {
            setMessage("Invalid username or password.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: emailForUsername,
            password,
        });

        if (error) {
            setMessage("Invalid username or password.");
        } else {
            setMessage("Signed in successfully.");
            setPassword("");
            await loadAccountData();
        }

        setLoading(false);
    }

    async function signOut() {
        setLoading(true);

        const { error } = await supabase.auth.signOut();

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Signed out successfully.");
            setLoginUsername("");
            setPassword("");
            setProfileUsername(null);
            setShowEmail(false);
            setSudokuStats(emptySudokuStats);
            setCrosswordStats(emptyCrosswordStats);
        }

        setLoading(false);
    }

    function renderBestResult(difficulty: Difficulty) {
        const bestResult = sudokuStats.bestByDifficulty[difficulty];

        if (!bestResult) {
            return <p className="mt-2 text-xl font-semibold text-neutral-500">--</p>;
        }

        return (
            <>
                <p className="mt-2 text-xl font-semibold text-white">
                    {formatTime(bestResult.elapsed_seconds)}
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                    {bestResult.mistakes} mistake
                    {bestResult.mistakes === 1 ? "" : "s"}
                </p>
            </>
        );
    }

    function renderDifficultyCard(
        difficulty: Difficulty,
        colorClasses: {
            border: string;
            gradient: string;
            label: string;
        }
    ) {
        return (
            <div
                className={`rounded-2xl border ${colorClasses.border} bg-linear-to-br ${colorClasses.gradient} p-4 text-center`}
            >
                <p className={`text-xs uppercase tracking-[0.2em] ${colorClasses.label}`}>
                    {difficulty}
                </p>

                <p className="mt-2 text-sm text-neutral-400">
                    Completed:{" "}
                    <span className="font-semibold text-white">
                        {sudokuStats.completedByDifficulty[difficulty]}
                    </span>
                </p>

                <div className="mt-3 border-t border-neutral-800 pt-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Best Time
                    </p>
                    {renderBestResult(difficulty)}
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 bg-neutral-950 text-white">
            <section className="mx-auto max-w-6xl px-6 py-20">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                            Account
                        </p>

                        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                            Your Player Profile
                        </h1>

                        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                            View your saved game progress, weekly game history, and
                            AVGCO player stats.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/30 p-6">
                        {userEmail ? (
                            <>
                                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
                                    Signed In
                                </p>

                                <h2 className="mt-3 text-2xl font-semibold">
                                    Welcome back
                                </h2>

                                <div className="mt-4 text-sm leading-7 text-neutral-400">
                                    <p>
                                        Username:{" "}
                                        <span className="font-medium text-white">
                                            {profileUsername ?? "Loading..."}
                                        </span>
                                    </p>

                                    <div className="mt-2 flex items-center gap-2">
                                        <p>
                                            Email:{" "}
                                            <span className="font-medium text-white">
                                                {showEmail ? userEmail : "• • • • • •"}
                                            </span>
                                        </p>

                                        <button
                                            onClick={() =>
                                                setShowEmail((current) => !current)
                                            }
                                            aria-label={
                                                showEmail ? "Hide email" : "Show email"
                                            }
                                            title={
                                                showEmail ? "Hide email" : "Show email"
                                            }
                                            className="rounded-full border border-neutral-700 p-1.5 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                                        >
                                            {showEmail ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-4"
                                                >
                                                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 2 12 2 12a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A10.67 10.67 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                                                    <path d="M1 1l22 22" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-4"
                                                >
                                                    <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={signOut}
                                    disabled={loading}
                                    className="mt-6 rounded-full border border-red-500/60 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
                                    Sign In
                                </p>

                                <h2 className="mt-3 text-2xl font-semibold">
                                    Access your account
                                </h2>

                                <div className="mt-6 space-y-4">
                                    <label className="block">
                                        <span className="text-sm text-neutral-300">
                                            Username
                                        </span>
                                        <input
                                            type="text"
                                            value={loginUsername}
                                            onChange={(event) =>
                                                setLoginUsername(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                                            placeholder="username"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-neutral-300">
                                            Password
                                        </span>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                                            placeholder="••••••••"
                                        />
                                    </label>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <button
                                        onClick={signIn}
                                        disabled={
                                            loading || !loginUsername || !password
                                        }
                                        className="rounded-full bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-linear-to-br active:scale-[0.98] disabled:cursor-not-allowed disabled:from-neutral-700 disabled:via-neutral-700 disabled:to-neutral-700 disabled:text-neutral-400 disabled:shadow-none"
                                    >
                                        Sign In
                                    </button>

                                    <Link
                                        href="/account/create"
                                        className="rounded-full border border-blue-500/60 bg-blue-500/10 px-5 py-2.5 text-center text-sm font-medium text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/20 active:scale-[0.98]"
                                    >
                                        Create Account
                                    </Link>
                                </div>

                                <p className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
                                    {message}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {userEmail && (
                    <div className="mt-14">
                        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                            Game Stats
                        </p>

                        <h2 className="mt-4 text-3xl font-bold tracking-tight">
                            Your saved progress
                        </h2>

                        <div className="mt-8 grid gap-6 xl:grid-cols-2">
                            <div className="flex flex-col rounded-3xl border border-cyan-900/50 bg-linear-to-br from-neutral-900 to-cyan-950/25 p-7 xl:h-156">
                                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                                    Sudoku Stats
                                </p>

                                <h3 className="mt-4 text-2xl font-semibold">
                                    Completions
                                </h3>

                                <p className="mt-4 leading-7 text-neutral-400">
                                    Your Sudoku records track total completions,
                                    best times, and mistakes by difficulty.
                                </p>

                                <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-center">
                                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                        Total Completed
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-white">
                                        {sudokuStats.totalCompleted}
                                    </p>

                                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                        <p className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-3 py-2 text-cyan-200">
                                            Easy{" "}
                                            <span className="font-semibold text-white">
                                                {sudokuStats.completedByDifficulty.Easy}
                                            </span>
                                        </p>

                                        <p className="rounded-xl border border-blue-900/50 bg-blue-950/20 px-3 py-2 text-blue-200">
                                            Medium{" "}
                                            <span className="font-semibold text-white">
                                                {sudokuStats.completedByDifficulty.Medium}
                                            </span>
                                        </p>

                                        <p className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 px-3 py-2 text-indigo-200">
                                            Hard{" "}
                                            <span className="font-semibold text-white">
                                                {sudokuStats.completedByDifficulty.Hard}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {renderDifficultyCard("Easy", {
                                        border: "border-cyan-900/50",
                                        gradient: "from-neutral-950 to-cyan-950/25",
                                        label: "text-cyan-300",
                                    })}

                                    {renderDifficultyCard("Medium", {
                                        border: "border-blue-900/50",
                                        gradient: "from-neutral-950 to-blue-950/25",
                                        label: "text-blue-300",
                                    })}

                                    {renderDifficultyCard("Hard", {
                                        border: "border-indigo-900/50",
                                        gradient: "from-neutral-950 to-indigo-950/25",
                                        label: "text-indigo-300",
                                    })}
                                </div>

                                <Link
                                    href="/games/sudoku"
                                    className="mt-auto inline-flex w-fit rounded-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 transition hover:bg-linear-to-br active:scale-[0.98]"
                                >
                                    Play Sudoku
                                </Link>
                            </div>

                            <div className="flex min-h-0 flex-col rounded-3xl border border-emerald-900/50 bg-linear-to-br from-neutral-900 to-emerald-950/20 p-7 xl:h-156">
                                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
                                    Weekly Games
                                </p>

                                <h3 className="mt-4 text-2xl font-semibold">
                                    Crossword
                                </h3>

                                <p className="mt-4 leading-7 text-neutral-400">
                                    Weekly crossword stats track number solved,
                                    your current streak, and your weekly history.
                                </p>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-emerald-900/50 bg-neutral-950 p-5 text-center">
                                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                            Crosswords Solved
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-white">
                                            {crosswordStats.solved}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-teal-900/50 bg-neutral-950 p-5 text-center">
                                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                            Current Streak
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-white">
                                            {crosswordStats.currentStreak}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                                    <p className="shrink-0 text-xs uppercase tracking-[0.2em] text-neutral-500">
                                        Weekly History
                                    </p>

                                    {crosswordStats.history.length > 0 ? (
                                        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
                                            {crosswordStats.history.map((item) => (
                                                <div
                                                    key={item.weekNumber}
                                                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3"
                                                >
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            Week {item.weekNumber}
                                                        </p>

                                                        <p className="text-sm text-neutral-400">
                                                            {formatDate(item.weekStartDate)} -{" "}
                                                            {formatDate(item.weekEndDate)}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p
                                                            className={`text-sm font-semibold ${
                                                                item.status === "Solved"
                                                                    ? "text-emerald-300"
                                                                    : item.status === "Failed"
                                                                        ? "text-red-300"
                                                                        : "text-yellow-300"
                                                            }`}
                                                        >
                                                            {item.status}
                                                        </p>

                                                        <p className="text-xs text-neutral-500">
                                                            {item.incorrectSubmissions}/5 wrong
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-4 text-sm text-neutral-400">
                                            No weekly crossword history yet.
                                        </p>
                                    )}
                                </div>

                                <Link
                                    href="/weekly-games/crossword"
                                    className="mt-6 inline-flex w-fit shrink-0 rounded-full bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-linear-to-br active:scale-[0.98]"
                                >
                                    Play Weekly Crossword
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}