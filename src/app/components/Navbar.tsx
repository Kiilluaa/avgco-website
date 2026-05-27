import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <p className="text-2xl font-bold tracking-wide"><Link href="/">AVGCO</Link></p>

            <div className="hidden gap-8 text-sm text-neutral-300 sm:flex">
                <Link href="/games" className="transition hover:text-white">Games</Link>
                <Link href="/account" className="transition hover:text-white">Account</Link>
            </div>

            <Link href="/account" className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-neutral-400 hover:text-white">
                Sign In
            </Link>
        </div>
    </nav>
  )
}