'use client'
import { useRef } from 'react'
import { Camera, Building2, Phone, Mail, FileText, MapPin, Briefcase, BarChart } from 'lucide-react'
import StatusBadge from '../_shared/StatusBadge'

export default function AccountInfoTab({ profile, onImageUpload, imageUploading }) {
  const fileInputRef = useRef(null)

  const InfoField = ({ icon: Icon, label, value }) => (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 text-gray-400">
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-[14px] font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto mt-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="h-24 bg-gradient-to-r from-[#085041] to-[#147a64]"></div>

        <div className="px-6 pb-8 sm:px-8 -mt-10 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Avatar Area */}
          <div className="flex flex-col items-center shrink-0 w-full md:w-56">
            <div 
              className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center relative group cursor-pointer overflow-hidden mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              {(profile.profile_image_url || profile.profile_image) ? (
                <img src={profile.profile_image_url || profile.profile_image} alt={profile.contact_name || "Profile"} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-3xl font-bold text-gray-300 uppercase">
                  {(profile.contact_name || profile.business_name || '?')[0]}
                </span>
              )}
              
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white mb-1" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
              </div>
              
              {imageUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 border-3 border-[#085041] border-t-transparent rounded-full animate-spin"></div>
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

            <div className="text-center w-full">
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{profile.contact_name || 'N/A'}</h2>
              <p className="text-[13px] text-gray-500 font-medium mb-3">{profile.business_name || 'N/A'}</p>
              <StatusBadge status={profile.status} />
            </div>
          </div>

          {/* Details Grid */}
          <div className="flex-1 w-full bg-gray-50/50 rounded-xl border border-gray-100 p-6 md:mt-14">
            <h3 className="text-[13px] font-bold text-gray-900 mb-5 border-b border-gray-100 pb-2">Business Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <InfoField icon={Building2} label="Business Name" value={profile.business_name || 'N/A'} />
              <InfoField icon={Mail} label="Business Email" value={profile.email || 'N/A'} />
              <InfoField icon={Phone} label="Phone Number" value={profile.phone || 'N/A'} />
              <InfoField icon={FileText} label="Trade License Number" value={profile.trade_license || profile.trade_license_number || 'N/A'} />
              <InfoField icon={Briefcase} label="Business Type" value={profile.display_business_type || profile.business_type || 'N/A'} />
              <InfoField icon={MapPin} label="Delivery Postcode" value={profile.postcode || 'N/A'} />
              
              <div className="sm:col-span-2 border-t border-gray-100 pt-5 mt-1">
                <InfoField 
                  icon={BarChart} 
                  label="Estimated Monthly Volume" 
                  value={
                    profile.monthly_volume ? (
                      profile.monthly_volume === '400_1000' ? '€400 – €1,000 / month' :
                      profile.monthly_volume === '1000_3000' ? '€1,000 – €3,000 / month' :
                      profile.monthly_volume === '3000_7000' ? '€3,000 – €7,000 / month' :
                      profile.monthly_volume === '7000_plus' ? '€7,000+ / month' : profile.monthly_volume
                    ) : 'N/A'
                  } 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
