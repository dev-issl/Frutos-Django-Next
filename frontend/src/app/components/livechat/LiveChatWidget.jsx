'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const LiveChatClient = dynamic(() => import('./LiveChatClient'), {
  ssr: false,
})

/**
 * Only loads LiveChatClient (WebSockets, audio notification, admin/staff chat UI)
 * when visiting /dashboard or /staff routes, keeping public landing/shop/store
 * initial bundles free of admin chat overhead.
 */
export default function LiveChatWidget(props) {
  const pathname = usePathname()
  const isStaffOrAdminRoute =
    pathname?.startsWith('/dashboard') || pathname?.startsWith('/staff')

  if (!isStaffOrAdminRoute) {
    return null
  }

  return <LiveChatClient {...props} />
}
