import ShopHeroBanner from './ShopHeroBanner'
import ShopContentSkeleton from './ShopContentSkeleton'

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-[#EFF9F2]">
      <ShopHeroBanner />
      <ShopContentSkeleton />
    </div>
  )
}