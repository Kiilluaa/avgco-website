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

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
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

export default function AccountPage() {
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [sudokuStats, setSudokuStats] =
    useState<SudokuStats>(emptySudokuStats);

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

  async function loadAccountData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUserEmail(session?.user.email ?? null);

    if (session?.user.id) {
      await loadProfile(session.user.id);
      await loadSudokuStats();
    } else {
      setProfileUsername(null);
      setSudokuStats(emptySudokuStats);
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
      } else {
        setProfileUsername(null);
        setSudokuStats(emptySudokuStats);
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
      setSudokuStats(emptySudokuStats);
    }

    setLoading(false);
  }

  function renderBestResult(difficulty: Difficulty) {
    const bestResult = sudokuStats.bestByDifficulty[difficulty];

    if (!bestResult) {
      return (
        <p className="mt-2 text-xl font-semibold text-neutral-500">--</p>
      );
    }

    return (
      <>
        <p className="mt-2 text-xl font-semibold text-white">
          {formatTime(bestResult.elapsed_seconds)}
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          {bestResult.mistakes} mistake{bestResult.mistakes === 1 ? "" : "s"}
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
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          Account
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Your Player Profile
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
          Sign in to view saved game progress, player stats, and future AVGCO
          account features.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/30 p-7">
            {userEmail ? (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
                  Signed In
                </p>

                <h2 className="mt-4 text-2xl font-semibold">Welcome back</h2>

                <p className="mt-4 leading-7 text-neutral-400">
                  Username:{" "}
                  <span className="font-medium text-white">
                    {profileUsername ?? "Loading..."}
                  </span>
                  <br />
                  Email:{" "}
                  <span className="font-medium text-white">{userEmail}</span>
                </p>

                <button
                  onClick={signOut}
                  disabled={loading}
                  className="mt-8 rounded-full border border-red-500/60 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
                  Sign In
                </p>

                <h2 className="mt-4 text-2xl font-semibold">
                  Access your account
                </h2>

                <p className="mt-4 leading-7 text-neutral-400">
                  Enter your username and password to sign in.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-sm text-neutral-300">Username</span>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(event) =>
                        setLoginUsername(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                      placeholder="Username"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                      placeholder="••••••••"
                    />
                  </label>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={signIn}
                    disabled={loading || !loginUsername || !password}
                    className="rounded-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 transition hover:bg-linear-to-br active:scale-[0.98] disabled:cursor-not-allowed disabled:from-neutral-700 disabled:via-neutral-700 disabled:to-neutral-700 disabled:text-neutral-400 disabled:shadow-none"
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

          {userEmail && (
            <div className="rounded-3xl border border-cyan-900/50 bg-linear-to-br from-neutral-900 to-cyan-950/25 p-7">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Sudoku Stats
              </p>

              <h2 className="mt-4 text-2xl font-semibold">
                Saved completions
              </h2>

              <p className="mt-4 leading-7 text-neutral-400">
                Your best Sudoku times are ranked by fastest time.
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
                className="mt-6 inline-flex rounded-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 transition hover:bg-linear-to-br active:scale-[0.98]"
              >
                Play Sudoku
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}