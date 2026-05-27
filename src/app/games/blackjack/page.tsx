import Link from "next/link";

export default function BlackjackPage() {
  return (
    <main className="flex-1 bg-neutral-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Link
          href="/games"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Back to Games
        </Link>

        <div className="mt-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-8 sm:p-12">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
                Card Game
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Blackjack
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                An AVGCO version of the classic card game. The playable game,
                player statistics, and saved progress will be added here as
                development continues.
              </p>
            </div>

            <p className="w-fit rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300">
              In Development
            </p>
          </div>

          <div className="mt-12 flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-neutral-700 bg-neutral-950">
            <div className="max-w-md px-6 text-center">
              <p className="text-xl font-semibold">Game Area Coming Soon</p>
              <p className="mt-4 leading-7 text-neutral-400">
                This section will eventually contain the playable Blackjack
                table, cards, player controls, and score display.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}