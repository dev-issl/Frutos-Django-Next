'use client'
// src/app/wholesale/profile/ProfileSidebar.jsx
import Image from 'next/image'
import {
  LayoutGrid,
  ShoppingCart,
  User,
  Package,
  History,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'

export default function ProfileSidebar({ activeTab, setActiveTab, tabs, onLogout }) {
  const getIconForTab = (tabId, isActive) => {
    const iconColor = isActive ? 'text-white' : 'text-[#2D3F33]'
    switch (tabId) {
      case 'overview':
        return <LayoutGrid size={18} className={iconColor} strokeWidth={2.2} />
      case 'order_line':
        return <ShoppingCart size={18} className={iconColor} strokeWidth={2.2} />
      case 'account_info':
        return <User size={18} className={iconColor} strokeWidth={2.2} />
      case 'orders':
        return <Package size={18} className={iconColor} strokeWidth={2.2} />
      case 'support_tickets':
        return <History size={18} className={iconColor} strokeWidth={2.2} />
      case 'notifications':
        return <Bell size={18} className={iconColor} strokeWidth={2.2} />
      case 'settings':
        return <Settings size={18} className={iconColor} strokeWidth={2.2} />
      default:
        return <LayoutGrid size={18} className={iconColor} strokeWidth={2.2} />
    }
  }

  return (
    <aside className="w-full md:w-60 lg:w-64 flex-shrink-0 flex flex-col justify-between p-4 sm:p-5 md:py-6 md:px-5 relative z-10 select-none">
      {/* ── TOP: NAVIGATION MENU ── */}
      <div className="w-full">
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible space-x-2 md:space-x-0 md:space-y-1.5 pb-2 md:pb-0">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center justify-between w-auto md:w-full px-4 py-2.5 rounded-full text-[13.5px] transition-all duration-150 cursor-pointer ${isActive
                    ? 'bg-[#0B4828] text-white shadow-sm font-semibold'
                    : 'text-[#243B2E] hover:text-[#0B4828] hover:bg-[#EAF3E6] font-medium'
                  }`}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0">{getIconForTab(tab.id, isActive)}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </div>

                {/* Red notification dot */}
                {tab.id === 'notifications' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2" />
                )}
              </button>
            )
          })}

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex-shrink-0 flex items-center gap-3 w-auto md:w-full px-4 py-2.5 rounded-full text-[13.5px] font-medium text-[#243B2E] hover:text-red-700 hover:bg-red-50 transition-all duration-150 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <span className="shrink-0 text-[#243B2E]">
              <LogOut size={18} strokeWidth={2.2} />
            </span>
            <span className="whitespace-nowrap">Logout</span>
          </button>
        </nav>
      </div>

      {/* ── BOTTOM: "GOOD FOOD GOOD LIFE" PROMO CARD ── */}
      <div className="hidden md:block mt-6 rounded-[24px] bg-white border border-[#E0EBE2] shadow-sm overflow-hidden relative w-full">
        {/* Fresh Produce Basket Image */}
        <div className="relative h-28 w-full overflow-hidden bg-[#EDF4EC]">
          <Image
            src="/wholesale/hero-basket.webp"
            alt="Good Food Good Life"
            fill
            className="object-cover"
          />
          {/* Gentle organic wave contour under image */}
          <svg
            className="absolute bottom-0 left-0 right-0 h-4 w-full"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 0 20 L 0 8 C 30 18, 70 4, 100 12 L 100 20 Z" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Promo Text Section */}
        <div className="p-4 pt-2.5 relative">
          <h4 className="font-bold text-[#143423] text-[16px] leading-tight">
            Good Food
          </h4>
          <h4 className="font-bold text-[#143423] text-[16px] leading-tight">
            Good Life
          </h4>
          <p
            className="font-serif italic text-[13px] text-[#2F5840] mt-1.5"
            style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
          >
            With El Árbol
          </p>
        </div>
      </div>
    </aside>
  )
}
