export default function MeetingsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* Cabeçalho */}
      <section className="pt-12 sm:pt-16">
        <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-10 w-48 animate-pulse rounded-lg bg-muted sm:h-12" />
      </section>

      {/* Layout */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar skeleton */}
        <div className="hidden flex-col gap-1 lg:flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="h-[68px] animate-pulse rounded-lg bg-muted"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>

        {/* Painel skeleton */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          <div className="mt-3 h-9 w-3/4 animate-pulse rounded-lg bg-muted sm:h-11" />
          <div className="mt-2 h-5 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="mt-6 h-6 w-28 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </main>
  )
}
