"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsSignedIn(Boolean(session));
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/90">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-6 sm:py-5">
        <p className="justify-self-start text-xl font-bold tracking-wide sm:text-2xl">
          <Link href="/">AVGCO</Link>
        </p>

        <Link
          href="/games"
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <span className="relative rounded-full bg-neutral-950 px-5 py-2.5 transition-all duration-200 group-hover:bg-transparent">
            Games
          </span>
        </Link>

        <Link
          href="/account"
          className="justify-self-end rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-neutral-400 hover:text-white"
        >
          {isSignedIn ? "Account" : "Sign In"}
        </Link>
      </div>
    </nav>
  );
}