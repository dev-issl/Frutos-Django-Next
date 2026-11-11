import { StoresHeroShell } from './StoresHero'
import StoresFinderSkeleton from './StoresFinderSkeleton'

export default function StoresLoading() {
  return (
    <StoresHeroShell>
      <StoresFinderSkeleton />
    </StoresHeroShell>
  )
}

