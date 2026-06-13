import Link from "next/link";

export default function WeeklyGamesPage() {
  return (
    <main className="flex-1 bg-neutral-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          Weekly Games
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Games that refresh each week
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
          Play limited time weekly games!
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-purple-900/50 bg-linear-to-br from-neutral-900 to-purple-950/30 p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-300">
              Weekly
            </p>

            <h2 className="mt-4 text-2xl font-semibold">Crossword</h2>

            <p className="mt-4 leading-7 text-neutral-400">
              Solve this weeks Crossword from Sunday through Saturday.
            </p>

            <Link
              href="/weekly-games/crossword"
              className="mt-8 inline-flex rounded-full bg-linear-to-r from-purple-500 via-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-linear-to-br active:scale-[0.98]"
            >
              Play
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}