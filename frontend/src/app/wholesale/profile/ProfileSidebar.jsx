'use client'
// src/app/wholesale/profile/ProfileSidebar.jsx
import { LayoutDashboard, ShoppingCart, Bell, Settings, LogOut, User, HelpCircle, Package } from 'lucide-react'

export default function ProfileSidebar({ activeTab, setActiveTab, tabs, onLogout }) {
  
  const getIconForTab = (tabId) => {
    switch(tabId) {
      case 'overview': return <LayoutDashboard size={18} />
      case 'order_line': return <ShoppingCart size={18} />
      case 'account_info': return <User size={18} />
      case 'orders': return <Package size={18} />
      case 'support_tickets': return <HelpCircle size={18} />
      case 'notifications': return <Bell size={18} />
      case 'settings': return <Settings size={18} />
      default: return null
    }
  }

  // All tabs go in the main navigation
  const mainTabs = tabs

  return (
    <div className="w-full md:w-56 flex-shrink-0 bg-white border-b md:border-r md:border-b-0 border-gray-100 flex flex-col md:min-h-screen">


      <div className="flex md:flex-col overflow-x-auto no-scrollbar md:overflow-visible md:h-full w-full">
        {/* Navigation */}
        <div className="py-2 md:py-4 flex-shrink-0">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1.5 px-4 md:px-0 md:pr-6 w-max md:w-full">
            {mainTabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2.5 text-[13px] md:text-sm font-medium transition-all duration-200 cursor-pointer rounded-full md:rounded-r-full md:rounded-l-none ${
                    isActive 
                      ? 'bg-[#e8f5e9] text-[#085041]' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <span className={isActive ? 'text-[#085041]' : 'text-gray-400'}>
                    {getIconForTab(tab.id)}
                  </span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}

            <button
              onClick={onLogout}
              className="flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2.5 text-[13px] md:text-sm font-medium transition-all duration-200 cursor-pointer rounded-full md:rounded-r-full md:rounded-l-none text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <span className="text-gray-400">
                <LogOut size={18} />
              </span>
              <span className="whitespace-nowrap">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
