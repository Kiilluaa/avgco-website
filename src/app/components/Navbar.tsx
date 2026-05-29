import Link from "next/link";

export default function Navbar() {
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

            <Link href="/account" className="justify-self-end rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-neutral-400 hover:text-white">
                Sign In
            </Link>
        </div>
    </nav>
  )
}