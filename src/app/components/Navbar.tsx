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
            <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
                <p className="text-xl font-bold tracking-wide sm:text-2xl">
                    <Link href="/">AVGCO</Link>
                </p>

                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/games"
                        className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <span className="relative rounded-full bg-neutral-950 px-5 py-2.5 transition-all duration-200 group-hover:bg-transparent">
                            Games
                        </span>
                    </Link>

                    <Link
                        href="/weekly-games"
                        className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-cyan-500 to-emerald-500 p-0.5 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                        <span className="relative rounded-full bg-neutral-950 px-5 py-2.5 transition-all duration-200 group-hover:bg-transparent">
                            Weekly
                        </span>
                    </Link>
                </div>

                <Link
                    href="/account"
                    className="rounded-full border border-cyan-900/40 bg-linear-to-r from-slate-800 via-slate-700 to-cyan-900/70 px-4 py-2 text-sm text-neutral-200 shadow-sm shadow-cyan-950/20 transition hover:border-cyan-700/60 hover:from-slate-700 hover:via-slate-700 hover:to-cyan-800/70 hover:text-white"
                >
                    {isSignedIn ? "Account" : "Sign In"}
                </Link>
            </div>
        </nav>
    );
}