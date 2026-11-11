/**
 * Two-column skeleton shown under the Stores hero while store locations stream in.
 */
export default function StoresFinderSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="max-w-[1320px] mx-auto px-2.5 sm:px-6 lg:px-8 pb-6 sm:pb-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[365px_1fr] xl:grid-cols-[380px_1fr] gap-3.5 sm:gap-5 items-stretch">
        <aside className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#DCE8DF] p-2.5 sm:p-4 flex flex-col lg:h-[515px] xl:h-[535px] space-y-3">
          <div className="h-10 w-full rounded-xl bg-[#EAF2EC] animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-full bg-[#E1EDE4] animate-pulse" />
            <div className="h-8 w-16 rounded-full bg-[#EAF2EC] animate-pulse" />
            <div className="h-8 w-16 rounded-full bg-[#EAF2EC] animate-pulse" />
          </div>
          <div className="space-y-3 pt-1">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="flex gap-3 p-3 rounded-xl border border-[#E7EFE9]"
              >
                <div className="w-16 h-16 rounded-xl bg-[#E5EFE8] shrink-0 animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded bg-[#DDEADF] animate-pulse" />
                  <div className="h-3 w-full rounded bg-[#EAF2EC] animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-[#EAF2EC] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="bg-white rounded-[16px] sm:rounded-[20px] border border-[#DCE8DF] p-1.5 sm:p-2 h-[290px] sm:h-[460px] lg:h-[515px] xl:h-[535px]">
          <div className="w-full h-full rounded-[14px] bg-[#E7F2EA] animate-pulse" />
        </div>
      </div>
    </section>
  )
}

