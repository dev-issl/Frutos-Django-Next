import HeroSection from './components/HeroSection'
import AboutStyles from './components/AboutStyles'

/**
 * Displays the About hero right away on client navigation while dynamic data resolves.
 */
export default function AboutLoading() {
  return (
    <div className="about-page-canvas min-h-screen overflow-x-clip">
      <AboutStyles />
      <HeroSection />

      {/* Stats bar skeleton */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 pb-8">
        <div className="rounded-[16px] bg-[#10422D] h-[86px] px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="flex items-center gap-3 justify-center">
              <div className="w-9 h-9 rounded-xl bg-white/10 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-5 w-14 rounded bg-white/15 animate-pulse" />
                <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values skeleton */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-6 w-40 rounded-lg bg-[#DDE8D6] animate-pulse mx-auto mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-[146px] rounded-[14px] bg-[#FAFDF8] border border-[#E1EBDD] p-5 space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-[#E3EEE1] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[#DDE8D6] animate-pulse" />
              <div className="h-3 w-full rounded bg-[#E7F0E3] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
