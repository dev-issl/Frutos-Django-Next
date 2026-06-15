'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package, Plus, Search, Edit2, Trash2, X, Check,
  Image as ImageIcon, Loader2, AlertCircle, Store
} from 'lucide-react'
import api, { adminFetch } from '@/app/dashboard/_lib/api'
import { useDashboardAuth } from '@/app/dashboard/_context/DashboardAuthContext'

// ─── Input Components ─────────────────────────────────────────────────────────

function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <input
        className={`bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <select
        className={`bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-2 text-sm text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ImageUpload({ label, value, onChange, preview }) {
  const ref = useRef()
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <div
        onClick={() => ref.current?.click()}
        className="relative border-2 border-dashed border-gray-300 hover:border-blue-500/50 rounded-xl overflow-hidden cursor-pointer transition-all group bg-slate-50"
        style={{ aspectRatio: '1/1', maxHeight: '200px' }}
      >
        {(preview || value) ? (
          <img
            src={value instanceof File ? URL.createObjectURL(value) : preview}
            className="w-full h-full object-cover"
            alt="preview"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageIcon size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            <p className="text-xs text-slate-500 text-center px-4">Click to upload image</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <p className="text-xs text-white font-semibold">Change Image</p>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => onChange(e.target.files[0])} />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function PackFormModal({ pack, stores, storeSlug, onClose, onSave }) {
  const isEdit = !!pack?.id
  const [form, setForm] = useState({
    name: pack?.name || '',
    description: pack?.description || '',
    price: pack?.price || '',
    original_price: pack?.original_price || '',
    package_type: pack?.package_type || 'Box',
    weight_quantity: pack?.weight_quantity || '',
    stock: pack?.stock || 0,
    store_slug: pack?.store?.slug || storeSlug || (stores[0]?.slug || ''),
    is_active: pack?.is_active ?? true,
  })
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      Object.keys(form).forEach(k => {
          if (form[k] !== null && form[k] !== undefined && form[k] !== '') {
              fd.append(k, form[k])
          }
      })
      if (image) fd.append('image', image)

      const path = isEdit ? `/api/fulfillment/dashboard/leftover-packs/${pack.id}/` : '/api/fulfillment/dashboard/leftover-packs/'
      const method = isEdit ? 'PATCH' : 'POST'

      await adminFetch(path, { method, body: fd })
      onSave()
    } catch (err) {
      setError(err.message || 'Failed to save pack')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package size={17} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{isEdit ? 'Edit Leftover Pack' : 'Add Leftover Pack'}</p>
            </div>
          </div>
          <button style={{cursor: 'pointer'}} onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="flex gap-6">
                <div className="w-1/3">
                    <ImageUpload
                        label="Pack Image"
                        value={image}
                        preview={pack?.image}
                        onChange={setImage}
                    />
                </div>
                <div className="flex-1 space-y-4">
                    <Select label="Select Store" value={form.store_slug} onChange={e => set('store_slug', e.target.value)} required disabled={isEdit}>
                        <option value="">Select a store</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.slug}>{s.name}</option>
                        ))}
                    </Select>
                    <Input label="Pack Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Veggie Rescue Box" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Selling Price (€)" type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
                <Input label="Original Price (€)" type="number" step="0.01" value={form.original_price} onChange={e => set('original_price', e.target.value)} placeholder="(Optional)" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Select label="Package Type" value={form.package_type} onChange={e => set('package_type', e.target.value)} required>
                    {['Box', 'Bag', 'Bundle', 'Carton', 'Piece', 'KG', 'Liter'].map(pt => (
                        <option key={pt} value={pt}>{pt}</option>
                    ))}
                </Select>
                <Input label="Weight/Qty" value={form.weight_quantity} onChange={e => set('weight_quantity', e.target.value)} placeholder="e.g. 2.5 KG" />
                <Input label="Stock" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all min-h-[80px]"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Short description of the pack contents"
                />
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-800 cursor-pointer">
                Active (visible on store page)
              </label>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
            <button style={{cursor: 'pointer'}} type="button" onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-gray-200 text-slate-800 text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button style={{cursor: 'pointer'}} type="submit" disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#00694C] hover:bg-[#085041] text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isEdit ? 'Save Changes' : 'Create Pack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirm({ pack, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">Delete Pack</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete <span className="text-slate-800 font-semibold">{pack.name}</span>?
        </p>
        <div className="flex gap-3">
          <button style={{cursor: 'pointer'}} onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-gray-200 text-slate-800 text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button style={{cursor: 'pointer'}} onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeftoverPacksPage() {
  const { user } = useDashboardAuth()
  const [stores, setStores] = useState([])
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  
  const [selectedStoreSlug, setSelectedStoreSlug] = useState('')
  
  const [editPack, setEditPack] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deletePack, setDeletePack] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch stores owned by user (adminFetch sends token, backend views filter by owner automatically if not superuser)
      const storesData = await adminFetch('/api/fulfillment/stores/admin/')
      const storesList = Array.isArray(storesData) ? storesData : (storesData.results || [])
      setStores(storesList)
      
      let initialStoreSlug = selectedStoreSlug
      if (!initialStoreSlug && storesList.length > 0) {
          initialStoreSlug = storesList[0].slug
          setSelectedStoreSlug(initialStoreSlug)
      }

      if (initialStoreSlug) {
        // Fetch leftover packs for the selected store
        const packsData = await adminFetch(`/api/fulfillment/dashboard/leftover-packs/?store_slug=${initialStoreSlug}`)
        setPacks(Array.isArray(packsData) ? packsData : (packsData.results || []))
      } else {
          setPacks([])
      }
    } catch (e) {
      console.error('Load error:', e)
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [selectedStoreSlug])

  const filteredPacks = packs.filter(p => 
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit  = (pack) => { setEditPack(pack); setShowForm(true) }
  const handleAdd   = () => { setEditPack(null); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditPack(null) }
  const handleSaved = () => { handleClose(); loadData() }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminFetch(`/api/fulfillment/dashboard/leftover-packs/${deletePack.id}/`, { method: 'DELETE' })
      setDeletePack(null)
      loadData()
    } catch (e) { console.error('Delete error:', e) }
    finally { setDeleting(false) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leftover Packs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage rescue packs, surplus stock, and daily leftovers.</p>
        </div>
        <button style={{cursor: 'pointer'}}
          onClick={handleAdd}
          disabled={stores.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#00694C] text-white rounded-xl text-sm font-bold hover:bg-[#085041] transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus size={16} /> Add Pack
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search packs..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        
        {stores.length > 1 && (
            <div className="flex items-center gap-2">
                <Store size={18} className="text-slate-500" />
                <select
                    value={selectedStoreSlug}
                    onChange={e => setSelectedStoreSlug(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                    <option value="">Select Store</option>
                    {stores.map(s => (
                        <option key={s.id} value={s.slug}>{s.name}</option>
                    ))}
                </select>
            </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
            <AlertCircle size={24} />
            <p className="text-sm font-semibold">{error}</p>
            <button style={{cursor: 'pointer'}} onClick={loadData} className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-800">Retry</button>
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Package size={32} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No leftover packs found</p>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              {search ? 'Try a different search term' : 'Add your first leftover pack to start selling surplus produce.'}
            </p>
            {!search && stores.length > 0 && (
              <button style={{cursor: 'pointer'}} onClick={handleAdd} className="mt-2 px-4 py-2 bg-[#00694C] text-white text-sm font-semibold rounded-lg">
                Add Pack
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Pack</th>
                  <th className="px-6 py-4 font-medium">Type & Qty</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPacks.map(pack => (
                  <tr key={pack.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {pack.image ? (
                          <img src={pack.image} alt={pack.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {pack.name}
                              {pack.discount_percentage > 0 && (
                                  <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">-{pack.discount_percentage}%</span>
                              )}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{pack.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-slate-800">{pack.package_type}</div>
                        {pack.weight_quantity && <div className="text-xs text-slate-500">{pack.weight_quantity}</div>}
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">€{pack.price}</div>
                        {pack.original_price && pack.original_price > pack.price && (
                            <div className="text-xs text-slate-400 line-through">€{pack.original_price}</div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            pack.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {pack.stock > 0 ? `${pack.stock} available` : 'Sold Out'}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${pack.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {pack.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button style={{cursor: 'pointer'}} onClick={() => handleEdit(pack)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button style={{cursor: 'pointer'}} onClick={() => setDeletePack(pack)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PackFormModal
          pack={editPack}
          stores={stores}
          storeSlug={selectedStoreSlug}
          onClose={handleClose}
          onSave={handleSaved}
        />
      )}

      {deletePack && (
        <DeleteConfirm
          pack={deletePack}
          loading={deleting}
          onClose={() => setDeletePack(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

