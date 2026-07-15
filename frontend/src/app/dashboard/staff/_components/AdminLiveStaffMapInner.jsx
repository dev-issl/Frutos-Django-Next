"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";
import { Store as StoreIcon, User, RefreshCw, Loader2, MapPin } from "lucide-react";

function MapController({ stores }) {
  const map = useMap();
  useEffect(() => {
    const handleFocus = (e) => {
      const { staffId } = e.detail || {};
      if (!staffId || !stores) return;
      
      for (const store of stores) {
        if (store.active_staff?.some(s => s.id === staffId)) {
          if (store.lat != null && store.lng != null) {
            map.flyTo([store.lat, store.lng], 16, { animate: true });
          }
          break;
        }
      }
    };
    window.addEventListener('focus-staff-on-map', handleFocus);
    return () => window.removeEventListener('focus-staff-on-map', handleFocus);
  }, [map, stores]);
  return null;
}

// Custom icon for staff
const createStaffIcon = (staffList) => {
  if (!staffList || staffList.length === 0) return null;

  const mainStaff = staffList[0];
  const extraCount = staffList.length - 1;
  
  let rawPhoto = mainStaff.photo;
  let finalPhotoUrl = null;
  if (rawPhoto) {
    finalPhotoUrl = rawPhoto.startsWith('http') 
      ? rawPhoto 
      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`;
  }
  
  const photoUrl = finalPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mainStaff.name)}&background=0f172a&color=fff&bold=true`;

  return L.divIcon({
    className: "bg-transparent border-0",
    html: `
      <div class="relative w-12 h-12">
        <div class="absolute -inset-1.5 rounded-full bg-emerald-500/50 animate-ping"></div>
        <div class="absolute inset-0 rounded-full bg-emerald-500/20"></div>
        <div class="w-full h-full rounded-full border-[3px] border-emerald-500 shadow-xl overflow-hidden relative z-10 bg-white flex items-center justify-center">
          <img src="${photoUrl}" class="w-full h-full object-cover" />
        </div>
        ${extraCount > 0 ? `
          <div class="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white z-20">
            +${extraCount}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
  });
};

export default function AdminLiveStaffMapInner() {
  const { data, isLoading, mutate, isValidating } = useSWR(
    "/api/staff/admin/live-locations/",
    (url) => api.get(url),
    { refreshInterval: 30000 } // refresh every 30 seconds
  );

  const stores = data?.stores || [];

  // Filter out stores without coordinates AND without active staff
  const activeStoresWithCoords = stores.filter(s => s.lat != null && s.lng != null && s.active_staff && s.active_staff.length > 0);
  const storesMissingCoords = stores.filter(s => (s.lat == null || s.lng == null) && s.active_staff && s.active_staff.length > 0);
  
  // Calculate center of active stores
  const defaultCenter = activeStoresWithCoords.length > 0
    ? [
        activeStoresWithCoords.reduce((sum, s) => sum + s.lat, 0) / activeStoresWithCoords.length,
        activeStoresWithCoords.reduce((sum, s) => sum + s.lng, 0) / activeStoresWithCoords.length,
      ]
    : [23.8103, 90.4125]; // Default to Dhaka, Bangladesh

  const defaultZoom = activeStoresWithCoords.length > 0 ? 12 : 7;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="text-[#00694C]" /> Live Staff Locations
          </h2>
          <p className="text-sm text-slate-500">See where your staff are currently working in real-time.</p>
        </div>
        <button onClick={() => mutate()} disabled={isValidating} className="db-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
          <RefreshCw className={`w-4 h-4 ${isValidating ? "animate-spin" : ""}`} /> Refresh Map
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200" style={{ height: "600px", zIndex: 0 }}>
        {isLoading && !data ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#00694C] animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Loading Map Data...</p>
          </div>
        ) : null}
        
        <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
          <MapController stores={activeStoresWithCoords} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {activeStoresWithCoords.map((store) => {
            const icon = createStaffIcon(store.active_staff);
            if (!icon) return null;
            
            return (
              <Marker 
                key={store.id} 
                position={[store.lat, store.lng]}
                icon={icon}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                      <StoreIcon className="w-4 h-4 text-[#00694C]" />
                      <h3 className="font-bold text-slate-800 text-sm m-0 leading-none">{store.name}</h3>
                    </div>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      <p className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wider">{store.active_staff.length} Staff Online</p>
                      {store.active_staff.map(staff => {
                        let staffPhotoUrl = staff.photo;
                        if (staffPhotoUrl && !staffPhotoUrl.startsWith('http')) {
                          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
                          staffPhotoUrl = `${baseUrl}${staffPhotoUrl.startsWith('/') ? '' : '/'}${staffPhotoUrl}`;
                        }
                        
                        return (
                        <div key={staff.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            {staffPhotoUrl ? (
                              <img src={staffPhotoUrl} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=0f172a&color=fff&bold=true`} alt={staff.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{staff.name}</span>
                            <span className="text-[10px] text-slate-500">{staff.role}</span>
                          </div>
                          <div className="ml-auto text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Active
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* Fallback for active stores without coordinates */}
      {storesMissingCoords.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium mb-2">
            The following stores have active staff but cannot be mapped due to missing coordinates:
          </p>
          <div className="flex flex-wrap gap-2">
            {storesMissingCoords.map(store => (
              <span key={store.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-amber-200 text-amber-700 rounded-lg shadow-sm">
                <StoreIcon className="w-3 h-3" /> {store.name} 
                <span className="ml-1 bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">{store.active_staff.length} Active</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
