"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function CreateAccountPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("Create your AVGCO account.");
  const [loading, setLoading] = useState(false);

  async function createAccount() {
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !email || !password) {
      setMessage("Enter a username, email, and password.");
      return;
    }

    if (cleanUsername.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setMessage("Username can only use lowercase letters, numbers, and underscores.");
      return;
    }

    setLoading(true);
    setMessage("Creating account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created. Check your email to confirm your account.");
      setUsername("");
      setEmail("");
      setPassword("");
    }

    setLoading(false);
  }

  return (
    <main className="flex-1 bg-neutral-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Link
          href="/account"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Back to Sign In
        </Link>

        <p className="mt-10 text-sm uppercase tracking-[0.25em] text-neutral-500">
          Create Account
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Join AVGCO
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
          Create an account to prepare for saved game progress, player stats,
          and future account features.
        </p>

        <div className="mt-12 max-w-xl rounded-3xl border border-blue-900/50 bg-linear-to-br from-neutral-900 to-blue-950/30 p-7">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
            New Player
          </p>

          <h2 className="mt-4 text-2xl font-semibold">Create your account</h2>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-neutral-300">Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                placeholder="Username"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                placeholder="Email"
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

          <button
            onClick={createAccount}
            disabled={loading || !username || !email || !password}
            className="mt-8 rounded-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 transition hover:bg-linear-to-br active:scale-[0.98] disabled:cursor-not-allowed disabled:from-neutral-700 disabled:via-neutral-700 disabled:to-neutral-700 disabled:text-neutral-400 disabled:shadow-none"
          >
            Create Account
          </button>

          <p className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-400">
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}