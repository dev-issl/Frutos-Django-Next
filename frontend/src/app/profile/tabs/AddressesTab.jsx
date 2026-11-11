

'use client'
import { useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
const inputCls = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e0e8e0',
  borderRadius: '8px', background: '#fafaf8', color: '#151e13',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

// initialAddresses — pre-fetched by the server component; no client spinner on first load.
export default function AddressesTab({ authFetch, initialAddresses = null }) {
  const [addresses, setAddresses] = useState(() => toArray(initialAddresses))
  const [loading,   setLoading]   = useState(initialAddresses === null) // only load if server didn't fetch
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({
    label: 'Home', street: '', city: '', postcode: '',
    country: 'Ireland', phone: '', isDefault: false,
  })

  // Client-side fetch only when server data was unavailable (e.g. unauthenticated SSR)
  useEffect(() => {
    if (initialAddresses !== null) return // already have data
    authFetch(`${API_BASE}/auth/addresses/`)
      .then(r => r.json())
      .then(data => setAddresses(toArray(data)))
      .finally(() => setLoading(false))
  }, [])

  async function saveAddress(e) {
    e.preventDefault()
    const res  = await authFetch(`${API_BASE}/auth/addresses/`, { method: 'POST', body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) {
      setAddresses(p => [...p, data])
      setShowForm(false)
      setForm({ label: 'Home', street: '', city: '', postcode: '', country: 'Ireland', phone: '', isDefault: false })
    }
  }

  async function deleteAddress(id) {
    await authFetch(`${API_BASE}/auth/addresses/${id}/`, { method: 'DELETE' })
    setAddresses(p => p.filter(a => a.id !== id))
  }

  if (loading) return <div className="py-12 text-center" style={{ color: '#6d7a73' }}>Loading addresses…</div>

  return (
    <div className="space-y-4">
      {addresses.map(addr => (
        <div key={addr.id} className="p-5 rounded-2xl flex items-start justify-between gap-4"
          style={{ background: '#fff', border: `1.5px solid ${addr.isDefault ? '#00694C' : '#eaeaea'}` }}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-xl mt-0.5" style={{ color: '#00694C' }}>location_on</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm" style={{ color: '#151e13' }}>{addr.label}</p>
                {addr.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#D4EDE5', color: '#00694C' }}>Default</span>
                )}
              </div>
              <p className="text-sm" style={{ color: '#3d4943' }}>{addr.street}</p>
              <p className="text-sm" style={{ color: '#3d4943' }}>{addr.city}, {addr.postcode}</p>
              {addr.phone && <p className="text-xs mt-1" style={{ color: '#6d7a73' }}>{addr.phone}</p>}
            </div>
          </div>
          <button onClick={() => deleteAddress(addr.id)} className="cursor-pointer"
            style={{ background: 'none', border: 'none', padding: '4px', color: '#BCCAC1' }}
            onMouseEnter={e => e.currentTarget.style.color = '#BA1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#BCCAC1'}>
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      ))}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          style={{ border: '2px dashed #BCCAC1', color: '#6d7a73', background: 'transparent' }}>
          <span className="material-symbols-outlined">add</span>
          Add New Address
        </button>
      ) : (
        <form onSubmit={saveAddress} className="p-6 rounded-2xl space-y-4" style={{ background: '#fff', border: '1px solid #eaeaea' }}>
          <h3 className="font-bold text-base" style={{ color: '#151e13' }}>New Address</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6d7a73' }}>Label</label>
              <select style={inputCls} value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}>
                {['Home', 'Work', 'Other'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6d7a73' }}>Phone</label>
              <input style={inputCls} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+44 7700…" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6d7a73' }}>Street *</label>
            <input required style={inputCls} value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} placeholder="142 High Street" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6d7a73' }}>City *</label>
              <input required style={inputCls} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Dublin" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6d7a73' }}>Postcode *</label>
              <input required style={inputCls} value={form.postcode} onChange={e => setForm(p => ({ ...p, postcode: e.target.value }))} placeholder="D01 F5P2" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} className="accent-[#00694C]" />
            <span className="text-sm" style={{ color: '#3d4943' }}>Set as default address</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="cursor-pointer flex-1 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#00694C' }}>Save Address</button>
            <button type="button" onClick={() => setShowForm(false)} className="cursor-pointer px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: '#f0f4f0', color: '#6d7a73' }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}