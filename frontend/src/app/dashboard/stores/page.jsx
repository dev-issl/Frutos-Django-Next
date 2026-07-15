'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Store, Plus, Search, Edit2, Trash2, X, Check,
  MapPin, Phone, Clock, Image as ImageIcon, Tag,
  ShoppingBasket, ToggleLeft, ToggleRight, ChevronDown,
  ChevronUp, Package, Loader2, AlertCircle, Eye, EyeOff,
  Star, Leaf, Truck, ShoppingCart, ArrowUpDown, GripVertical,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { adminFetch } from '@/app/dashboard/_lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_OPTIONS = [
  { value: 'leftoverPack', label: 'Leftover Pack', icon: Package },
  { value: 'organic',      label: 'Organic',       icon: Leaf    },
  { value: 'delivery',     label: 'Delivery',      icon: Truck   },
  { value: 'pickup',       label: 'Click & Collect',icon: ShoppingCart },
]

const EMPTY_STORE = {
  name: '', short_name: '', store_code: '', address: '', city: '', full_address: '',
  phone: '', open_time: '08:00', close_time: '21:00',
  map_link: '', provenance: '', is_active: true, order: 0,
  features: [], availability: [], leftover_packs: [],
}

// ─── Shared input style ────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '9px 13px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#1e293b',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ active }) {
  return active ? (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:'700', background:'#dcfce7', color:'#15803d' }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
      Active
    </span>
  ) : (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:'700', background:'#f1f5f9', color:'#94a3b8' }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#cbd5e1', display:'inline-block' }} />
      Inactive
    </span>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Input({ label, error, className = '', style: extraStyle = {}, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{
          ...inputStyle,
          ...extraStyle,
          borderColor: error ? '#ef4444' : focused ? '#6366f1' : '#e2e8f0',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <p style={{ fontSize:'12px', color:'#ef4444', margin:0 }}>{error}</p>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={16} style={{ color:'#16a34a' }} />
      </div>
      <div>
        <p style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b', margin:0 }}>{title}</p>
        {subtitle && <p style={{ fontSize:'12px', color:'#94a3b8', margin:'2px 0 0 0' }}>{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

function ImageUpload({ label, value, onChange, preview }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div
        onClick={() => ref.current?.click()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position:'relative',
          border: `2px dashed ${hovered ? '#6366f1' : '#e2e8f0'}`,
          borderRadius:'12px',
          overflow:'hidden',
          cursor:'pointer',
          aspectRatio:'16/7',
          background: '#f8fafc',
          transition:'border-color 0.15s',
        }}
      >
        {(preview || value) ? (
          <img
            src={value instanceof File ? URL.createObjectURL(value) : preview}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            alt="preview"
          />
        ) : (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            <ImageIcon size={24} style={{ color: hovered ? '#6366f1' : '#cbd5e1' }} />
            <p style={{ fontSize:'12px', color:'#94a3b8', margin:0 }}>Click to upload image</p>
          </div>
        )}
        {hovered && (
          <div style={{ position:'absolute', inset:0, background:'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <p style={{ fontSize:'12px', color:'#6366f1', fontWeight:'700' }}>Change Image</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e => onChange(e.target.files[0])} />
    </div>
  )
}

// ─── Features Picker ──────────────────────────────────────────────────────────

function FeaturesPicker({ selected, onChange }) {
  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(f => f !== val) : [...selected, val])
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
      {FEATURE_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = selected.includes(value)
        return (
          <button
            key={value} type="button" onClick={() => toggle(value)}
            style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'11px 14px',
              borderRadius:'10px',
              border: active ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0',
              background: active ? '#f0fdf4' : '#ffffff',
              color: active ? '#16a34a' : '#64748b',
              fontSize:'13px', fontWeight:'600',
              cursor:'pointer', transition:'all 0.15s',
              textAlign:'left',
            }}
          >
            <Icon size={15} />
            {label}
            {active && <Check size={13} style={{ marginLeft:'auto', color:'#22c55e' }} />}
          </button>
        )
      })}
    </div>
  )
}

// ─── Availability Manager ─────────────────────────────────────────────────────

function toPascalCase(name = '') {
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function DynamicIcon({ name, size = 15 }) {
  const Icon = LucideIcons[toPascalCase(name)] || LucideIcons.ShoppingBasket
  return <Icon size={size} />
}

function AvailabilityManager({ items, onChange }) {
  const [cat, setCat] = useState('')
  const [icon, setIcon] = useState('shopping-basket')

  const add = () => {
    const trimmed = cat.trim()
    if (!trimmed || items.find(i => i.category === trimmed)) return
    onChange([...items, { category: trimmed, icon }])
    setCat('')
    setIcon('shopping-basket')
  }

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginTop:'8px' }}>
      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        <input
          value={cat}
          onChange={e => setCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="e.g. Fruits, Bread, Veg…"
          style={{ ...inputStyle, flex:1 }}
          onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }}
          onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
        />
        <div style={{ position:'relative' }}>
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Icon name"
            style={{ ...inputStyle, width:'150px', paddingLeft:'36px' }}
            onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }}
            onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
          />
          <div style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#22c55e' }}>
            <DynamicIcon name={icon} size={15} />
          </div>
        </div>
        <button
          type="button" onClick={add}
          style={{ padding:'9px 16px', background:'#22c55e', color:'white', borderRadius:'10px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:'700', transition:'background 0.15s', flexShrink:0 }}
          onMouseEnter={e => e.currentTarget.style.background='#16a34a'}
          onMouseLeave={e => e.currentTarget.style.background='#22c55e'}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {items.length > 0 ? (
        <div style={{ border:'1px solid #f1f5f9', borderRadius:'12px', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                <th style={{ padding:'10px 16px', fontWeight:'700', color:'#94a3b8', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center', width:'60px' }}>Icon</th>
                <th style={{ padding:'10px 16px', fontWeight:'700', color:'#94a3b8', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left' }}>Category</th>
                <th style={{ padding:'10px 16px', fontWeight:'700', color:'#94a3b8', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center', width:'60px' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}>
                  <td style={{ padding:'10px 16px', textAlign:'center' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', color:'#16a34a', margin:'0 auto' }}>
                      <DynamicIcon name={item.icon} size={14} />
                    </div>
                  </td>
                  <td style={{ padding:'10px 16px', color:'#1e293b', fontWeight:'600' }}>{item.category}</td>
                  <td style={{ padding:'10px 16px', textAlign:'center' }}>
                    <button type="button" onClick={() => remove(i)}
                      className="db-icon-btn danger"
                      style={{ display:'inline-flex', margin:'0 auto' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding:'32px', textAlign:'center', color:'#94a3b8', fontSize:'13px', border:'1.5px dashed #e2e8f0', borderRadius:'12px', fontWeight:'500' }}>
          No availability categories added yet.
        </div>
      )}
    </div>
  )
}

// ─── Leftover Packs Manager ───────────────────────────────────────────────────

function LeftoverPacksManager({ packs, onChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', image: null, imagePreview: '' })

  const addPack = () => {
    if (!form.name || !form.price) return
    onChange([...packs, { ...form, id: Date.now(), isNew: true }])
    setForm({ name: '', description: '', price: '', image: null, imagePreview: '' })
    setShowAdd(false)
  }

  const removePack = (idx) => onChange(packs.filter((_, i) => i !== idx))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      {packs.map((pack, i) => (
        <div key={pack.id || i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'#f8fafc', border:'1px solid #f1f5f9', borderRadius:'10px' }}>
          {(pack.imagePreview || pack.image) && (
            <img
              src={pack.image instanceof File ? URL.createObjectURL(pack.image) : (pack.imagePreview || pack.image)}
              style={{ width:'44px', height:'44px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }}
              alt={pack.name}
            />
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'13px', fontWeight:'700', color:'#1e293b', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pack.name}</p>
            <p style={{ fontSize:'11px', color:'#94a3b8', margin:'2px 0 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pack.description}</p>
          </div>
          <span style={{ fontSize:'13px', fontWeight:'800', color:'#16a34a' }}>€{pack.price}</span>
          <button type="button" onClick={() => removePack(i)} className="db-icon-btn danger">
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {showAdd ? (
        <div style={{ padding:'16px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'12px', display:'flex', flexDirection:'column', gap:'12px' }}>
          <Input label="Pack Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Veggie Rescue Box" />
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
          <Input label="Price (€)" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4.99" />
          <ImageUpload label="Pack Image" value={form.image} preview={form.imagePreview} onChange={file => setForm(f => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }))} />
          <div style={{ display:'flex', gap:'8px', paddingTop:'4px' }}>
            <button type="button" onClick={addPack}
              style={{ padding:'9px 18px', background:'#22c55e', color:'white', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'700', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#16a34a'}
              onMouseLeave={e => e.currentTarget.style.background='#22c55e'}>
              Add Pack
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              style={{ padding:'9px 18px', background:'#ffffff', color:'#475569', borderRadius:'10px', border:'1.5px solid #e2e8f0', cursor:'pointer', fontSize:'13px', fontWeight:'600', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#ffffff'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'10px', border:'1.5px dashed #e2e8f0', borderRadius:'10px', background:'transparent', color:'#94a3b8', fontSize:'13px', fontWeight:'600', cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#22c55e'; e.currentTarget.style.color='#16a34a'; e.currentTarget.style.background='#f0fdf4'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background='transparent'; }}>
          <Plus size={14} /> Add Leftover Pack
        </button>
      )}
    </div>
  )
}

// ─── Store Form Modal ─────────────────────────────────────────────────────────

function StoreFormModal({ store, onClose, onSave }) {
  const isEdit = !!store?.id
  const [form, setForm] = useState({
    ...EMPTY_STORE,
    ...(store || {}),
    features: store?.features || [],
    availability: store?.availability || [],
    leftover_packs: store?.leftover_packs || [],
    store_code: store?.storeCode || store?.store_code || '',
    open_time: store?.openTime || store?.open_time || '08:00',
    close_time: store?.closeTime || store?.close_time || '21:00',
    map_link: store?.mapLink || store?.map_link || '',
    short_name: store?.shortName || store?.short_name || '',
    full_address: store?.fullAddress || store?.full_address || '',
    is_active: store
      ? Boolean(store.is_active === true || store.is_active === 1 || store.is_active === 'true')
      : true,
  })
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [section, setSection] = useState('basic')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      const fields = ['name', 'short_name', 'store_code', 'address', 'city', 'full_address',
        'phone', 'open_time', 'close_time', 'map_link', 'provenance', 'order']
      fields.forEach(k => fd.append(k, form[k] ?? ''))
      fd.append('is_active', form.is_active ? 'true' : 'false')
      if (image) fd.append('image', image)
      const path = isEdit ? `/api/fulfillment/stores/${store.id}/` : '/api/fulfillment/stores/admin/'
      const method = isEdit ? 'PATCH' : 'POST'
      const saved = await adminFetch(path, { method, body: fd })
      if (saved?.id) {
        await adminFetch(`/api/fulfillment/stores/${saved.id}/features/`, { method: 'PUT', body: { features: form.features } }).catch(() => {})
        await adminFetch(`/api/fulfillment/stores/${saved.id}/availability/`, { method: 'PUT', body: { availability: form.availability } }).catch(() => {})
      }
      await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: 'stores', secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET }) }).catch(() => {})
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { id: 'basic',        label: 'Basic Info',          icon: Store    },
    { id: 'hours',        label: 'Hours & Map',          icon: Clock    },
    { id: 'features',     label: 'Features',            icon: Tag      },
    { id: 'availability', label: "Today's Availability", icon: ShoppingBasket },
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', background:'rgba(15,23,42,0.3)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#ffffff', border:'1px solid #f1f5f9', borderRadius:'20px', width:'100%', maxWidth:'640px', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation:'db-modal-in 0.2s ease' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Store size={17} style={{ color:'#16a34a' }} />
            </div>
            <div>
              <p style={{ fontWeight:'800', color:'#1e293b', margin:0, fontSize:'15px' }}>{isEdit ? 'Edit Store' : 'Add New Store'}</p>
              <p style={{ fontSize:'12px', color:'#94a3b8', margin:'2px 0 0 0' }}>{isEdit ? store.name : 'Fill in the store details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="db-modal-close"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', flexShrink:0, padding:'0 10px', background:'#ffffff' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setSection(id)}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                padding:'12px 14px',
                fontSize:'12px', fontWeight:'700',
                borderTop: 'none',
                borderRight: 'none',
                borderLeft: 'none',
                borderBottom: section === id ? '2px solid #0f172a' : '2px solid transparent',
                color: section === id ? '#0f172a' : '#94a3b8',
                background:'transparent',
                cursor:'pointer', transition:'all 0.15s',
                marginBottom:'-1px',
              }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
          <div style={{ flex:1, overflowY:'auto', padding:'22px', display:'flex', flexDirection:'column', gap:'16px' }}>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'10px', color:'#dc2626', fontSize:'13px', fontWeight:'600' }}>
                <AlertCircle size={15} style={{ flexShrink:0 }} /> {error}
              </div>
            )}

            {section === 'basic' && (
              <>
                <ImageUpload label="Store Banner Image" value={image} preview={store?.image} onChange={setImage} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
                  <Input label="Store Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="El-Arbol Grafton Street" required />
                  <Input label="Short Name" value={form.short_name} onChange={e => set('short_name', e.target.value)} placeholder="Grafton St" required />
                  <Input label="Store ID" value={form.store_code} onChange={e => set('store_code', e.target.value)} placeholder="STR-001" required />
                </div>
                <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="15 Grafton Street" required />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Dublin" required />
                  <Input label="Full Address" value={form.full_address} onChange={e => set('full_address', e.target.value)} placeholder="15 Grafton St, Dublin 2" />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+353 1 234 5678" />
                  <Input label="Provenance" value={form.provenance} onChange={e => set('provenance', e.target.value)} placeholder="from Almería (optional)" />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <Input label="Display Order" type="number" value={form.order} onChange={e => set('order', e.target.value)} />
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    <label style={labelStyle}>Status</label>
                    <button
                      type="button"
                      onClick={() => set('is_active', !form.is_active)}
                      style={{
                        display:'flex', alignItems:'center', gap:'8px',
                        padding:'9px 14px',
                        borderRadius:'10px',
                        border: form.is_active ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0',
                        background: form.is_active ? '#f0fdf4' : '#f8fafc',
                        color: form.is_active ? '#16a34a' : '#64748b',
                        fontSize:'13px', fontWeight:'700',
                        cursor:'pointer', transition:'all 0.15s',
                      }}>
                      {form.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {form.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {section === 'hours' && (
              <>
                <SectionHeader icon={Clock} title="Opening Hours" subtitle="Set the store open and close times" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <Input label="Open Time" type="time" value={form.open_time} onChange={e => set('open_time', e.target.value)} />
                  <Input label="Close Time" type="time" value={form.close_time} onChange={e => set('close_time', e.target.value)} />
                </div>
                {form.open_time && form.close_time && (
                  (() => {
                    const formatTime12h = (timeStr) => {
                      if (!timeStr) return '';
                      const [h, m] = timeStr.split(':');
                      let hours = parseInt(h, 10);
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      hours = hours % 12;
                      hours = hours ? hours : 12;
                      return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
                    };
                    const isStoreCurrentlyOpen = (openStr, closeStr) => {
                      if (!openStr || !closeStr) return false;
                      const now = new Date();
                      const [oH, oM] = openStr.split(':').map(Number);
                      const openTime = new Date(); openTime.setHours(oH, oM, 0, 0);
                      const [cH, cM] = closeStr.split(':').map(Number);
                      const closeTime = new Date(); closeTime.setHours(cH, cM, 0, 0);
                      if (closeTime < openTime) {
                        return now >= openTime || now <= closeTime;
                      } else {
                        return now >= openTime && now <= closeTime;
                      }
                    };
                    const isOpen = isStoreCurrentlyOpen(form.open_time, form.close_time);
                    return (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background: isOpen ? '#f0fdf4' : '#fef2f2', borderRadius:'10px', border: isOpen ? '1px solid #dcfce7' : '1px solid #fee2e2' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <Clock size={14} style={{ color: isOpen ? '#16a34a' : '#ef4444' }} />
                          <p style={{ fontSize:'13px', color: isOpen ? '#166534' : '#991b1b', margin:0 }}>
                            Hours: <span style={{ fontWeight:'700' }}>{formatTime12h(form.open_time)} — {formatTime12h(form.close_time)}</span>
                          </p>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: isOpen ? '#16a34a' : '#ef4444',
                          color: 'white',
                          letterSpacing: '0.5px'
                        }}>
                          {isOpen ? 'Currently Open' : 'Currently Closed'}
                        </span>
                      </div>
                    );
                  })()
                )}
                <div style={{ marginTop:'8px' }}>
                  <SectionHeader icon={MapPin} title="Google Maps" subtitle="Paste a Google Maps URL — lat/lng is extracted automatically" />
                  <Input label="Map Link" value={form.map_link} onChange={e => set('map_link', e.target.value)} placeholder="https://maps.google.com/..." />
                  {(form.lat || store?.lat) && (
                    <p style={{ fontSize:'11px', color:'#94a3b8', marginTop:'8px' }}>
                      Saved coordinates: {store?.lat}, {store?.lng}
                    </p>
                  )}
                </div>
              </>
            )}

            {section === 'features' && (
              <>
                <SectionHeader icon={Tag} title="Store Features" subtitle="Select what this store offers" />
                <FeaturesPicker selected={form.features} onChange={val => set('features', val)} />
              </>
            )}

            {section === 'availability' && (
              <>
                <SectionHeader icon={ShoppingBasket} title="Today's Availability" subtitle="Manage available categories at this store" />
                <AvailabilityManager items={form.availability} onChange={val => set('availability', val)} />
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'10px', padding:'16px 22px', borderTop:'1px solid #f1f5f9', flexShrink:0, background:'#ffffff' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:'10px', background:'#ffffff', border:'1.5px solid #e2e8f0', color:'#374151', fontSize:'13px', fontWeight:'600', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#ffffff'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ padding:'9px 22px', borderRadius:'10px', background:'#0f172a', color:'white', fontSize:'13px', fontWeight:'700', border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, transition:'all 0.15s', display:'flex', alignItems:'center', gap:'7px', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#0f172a'; }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isEdit ? 'Save Changes' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ store, onClose, onConfirm, loading }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', background:'rgba(15,23,42,0.3)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#ffffff', border:'1px solid #f1f5f9', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'380px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation:'db-modal-in 0.2s ease' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
          <Trash2 size={20} style={{ color:'#ef4444' }} />
        </div>
        <h3 style={{ fontWeight:'800', color:'#1e293b', fontSize:'16px', margin:'0 0 8px 0' }}>Delete Store</h3>
        <p style={{ fontSize:'13px', color:'#64748b', margin:'0 0 24px 0', lineHeight:'1.5' }}>
          Are you sure you want to delete <span style={{ color:'#1e293b', fontWeight:'700' }}>{store.name}</span>? This action cannot be undone.
        </p>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px', borderRadius:'10px', background:'#ffffff', border:'1.5px solid #e2e8f0', color:'#374151', fontSize:'13px', fontWeight:'600', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background='#ffffff'}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex:1, padding:'10px', borderRadius:'10px', background:'#ef4444', color:'white', border:'none', fontSize:'13px', fontWeight:'700', cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1, transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', boxShadow:'0 2px 8px rgba(239,68,68,0.3)' }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#dc2626'; }}
            onMouseLeave={e => e.currentTarget.style.background='#ef4444'}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── View Store Modal ─────────────────────────────────────────────────────────

function ViewStoreModal({ store, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', background:'rgba(15,23,42,0.3)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#ffffff', border:'1px solid #f1f5f9', borderRadius:'20px', width:'100%', maxWidth:'640px', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation:'db-modal-in 0.2s ease' }}>
        
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            {store.image ? (
              <img src={store.image} alt={store.name} style={{ width:'48px', height:'48px', borderRadius:'12px', objectFit:'cover', border:'1px solid #f1f5f9' }} />
            ) : (
              <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Store size={20} style={{ color:'#16a34a' }} />
              </div>
            )}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <h2 style={{ fontSize:'18px', fontWeight:'800', color:'#1e293b', margin:0 }}>{store.name}</h2>
                {(store.storeCode || store.store_code) && (
                  <span style={{ padding:'2px 8px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'11px', color:'#64748b', fontWeight:'700' }}>
                    ID: {store.storeCode || store.store_code}
                  </span>
                )}
                <Badge active={store.is_active} />
              </div>
              <p style={{ fontSize:'13px', color:'#64748b', margin:'4px 0 0 0' }}>{store.fullAddress || store.full_address || store.address}</p>
            </div>
          </div>
          <button onClick={onClose} className="db-modal-close"><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:'24px' }}>
          
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
            {/* Info */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#475569', fontSize:'13px' }}>
                <Phone size={15} style={{ color:'#94a3b8' }} />
                <span style={{ fontWeight:'600' }}>{store.phone || 'No phone'}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#475569', fontSize:'13px' }}>
                <Clock size={15} style={{ color:'#94a3b8' }} />
                <span style={{ fontWeight:'600' }}>{store.openTime || store.open_time} - {store.closeTime || store.close_time}</span>
              </div>
              {store.map_link && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#475569', fontSize:'13px' }}>
                  <MapPin size={15} style={{ color:'#94a3b8' }} />
                  <a href={store.map_link} target="_blank" rel="noreferrer" style={{ fontWeight:'600', color:'#0ea5e9', textDecoration:'none' }}>View on Maps</a>
                </div>
              )}
            </div>

            {/* Features */}
            <div>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px', marginTop:0 }}>Features</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {(store.features || []).map(f => (
                  <span key={f} style={{ padding:'4px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'12px', color:'#475569', fontWeight:'600', textTransform:'capitalize' }}>
                    {f}
                  </span>
                ))}
                {(!store.features || store.features.length === 0) && <span style={{ fontSize:'12px', color:'#94a3b8' }}>None</span>}
              </div>
            </div>
          </div>

          <div style={{ height:'1px', background:'#f1f5f9' }} />

          {/* Availability */}
          <div>
            <p style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', marginTop:0 }}>Today's Availability</p>
            {(store.availability && store.availability.length > 0) ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                {store.availability.map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 12px', background:'#f0fdf4', border:'1px solid #dcfce7', borderRadius:'10px', color:'#166534', fontSize:'13px', fontWeight:'600' }}>
                    <DynamicIcon name={item.icon} size={14} />
                    {item.category}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:'13px', color:'#94a3b8', margin:0, fontStyle:'italic' }}>No availability data provided.</p>
            )}
          </div>

          {/* Leftover Packs */}
          <div>
            <p style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', marginTop:0 }}>Leftover Packs</p>
            {(store.leftover_packs && store.leftover_packs.length > 0) ? (
              <div style={{ display:'grid', gap:'10px' }}>
                {store.leftover_packs.map((pack, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', background:'#f8fafc', border:'1px solid #f1f5f9', borderRadius:'12px' }}>
                    {pack.image && (
                      <img src={pack.image} style={{ width:'48px', height:'48px', borderRadius:'10px', objectFit:'cover', flexShrink:0 }} alt={pack.name} />
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pack.name}</p>
                      <p style={{ fontSize:'12px', color:'#94a3b8', margin:'2px 0 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pack.description}</p>
                    </div>
                    <span style={{ fontSize:'14px', fontWeight:'800', color:'#16a34a' }}>€{pack.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:'13px', color:'#94a3b8', margin:0, fontStyle:'italic' }}>No leftover packs available.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Store Row ────────────────────────────────────────────────────────────────

function StoreRow({ store, onEdit, onDelete, onToggle, onView }) {
  const [hovered, setHovered] = useState(false)
  return (
    <tr
      onClick={() => onView(store)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderBottom:'1px solid #f8fafc', background: hovered ? '#f8fafc' : '#ffffff', transition:'background 0.1s', cursor: 'pointer' }}>
      <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {store.image ? (
            <img src={store.image} alt={store.name} style={{ width:'42px', height:'42px', borderRadius:'10px', objectFit:'cover', flexShrink:0, border:'1px solid #f1f5f9' }} />
          ) : (
            <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Store size={16} style={{ color:'#94a3b8' }} />
            </div>
          )}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#1e293b', margin:0, wordBreak: 'break-word' }}>{store.name}</p>
              {(store.storeCode || store.store_code) && (
                <span style={{ padding:'2px 6px', background:'#f1f5f9', borderRadius:'4px', fontSize:'10px', color:'#64748b', fontWeight:'700', border:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>
                  {store.storeCode || store.store_code}
                </span>
              )}
            </div>
            <p style={{ fontSize:'11px', color:'#94a3b8', margin:'2px 0 0 0' }}>{store.shortName || store.short_name}</p>
          </div>
        </div>
      </td>
      <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'#64748b', fontWeight:'500' }}>
          <MapPin size={11} style={{ color:'#94a3b8' }} />
          {store.city}
        </div>
      </td>
      <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'#64748b', fontWeight:'500' }}>
          <Clock size={11} style={{ color:'#94a3b8' }} />
          {store.hours || `${store.openTime || store.open_time} — ${store.closeTime || store.close_time}`}
        </div>
      </td>
      <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
          {(store.features || []).slice(0, 3).map(f => (
            <span key={f} style={{ padding:'2px 8px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'10px', color:'#64748b', fontWeight:'600', textTransform:'capitalize' }}>
              {f}
            </span>
          ))}
          {(store.features || []).length > 3 && (
            <span style={{ padding:'2px 8px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'10px', color:'#94a3b8', fontWeight:'600' }}>
              +{store.features.length - 3}
            </span>
          )}
        </div>
      </td>
      <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
        <Badge active={store.is_active} />
      </td>
      <td style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'4px', opacity: hovered ? 1 : 0, transition:'opacity 0.15s' }}>
          <button onClick={(e) => { e.stopPropagation(); onToggle(store); }} className="db-icon-btn" title={store.is_active ? 'Deactivate' : 'Activate'}>
            {store.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(store); }} className="db-icon-btn" title="Edit">
            <Edit2 size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(store); }} className="db-icon-btn danger" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StoresPage() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const [editStore, setEditStore] = useState(null)
  const [viewStore, setViewStore] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteStore, setDeleteStore] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetch('/api/fulfillment/stores/admin/')
      setStores(Array.isArray(data) ? data : (data.results || []))
    } catch (e) {
      setError(e.message || 'Failed to load stores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = stores.filter(s => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase()) ||
      (s.storeCode || s.store_code)?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterActive === 'all' ||
      (filterActive === 'active' && s.is_active) ||
      (filterActive === 'inactive' && !s.is_active)
    return matchSearch && matchStatus
  })

  const handleEdit  = (store) => { setEditStore(store); setShowForm(true) }
  const handleAdd   = () => { setEditStore(null); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditStore(null) }
  const handleSaved = () => { handleClose(); load() }

  const handleToggle = async (store) => {
    setStores(prev => prev.map(s => s.id === store.id ? { ...s, is_active: !s.is_active } : s))
    try {
      const fd = new FormData()
      fd.append('is_active', store.is_active ? 'false' : 'true')
      await adminFetch(`/api/fulfillment/stores/${store.id}/`, { method: 'PATCH', body: fd })
      load()
    } catch (e) {
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, is_active: store.is_active } : s))
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminFetch(`/api/fulfillment/stores/${deleteStore.id}/`, { method: 'DELETE' })
      setDeleteStore(null)
      load()
    } catch (e) { console.error('Delete error:', e) }
    finally { setDeleting(false) }
  }

  const activeCount   = stores.filter(s => s.is_active).length
  const inactiveCount = stores.filter(s => !s.is_active).length

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:'900', color:'#0f172a', margin:0, letterSpacing:'-0.02em' }}>Stores</h1>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px', fontWeight:'500' }}>Manage physical store locations, hours and features</p>
        </div>
        <button
          onClick={handleAdd}
          className="db-btn-primary w-full sm:w-auto justify-center"
        >
          <Plus size={15} /> Add Store
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Stores', value: stores.length,  color: '#1e293b',  bg: '#ffffff',  border: '#f1f5f9' },
          { label: 'Active',       value: activeCount,    color: '#16a34a',  bg: '#f0fdf4',  border: '#dcfce7' },
          { label: 'Inactive',     value: inactiveCount,  color: '#94a3b8',  bg: '#ffffff',  border: '#f1f5f9' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius:'14px', padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px 0' }}>{label}</p>
            <p style={{ fontSize:'28px', fontWeight:'900', color, margin:0, lineHeight:1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full sm:max-w-[300px]">
          <Search size={14} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stores…"
            style={{
              ...inputStyle,
              paddingLeft:'36px',
              borderColor: searchFocused ? '#6366f1' : '#e2e8f0',
              boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto p-1 bg-white border border-slate-200 rounded-xl">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              style={{
                padding:'6px 14px',
                borderRadius:'8px',
                fontSize:'12px', fontWeight:'700',
                textTransform:'capitalize',
                border:'none',
                background: filterActive === f ? '#0f172a' : 'transparent',
                color: filterActive === f ? '#ffffff' : '#94a3b8',
                cursor:'pointer', transition:'all 0.15s',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background:'#ffffff', border:'1px solid #f1f5f9', borderRadius:'16px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px', gap:'10px', color:'#94a3b8', fontSize:'14px', fontWeight:'500' }}>
            <Loader2 size={18} className="animate-spin" /> Loading stores…
          </div>
        ) : error ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px', gap:'12px' }}>
            <AlertCircle size={24} style={{ color:'#ef4444' }} />
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#ef4444', margin:0 }}>{error}</p>
            <button onClick={load}
              style={{ padding:'8px 18px', background:'#ffffff', border:'1.5px solid #e2e8f0', color:'#374151', fontSize:'13px', fontWeight:'600', borderRadius:'10px', cursor:'pointer' }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px', gap:'12px' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Store size={24} style={{ color:'#94a3b8' }} />
            </div>
            <p style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b', margin:0 }}>No stores found</p>
            <p style={{ fontSize:'12px', color:'#94a3b8', margin:0, fontWeight:'500' }}>
              {search ? 'Try a different search term' : 'Add your first store to get started'}
            </p>
            {!search && (
              <button onClick={handleAdd} className="db-btn-primary" style={{ marginTop:'8px' }}>
                <Plus size={14} /> Add Store
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #f1f5f9', background:'#f8fafc' }}>
                  {['Store', 'City', 'Hours', 'Features', 'Status', ''].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'800', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(store => (
                  <StoreRow key={store.id} store={store} onEdit={handleEdit} onDelete={setDeleteStore} onToggle={handleToggle} onView={setViewStore} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewStore && (
        <ViewStoreModal store={viewStore} onClose={() => setViewStore(null)} />
      )}
      {showForm && (
        <StoreFormModal store={editStore} onClose={handleClose} onSave={handleSaved} />
      )}
      {deleteStore && (
        <DeleteConfirm store={deleteStore} onClose={() => setDeleteStore(null)} onConfirm={handleDelete} loading={deleting} />
      )}
    </div>
  )
}