import HeroSection from '@/app/components/HeroSection'
import HomeContentSkeleton from '@/app/components/HomeContentSkeleton'

export default function Loading() {
  return (
    <div style={{ backgroundColor: '#EFF9F2', minHeight: '100vh' }}>
      <HeroSection />
      <HomeContentSkeleton />
    </div>
  )
}