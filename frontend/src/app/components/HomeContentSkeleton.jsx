/**
 * Lightweight below-the-fold placeholder shown beneath the already-painted
 * HeroSection while product/offer sections stream in.
 */
export default function HomeContentSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10"
    >
      {/* Category row skeleton */}
      <div>
        <div className="h-7 w-48 rounded-lg bg-[#DFECE0] animate-pulse mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-[170px] rounded-2xl bg-[#E5F0E6] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Product showcase grid skeleton */}
      <div>
        <div className="h-7 w-56 rounded-lg bg-[#DFECE0] animate-pulse mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-[260px] rounded-2xl bg-[#E5F0E6] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

