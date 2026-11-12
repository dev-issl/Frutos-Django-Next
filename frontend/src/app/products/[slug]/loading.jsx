// src/app/products/[slug]/loading.jsx

export default function ProductDetailLoading() {
  return (
    <div style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}>
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-56 bg-[#E2E7D8] rounded-full mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Gallery Skeleton */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-[20px] bg-[#E8EDE0] aspect-[16/10] w-full" />
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-[12px] bg-[#E8EDE0] aspect-[4/3]" />
              ))}
            </div>
          </div>

          {/* Right Info Skeleton */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="h-6 w-24 bg-[#DCE8D3] rounded-full" />
            <div className="h-10 w-3/4 bg-[#E2E7D8] rounded-lg" />
            <div className="h-4 w-48 bg-[#E2E7D8] rounded-full" />
            <div className="space-y-2 mt-2">
              <div className="h-4 w-full bg-[#E8EDE0] rounded" />
              <div className="h-4 w-5/6 bg-[#E8EDE0] rounded" />
            </div>
            <div className="h-10 w-36 bg-[#DCE8D3] rounded-lg mt-2" />
            <div className="h-12 w-full bg-[#D5E2CA] rounded-full mt-3" />
            <div className="h-16 w-full bg-[#E8EFE0] rounded-[16px] mt-1" />
          </div>
        </div>

        {/* Bento Row Skeleton */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 h-52 rounded-[20px] bg-[#FAFBF6] border border-[#E3E7DB]" />
          <div className="lg:col-span-4 h-52 rounded-[20px] bg-[#ECF1E4]" />
          <div className="lg:col-span-3 h-52 rounded-[20px] bg-[#E2E7D8]" />
        </div>
      </div>
    </div>
  )
}
