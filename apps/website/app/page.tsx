export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-ink-primary">
        Motivate Your Kids
      </h1>
      <p className="mt-4 max-w-lg text-lg text-ink-secondary">
        A fun, simple rewards app that helps parents encourage great behavior
        with stars, badges, and custom rewards.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="https://app.motivationlabs.ai"
          className="rounded-xl bg-brand px-6 py-3 font-bold text-white shadow-brand hover:bg-brand-hover transition"
        >
          Open App
        </a>
        <a
          href="#features"
          className="rounded-xl border-2 border-line px-6 py-3 font-bold text-ink-primary hover:bg-white transition"
        >
          Learn More
        </a>
      </div>
    </main>
  )
}
