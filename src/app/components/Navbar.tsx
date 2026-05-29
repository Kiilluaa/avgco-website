import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/90">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-6 sm:py-5">
            <p className="justify-self-start text-xl font-bold tracking-wide sm:text-2xl">
                <Link href="/">AVGCO</Link>
            </p>

            <Link href="/games" className="text-sm text-neutral-300 transition hover:text-white">
                Games
            </Link>

            <Link href="/account" className="justify-self-end rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-neutral-400 hover:text-white">
                Sign In
            </Link>
        </div>
    </nav>
  )
}