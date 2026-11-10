'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Camera, Building2, Phone, Mail, FileText, MapPin, 
  Briefcase, BarChart, Store, ArrowRightLeft, X, Check, Loader2, CreditCard
} from 'lucide-react'
import StatusBadge from '../_shared/StatusBadge'
import { getStores } from '@/lib/stores-api'
import { updateWholesaleProfile } from '@/lib/api'

function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-4 items-start p-3 rounded-xl hover:bg-gray-50/80 transition-colors border border-transparent hover:border-gray-100">
      <div className="mt-0.5 text-[#085041] bg-[#e8f5e9] p-2.5 rounded-lg shadow-sm">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[14px] font-semibold text-gray-900 break-words" style={{ wordBreak: 'break-word' }}>{value}</p>
      </div>
    </div>
  )
}

export default function AccountInfoTab({ 
  profile, 
  onImageUpload, 
  imageUploading, 
  isInternalWholesale,
  accessToken,
  onProfileUpdate
}) {
  const fileInputRef = useRef(null)
  const { update: updateSession } = useSession()

  const [showStoreModal, setShowStoreModal] = useState(false)
  const [storeList, setStoreList] = useState([])
  const [loadingStores, setLoadingStores] = useState(false)
  const [selectedStore, setSelectedStore] = useState('')
  const [switchingStore, setSwitchingStore] = useState(false)
  const [storeSuccessMsg, setStoreSuccessMsg] = useState('')
  const [storeErrorMsg, setStoreErrorMsg] = useState('')

  const isInternal = isInternalWholesale !== undefined 
    ? isInternalWholesale 
    : (!profile?.user_type || profile?.user_type === 'WHOLESALER' || profile?.user_type === 'internal' || String(profile?.user_type).toUpperCase() === 'WHOLESALER')

  const openStoreModal = async () => {
    setShowStoreModal(true)
    setStoreErrorMsg('')
    setStoreSuccessMsg('')
    const currentId = profile.store_id || (profile.store && typeof profile.store === 'object' ? profile.store.id : profile.store) || ''
    setSelectedStore(currentId ? String(currentId) : '')

    if (storeList.length === 0) {
      setLoadingStores(true)
      try {
        const data = await getStores()
        if (Array.isArray(data)) setStoreList(data)
      } catch {
        setStoreErrorMsg('Failed to load available stores. Please try again.')
      } finally {
        setLoadingStores(false)
      }
    }
  }

  const handleStoreChange = async () => {
    if (!selectedStore) {
      setStoreErrorMsg('Please select a store')
      return
    }
    setSwitchingStore(true)
    setStoreErrorMsg('')
    setStoreSuccessMsg('')
    try {
      const updated = await updateWholesaleProfile(accessToken, { store: Number(selectedStore) })
      if (onProfileUpdate) {
        onProfileUpdate(prev => ({
          ...prev,
          ...updated,
          store: updated.store,
          store_id: updated.store_id,
          store_name: updated.store_name,
          store_code: updated.store_code,
        }))
      }
      if (updateSession) {
        await updateSession({
          storeId: updated.store_id,
          storeName: updated.store_name,
          storeCode: updated.store_code,
        })
      }
      setStoreSuccessMsg('Store changed successfully!')
      setTimeout(() => {
        setShowStoreModal(false)
        setStoreSuccessMsg('')
      }, 1000)
    } catch (err) {
      setStoreErrorMsg(err?.message || err?.detail || 'Failed to update store. Please try again.')
    } finally {
      setSwitchingStore(false)
    }
  }

  const assignedStoreName = profile.store_name || (profile.store && typeof profile.store === 'object' ? profile.store.name : null) || 'No Store Assigned'
  const assignedStoreCode = profile.store_code || (profile.store && typeof profile.store === 'object' ? profile.store.store_code : null)

  return (
    <div className="max-w-5xl mx-auto mt-4 px-2 sm:px-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
        
        {/* Header Ribbon (Cover) */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#085041] to-[#0a6c56] relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="px-6 sm:px-10 pb-10 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
          
          {/* Avatar Area */}
          <div className="flex flex-col items-center shrink-0 w-full lg:w-64 -mt-16 sm:-mt-20">
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center relative group cursor-pointer overflow-hidden mb-4 sm:mb-5 transition-transform hover:scale-[1.02]"
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

            <div className="text-center w-full bg-white lg:bg-transparent rounded-xl p-4 lg:p-0 shadow-sm border border-gray-100 lg:border-none lg:shadow-none">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{profile.contact_name || 'N/A'}</h2>
              <p className="text-[14px] text-gray-500 font-medium mb-3">{profile.business_name || 'N/A'}</p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <StatusBadge status={profile.status} />
                {profile.wholesale_id && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00694C]/10 text-[#00694C] border border-[#00694C]/20 shadow-xs">
                    <CreditCard size={13} />
                    {profile.wholesale_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="flex-1 w-full mt-2 lg:mt-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-gray-50/50 rounded-bl-full -z-10"></div>
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={16} className="text-[#085041]" />
                  Business Details
                </h3>
                {profile.wholesale_id && (
                  <span className="text-xs text-gray-500 font-mono">
                    ID: <strong className="text-[#00694C]">{profile.wholesale_id}</strong>
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                <InfoField icon={Building2} label="Business Name" value={profile.business_name || 'N/A'} />
                <InfoField icon={Mail} label="Business Email" value={profile.email || 'N/A'} />
                <InfoField icon={CreditCard} label="Wholesale ID" value={profile.wholesale_id || 'N/A'} />
                <InfoField icon={Phone} label="Phone Number" value={profile.phone || 'N/A'} />
                <InfoField icon={FileText} label="CIF" value={profile.cif || profile.trade_license_number || profile.trade_license || 'N/A'} />
                <InfoField icon={Briefcase} label="Business Type" value={profile.display_business_type || profile.business_type || 'N/A'} />
                <InfoField icon={MapPin} label="Delivery Postcode" value={profile.postcode || 'N/A'} />
                
                {/* Fulfillment Store Banner Card */}
                <div className="col-span-1 md:col-span-2 p-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-emerald-100 text-[#00694C] rounded-xl shadow-xs mt-0.5">
                      <Store size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                        Assigned Fulfillment Store
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-bold text-gray-900">
                          {assignedStoreName}
                        </span>
                        {assignedStoreCode && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-bold tracking-wide">
                            {assignedStoreCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 mt-1">
                        All wholesale orders from this account are fulfilled and delivered from this store branch.
                      </p>
                    </div>
                  </div>

                  {accessToken && (
                    <button
                      type="button"
                      onClick={openStoreModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#00694C] hover:bg-[#085041] rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <ArrowRightLeft size={13} />
                      Change Store
                    </button>
                  )}
                </div>

                {!isInternal && (
                  <div className="sm:col-span-2 mt-2">
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
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Change Store Modal */}
      {showStoreModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { if (!switchingStore) setShowStoreModal(false) }}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-[#00694C] rounded-lg">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Change Preferred Store</h3>
                  <p className="text-xs text-gray-500">Select which store branch should fulfill your wholesale orders</p>
                </div>
              </div>
              <button
                type="button"
                disabled={switchingStore}
                onClick={() => setShowStoreModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {storeSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>{storeSuccessMsg}</span>
              </div>
            )}

            {storeErrorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                {storeErrorMsg}
              </div>
            )}

            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {loadingStores ? (
                <div className="py-10 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                  <span className="text-xs">Loading available stores…</span>
                </div>
              ) : storeList.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  No active stores available.
                </div>
              ) : (
                storeList.map(st => {
                  const isSelected = String(selectedStore) === String(st.id)
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStore(String(st.id))}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-[#00694C] bg-emerald-50/70 shadow-xs ring-1 ring-[#00694C]' 
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{st.name}</span>
                          {st.store_code && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                              {st.store_code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {st.full_address || st.address || st.city || 'Standard Branch'}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#00694C] bg-[#00694C]' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={switchingStore}
                onClick={() => setShowStoreModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={switchingStore || !selectedStore}
                onClick={handleStoreChange}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#00694C] hover:bg-[#085041] disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {switchingStore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Confirm & Save Store'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
