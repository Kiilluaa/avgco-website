export default function GamesPage() {
  return (
    <main className="flex-1 bg-neutral-950 text-white">
        <section className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">Games</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Play the Average Company Games</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">Explore original browser games as they are released.</p>
            <div className="mt-12 grid gap-6">
                <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
                    <div className="flex items-center justify-between">
                        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Card Game</p>
                        <p className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300">In development</p>
                    </div>
                    <h2 className="mt-8 text-2xl font-semibold">Blackjack</h2>
                    <p className="mt-4 max-w-xl leading-7 text-neutral-400">
                        This will be an originally made version of the classic game Blackjack.
                    </p>
                    <button className="mt-8 rounded-full border border-neutral-700 px-5 py-2.5 text-sm text-neutral-400">Coming Soon</button>
                </article>
            </div>
        </section>
    </main>
  );
}