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
      case 'notifications': return <Bell size={18} />
      case 'settings': return <Settings size={18} />
      default: return null
    }
  }

  // Filter out 'settings' to put it at the bottom with Help Center and Logout
  const mainTabs = tabs.filter(tab => tab.id !== 'settings')

  return (
    <div className="w-full md:w-56 flex-shrink-0 bg-white border-b md:border-r md:border-b-0 border-gray-100 flex flex-col md:min-h-screen">
      {/* Brand / Logo Area */}
      <div className="px-6 py-8 flex items-center justify-start gap-3">
        <div className="text-[#085041]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">El Árbol</h2>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <nav className="space-y-1.5 pr-6">
          {mainTabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 cursor-pointer rounded-r-full ${
                  isActive 
                    ? 'bg-[#e8f5e9] text-[#085041]' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                <span className={isActive ? 'text-[#085041]' : 'text-gray-400'}>
                  {getIconForTab(tab.id)}
                </span>
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-1 mb-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'text-[#085041]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings size={18} className={activeTab === 'settings' ? 'text-[#085041]' : 'text-gray-400'} />
          Settings
        </button>
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <HelpCircle size={18} className="text-gray-400" />
          Help Center
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut size={18} className="text-gray-400" />
          Logout
        </button>
      </div>
    </div>
  )
}
