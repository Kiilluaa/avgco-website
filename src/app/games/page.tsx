import Link from "next/link";

export default function GamesPage() {
  return (
    <main className="flex-1 bg-neutral-950 text-white">
        <section className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">Games</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Play the Average Company Games</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">Explore original browser games as they are released.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
                <article className="flex h-full flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
                    <div className="flex items-center justify-between">
                        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Card Game</p>
                        <p className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300">Playable</p>
                    </div>
                    <h2 className="mt-8 text-2xl font-semibold">Blackjack</h2>
                    <p className="mt-4 max-w-xl leading-7 text-neutral-400">
                        Play the classic game of blackjack with a three deck shoe. Closest to 21 wins. 
                        More expected to be added soon.
                    </p>
                    <div className="mt-auto pt-8">
                        <Link
                            href="/games/blackjack"
                            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <span className="relative rounded-full bg-neutral-900 px-5 py-2.5 transition-all duration-200 group-hover:bg-transparent">
                                Play
                            </span>
                        </Link>
                    </div>
                </article>

                <article className="flex h-full flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
                    <div className="flex items-center justify-between">
                        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
                            Puzzle Game
                        </p>

                        <p className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300">
                            Playable
                        </p>
                    </div>

                    <h2 className="mt-8 text-2xl font-semibold">Sudoku</h2>

                    <p className="mt-4 max-w-xl leading-7 text-neutral-400">
                        Play Sudoku with multiple difficulty levels.
                        More expected to be added soon.
                    </p>

                    <div className="mt-auto pt-8">
                        <Link
                            href="/games/sudoku"
                            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <span className="relative rounded-full bg-neutral-900 px-5 py-2.5 transition-all duration-200 group-hover:bg-transparent">
                                Play
                            </span>
                        </Link>
                    </div>
                </article>
            </div>
        </section>
    </main>
  );
}