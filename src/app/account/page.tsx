"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function AccountPage() {
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("created") === "1") {
      setMessage("Account created. Check your email to confirm your account.");
    }

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUserEmail(session?.user.email ?? null);

      if (session?.user.id) {
        loadProfile(session.user.id);
      } else {
        setProfileUsername(null);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);

      if (session?.user.id) {
        loadProfile(session.user.id);
      } else {
        setProfileUsername(null);
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
    }

    setLoading(false);
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
          Sign in to prepare for saved game progress, player stats, and future
          AVGCO account features.
        </p>

        <div className="mt-12 max-w-xl rounded-3xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/30 p-7">
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
                    onChange={(event) => setLoginUsername(event.target.value)}
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
                    placeholder="Password"
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
            </>
          )}

          <p className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}