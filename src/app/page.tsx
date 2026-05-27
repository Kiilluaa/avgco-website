import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <nav className="border-b border-neutral-800 bg-neutral-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold tracking-wide"><Link href="/">AVGCO</Link></h1>

          <div className="hidden gap-8 text-sm text-neutral-300 sm:flex">
            <Link href="/games" className="transition hover:text-white">Games</Link>
            <Link href="/account" className="transition hover:text-white">Account</Link>
          </div>

          <Link href="/account" className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-neutral-400 hover:text-white">
            Sign In
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <p className="mb-5 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
          Games, stories, and future releases
        </p>

        <h2 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          A new home for games built by AVGCO.
        </h2>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-400">
          Play original browser games, save your progress, and explore new
          releases as the platform grows.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/games" className="rounded-full bg-white px-7 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200">
            Browse Games
          </Link>

          <button className="rounded-full border border-neutral-700 px-7 py-3 font-medium text-white transition hover:border-neutral-400">
            Coming Soon
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Platform
            </p>
            <h3 className="mt-3 text-3xl font-semibold">
              What is being built
            </h3>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
            <p className="mb-4 text-sm text-neutral-500">01</p>
            <h4 className="text-xl font-semibold">Games Library</h4>
            <p className="mt-4 leading-7 text-neutral-400">
              A growing collection of playable browser games, beginning with
              smaller games and expanding into 2D story experiences.
            </p>
          </article>

          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
            <p className="mb-4 text-sm text-neutral-500">02</p>
            <h4 className="text-xl font-semibold">Player Accounts</h4>
            <p className="mt-4 leading-7 text-neutral-400">
              Accounts will allow players to keep progress, achievements, and
              game-specific save data across the platform.
            </p>
          </article>

          <article className="rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
            <p className="mb-4 text-sm text-neutral-500">03</p>
            <h4 className="text-xl font-semibold">New Releases</h4>
            <p className="mt-4 leading-7 text-neutral-400">
              A future space for AVGCO clothing, releases, and other products
              connected to the brand.
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-neutral-800 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-sm text-neutral-500 sm:flex-row">
          <p>© 2026 AVGCO. All rights reserved.</p>
          <p>Platform currently in development.</p>
        </div>
      </footer>
    </main>
  );
}