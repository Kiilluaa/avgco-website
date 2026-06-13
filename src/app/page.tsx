import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-neutral-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">

        <h2 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          A new home for games built by THEAVGCO
        </h2>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-400">
          Play original browser games, save your progress, and explore new
          releases as the platform grows
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/games"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-600 to-blue-500 p-0.5 font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <span className="relative rounded-full bg-neutral-950 px-7 py-3 transition-all duration-200 group-hover:bg-transparent">
              Browse Games
            </span>
          </Link>

          <button className="rounded-full border border-neutral-700 px-7 py-3 font-medium text-white transition hover:border-neutral-400">
            Coming Soon
          </button>
        </div>
      </section>
    </main>
  );
}