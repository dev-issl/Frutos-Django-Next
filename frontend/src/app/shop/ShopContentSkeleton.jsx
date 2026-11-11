/**
 * Two-column Shop body placeholder displayed below the already-rendered
 * ShopHeroBanner while product catalog data streams in.
 */
export default function ShopContentSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 pb-14"
    >
      <div className="flex flex-col md:flex-row items-start gap-5 lg:gap-6">
        {/* Sidebar filter skeleton */}
        <aside className="hidden md:block w-[248px] lg:w-[260px] shrink-0 space-y-4">
          <div className="rounded-[20px] bg-white border border-[#E3EDE2] p-5 space-y-5">
            <div className="h-5 w-28 rounded-md bg-[#E1ECD9] animate-pulse" />
            <div className="space-y-2.5">
              {[88, 72, 64, 78, 56].map((w, idx) => (
                <div
                  key={idx}
                  className="h-3.5 rounded-full bg-[#E8F1E3] animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <div className="h-px bg-[#EDF4EA]" />
            <div className="h-5 w-24 rounded-md bg-[#E1ECD9] animate-pulse" />
            <div className="space-y-2.5">
              {[75, 85, 60].map((w, idx) => (
                <div
                  key={idx}
                  className="h-3.5 rounded-full bg-[#E8F1E3] animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Product toolbar + grid skeleton */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5">
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 rounded-full bg-[#DDEBD6] animate-pulse" />
              <div className="h-9 w-40 rounded-full bg-[#E6EFE2] animate-pulse" />
              <div className="h-9 w-36 rounded-full bg-[#E6EFE2] animate-pulse" />
            </div>
            <div className="h-9 w-20 rounded-full bg-[#E6EFE2] animate-pulse" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#E3EDE2] overflow-hidden p-3 space-y-3"
              >
                <div className="aspect-square w-full rounded-xl bg-[#EAF2E5] animate-pulse" />
                <div className="h-3.5 w-3/4 rounded-full bg-[#E1ECD9] animate-pulse" />
                <div className="h-3 w-1/2 rounded-full bg-[#EAF2E5] animate-pulse" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-4 w-14 rounded-md bg-[#DDEBD6] animate-pulse" />
                  <div className="h-8 w-8 rounded-full bg-[#E1ECD9] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

