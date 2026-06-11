'use client'
// src/app/wholesale/profile/ProfileHeader.jsx
import { useRef } from 'react'
import { Camera } from 'lucide-react'
import StatusBadge from './_shared/StatusBadge'

export default function ProfileHeader({ profile, activeTab, setActiveTab, tabs, onLogout, onImageUpload, imageUploading }) {
  const fileInputRef = useRef(null)

  return (
    <div className="bg-gradient-to-br from-[#085041] via-[#00694C] to-[#1D9E75] pt-8 md:pt-10">
      <div className="max-w-[960px] mx-auto px-4 lg:px-6">
        
        {/* --- Top Section: Avatar, Info, Logout --- */}
        <div className="flex flex-row items-start gap-4 sm:gap-6">
          
          {/* Avatar - Dynamic size */}
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 bg-white/15 border-2 border-white/30 flex items-center justify-center shadow-lg relative group cursor-pointer overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {(profile.profile_image_url || profile.profile_image) ? (
              <img src={profile.profile_image_url || profile.profile_image} alt={profile.contact_name || "Profile"} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-xl sm:text-2xl font-bold text-white uppercase">
                {(profile.contact_name || profile.business_name || '?')[0]}
              </span>
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            
            {imageUploading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onImageUpload} 
          />

          {/* Business Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight truncate">
                {profile.business_name}
              </h1>
              <div className="w-fit">
                <StatusBadge status={profile.status} />
              </div>
            </div>
            
            <p className="text-white/70 text-xs sm:text-sm truncate leading-relaxed">
              {profile.contact_name} <span className="mx-1 opacity-40">|</span> {profile.email}
            </p>
            
            {profile.display_business_type && (
              <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mt-1">
                {profile.display_business_type}
              </p>
            )}
          </div>

          {/* Logout - Icon only on tiny screens, text on larger */}
          <button 
            onClick={onLogout}
            className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>



        {/* --- Navigation Tabs --- */}
        <div className=" mt-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 sm:gap-8 min-w-max border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer pb-3 text-xs sm:text-sm font-semibold transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-white' 
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5DD9A8] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}