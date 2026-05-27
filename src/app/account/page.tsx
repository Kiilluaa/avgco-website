export default function AccountPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
        <section className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">Account</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Your profile</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                Accuonts will allow you to save your current and past games.
            </p>
            <div className="mt-12 max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900 p-7">
                <h2 className="text-2xl font-semibold">Accounts Coming Soon</h2>
                <p className="mt-4 leading-7 text-neutral-400">
                    Registration and saved progress will be added for initial launch.
                </p>
                <div className="mt-8 flex gap-4">
                    <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950">Sign in</button>
                    <button className="rounded-full border border-neutral-700 px-5 py-2.5 text-sm text-neutral-300">Account</button>
                </div>
            </div>
        </section>
    </main>
  );
}