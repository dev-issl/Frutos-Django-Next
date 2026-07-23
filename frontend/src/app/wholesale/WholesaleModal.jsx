'use client'
// src/app/wholesale/WholesaleModal.jsx
import { useState, useEffect, useRef } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { wholesaleRegister } from '@/lib/api'
import { useAuth } from '@/app/context/AuthContext'

function PineTree() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#00694C">
      <polygon points="12,2 5.5,10.5 8.5,10.5 3,18 21,18 15.5,10.5 18.5,10.5" />
      <rect x="10.5" y="18" width="3" height="3.5" rx="0.4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="#00694c" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

const BUSINESS_TYPES = [
  'Restaurant / Bistro', 'Hotel / Resort', 'Catering Company',
  'Food Retail / Grocery', 'Dark Kitchen', 'Café / Bakery', 'Other',
]

const BUSINESS_TYPE_VALUES = {
  'Restaurant / Bistro': 'restaurant', 'Hotel / Resort': 'hotel',
  'Catering Company': 'catering', 'Food Retail / Grocery': 'food_retail',
  'Dark Kitchen': 'dark_kitchen', 'Café / Bakery': 'cafe', 'Other': 'other',
}

const VOLUME_RANGES = [
  '€400 – €1,000 / month', '€1,000 – €3,000 / month',
  '€3,000 – €7,000 / month', '€7,000+ / month',
]

const VOLUME_VALUES = {
  '€400 – €1,000 / month': '400_1000',
  '€1,000 – €3,000 / month': '1000_3000',
  '€3,000 – €7,000 / month': '3000_7000',
  '€7,000+ / month': '7000_plus',
}

const EMPTY_APPLY = {
  businessName: '', contactName: '', tradeLicense: '', email: '', phone: '',
  businessType: '', volume: '', postcode: '', password: '',
}


const WS_API = (process.env.NEXT_PUBLIC_API_URL) + '/wholesale'

function WholesaleForgotPasswordFlow({ onBack, onSuccess }) {
  const [step, setStep]         = useState('email')
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${WS_API}/auth/password-reset/send-otp/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP.')
      setStep('otp'); setResendTimer(60)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return }
    setStep('password'); setError('')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Min. 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${WS_API}/auth/password-reset/verify/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Reset failed.')
      setStep('done')
    } catch (err) { setError(err.message); if (err.message.includes('OTP')) setStep('otp') }
    finally { setLoading(false) }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      await fetch(`${WS_API}/auth/password-reset/send-otp/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendTimer(60)
    } catch {}
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '10px 13px', border: '1.5px solid #C8D5CC', borderRadius: '10px', background: '#fff', color: '#151E13', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' }

  return (
    <div>
      {step !== 'done' && (
        <button onClick={step === 'email' ? onBack : () => { setStep('email'); setError('') }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6D7A73', fontSize: '13px', padding: '0 0 16px', fontFamily: 'inherit' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {step === 'email' ? 'Back to login' : 'Change email'}
        </button>
      )}
      {step !== 'done' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {['email','otp','password'].map((s,i) => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '99px', background: ['email','otp','password'].indexOf(step) >= i ? '#00694C' : '#E7F1DF', transition: 'background .3s' }} />
          ))}
        </div>
      )}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#D94040' }}>{error}</div>}

      {step === 'email' && (
        <form onSubmit={handleSendOTP}>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#151E13', margin: '0 0 6px' }}>Forgot password?</h2>
          <p style={{ fontSize: '13px', color: '#6D7A73', margin: '0 0 18px', lineHeight: 1.55 }}>Enter your wholesale email to receive a reset OTP.</p>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#2D3A35', marginBottom: '5px' }}>Business Email</label>
          <input style={inp} type="email" placeholder="orders@yourbusiness.com" value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onFocus={e => e.target.style.borderColor = '#00694C'}
            onBlur={e => e.target.style.borderColor = '#C8D5CC'} />
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#151E13', margin: '0 0 6px' }}>Check your email</h2>
          <p style={{ fontSize: '13px', color: '#6D7A73', margin: '0 0 18px', lineHeight: 1.55 }}>We sent a code to <strong style={{ color: '#151E13' }}>{email}</strong>.</p>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#2D3A35', marginBottom: '5px' }}>6-Digit OTP</label>
          <input style={{ ...inp, letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center', fontWeight: 700 }}
            type="text" inputMode="numeric" maxLength={6} placeholder="──────"
            value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setError('') }}
            onFocus={e => e.target.style.borderColor = '#00694C'}
            onBlur={e => e.target.style.borderColor = '#C8D5CC'} />
          <button type="submit" disabled={otp.length !== 6}
            style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: otp.length !== 6 ? 'not-allowed' : 'pointer', opacity: otp.length !== 6 ? 0.65 : 1, fontFamily: 'inherit' }}>
            Verify OTP
          </button>
          <p style={{ fontSize: '13px', color: '#6D7A73', textAlign: 'center', marginTop: '14px' }}>
            Didn't receive it?{' '}
            <button type="button" onClick={handleResend} disabled={resendTimer > 0}
              style={{ color: resendTimer > 0 ? '#BCCAC1' : '#00694C', fontWeight: 600, background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', padding: 0, fontSize: '13px', fontFamily: 'inherit' }}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
            </button>
          </p>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleResetPassword}>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#151E13', margin: '0 0 6px' }}>New password</h2>
          <p style={{ fontSize: '13px', color: '#6D7A73', margin: '0 0 18px' }}>Choose a strong password.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#2D3A35', marginBottom: '5px' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: '40px' }} type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={e => e.target.style.borderColor = '#00694C'}
                  onBlur={e => e.target.style.borderColor = '#C8D5CC'} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6D7A73', display: 'flex' }}>
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#2D3A35', marginBottom: '5px' }}>Confirm Password</label>
              <input style={inp} type="password" placeholder="Re-enter password"
                value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                onFocus={e => e.target.style.borderColor = '#00694C'}
                onBlur={e => e.target.style.borderColor = '#C8D5CC'} />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '12px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#E7F1DF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <svg width="26" height="26" fill="none" stroke="#00694C" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#151E13', margin: '0 0 10px' }}>Password reset!</h2>
          <p style={{ fontSize: '13px', color: '#6D7A73', margin: '0 0 22px', lineHeight: 1.6 }}>
            Your wholesale password has been updated. Log in with your new password.
          </p>
          <button onClick={onSuccess}
            style={{ width: '100%', padding: '12px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to Login
          </button>
        </div>
      )}
    </div>
  )
}


export default function WholesaleModal({ isOpen, onClose }) {
  const { data: session } = useSession()
  const { user: normalUser, logout: normalLogout } = useAuth()
  const [step, setStep] = useState(1)  // 1=apply, 2=login, 3=success
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [applyData, setApplyData] = useState(EMPTY_APPLY)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const overlayRef = useRef(null)

  const [showForgot, setShowForgot] = useState(false)

  // If user is already logged in via NextAuth, jump to success-like state
  const isLoggedIn = !!session?.user

  useEffect(() => {
    if (isOpen) {
      setStep(1); setErrors({}); setServerError('')
      setApplyData(EMPTY_APPLY); setLoginData({ email: '', password: '' })
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const handleOverlay = (e) => { if (e.target === overlayRef.current) onClose() }

  const handleApplyChange = (e) => {
    const { name, value } = e.target
    setApplyData(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    setServerError('')
  }

  const validateApply = () => {
    const e = {}
    const tradeLicense = applyData.tradeLicense.trim()
    const phone = applyData.phone.trim()
    const phonePattern = /^\+?[\d\s\-()]{7,25}$/
    const tradePattern = /^[A-Za-z0-9\-\/\s]{4,100}$/

    if (!applyData.businessName.trim()) e.businessName = 'Required'
    if (!applyData.contactName.trim()) e.contactName = 'Required'
    if (!tradeLicense) e.tradeLicense = 'Required'
    else if (!tradePattern.test(tradeLicense)) e.tradeLicense = 'Enter a valid license number'
    if (!applyData.email.trim() || !/\S+@\S+\.\S+/.test(applyData.email)) e.email = 'Valid email required'
    if (!phone) e.phone = 'Required'
    else if (!phonePattern.test(phone)) e.phone = 'Enter a valid phone number'
    if (!applyData.businessType) e.businessType = 'Please select a type'
    if (!applyData.volume) e.volume = 'Please select a range'
    if (!applyData.password || applyData.password.length < 8) e.password = 'Min. 8 characters'
    return e
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    const errs = validateApply()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')
    try {
      // 1. Register with Django backend
      const payload = {
        email: applyData.email.toLowerCase(),
        password: applyData.password,
        business_name: applyData.businessName,
        contact_name: applyData.contactName,
        trade_license_number: applyData.tradeLicense,
        phone: applyData.phone,
        postcode: applyData.postcode,
        business_type: BUSINESS_TYPE_VALUES[applyData.businessType] || 'other',
        monthly_volume: VOLUME_VALUES[applyData.volume] || '400_1000',
      }
      await wholesaleRegister(payload)

      // 2. Clear any existing normal user session before auto sign-in
      if (normalUser) {
        await normalLogout()
      }
      // Also clear existing wholesale session if any
      if (session?.user) {
        await signOut({ redirect: false })
      }

      // 3. Auto sign-in via NextAuth so they get a session
      await signIn('wholesale', {
        email: applyData.email,
        password: applyData.password,
        redirect: false,
      })

      setStep(3)
    } catch (err) {
      const fieldMap = {
        business_name: 'businessName',
        contact_name: 'contactName',
        trade_license_number: 'tradeLicense',
        phone: 'phone',
        postcode: 'postcode',
        business_type: 'businessType',
        monthly_volume: 'volume',
        email: 'email',
        password: 'password',
      }
      const backendErrors = {}
      let message = ''

      const mapErrorValue = (value) => {
        if (Array.isArray(value)) return value[0]
        if (typeof value === 'object' && value !== null) return JSON.stringify(value)
        return String(value)
      }

      if (err && typeof err === 'object') {
        for (const [key, value] of Object.entries(err)) {
          const target = fieldMap[key] || key
          const text = mapErrorValue(value)
          if (target in applyData || target === 'businessType' || target === 'volume') {
            backendErrors[target] = text
          } else if (key === 'non_field_errors' || key === 'detail' || key === 'error') {
            message = text
          } else if (!message) {
            message = text
          }
        }
      } else if (typeof err === 'string') {
        message = err
      }

      if (Object.keys(backendErrors).length) {
        setErrors(prev => ({ ...prev, ...backendErrors }))
        setServerError(message || '')
      } else {
        const msg = message || err?.non_field_errors?.[0] || err?.detail || err?.message || 'Something went wrong. Please try again.'
        setServerError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!loginData.email.trim()) errs.email = 'Required'
    if (!loginData.password) errs.password = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')
    try {
      // Clear any existing normal user session before wholesale login
      if (normalUser) {
        await normalLogout()
      }
      // Clear any existing wholesale session if any
      if (session?.user) {
        await signOut({ redirect: false })
      }

      const result = await signIn('wholesale', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })
      if (result?.error) {
        setServerError('Invalid email or password. Please try again.')
      } else {
        onClose()
        window.location.href = '/wholesale/profile'
      }
    } catch {
      setServerError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('cart_items')
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart_clear'))
    await signOut({ redirect: false })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div ref={overlayRef} onClick={handleOverlay} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5, 20, 13, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
      animation: 'wsOverlayIn 0.2s ease',
    }}>
      <style>{`
        @keyframes wsOverlayIn { from{opacity:0} to{opacity:1} }
        @keyframes wsSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ws-inp{width:100%;padding:10px 13px;border:1.5px solid #C8D5CC;border-radius:10px;background:#fff;color:#151E13;font-size:13.5px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
        .ws-inp:focus{border-color:#00694C;box-shadow:0 0 0 3px rgba(0,105,76,0.1)}
        .ws-inp::placeholder{color:#A0ADA6}
        .ws-inp-err{border-color:#D94040!important}
        .ws-sel{width:100%;padding:10px 13px;border:1.5px solid #C8D5CC;border-radius:10px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236D7A73' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;color:#151E13;font-size:13.5px;outline:none;cursor:pointer;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit;appearance:none}
        .ws-sel:focus{border-color:#00694C;box-shadow:0 0 0 3px rgba(0,105,76,0.1)}
        .ws-sel-err{border-color:#D94040!important}
        .ws-btn{width:100%;padding:12px;background:#00694C;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s,transform .1s;letter-spacing:.01em;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
        .ws-btn:hover:not(:disabled){background:#005540}
        .ws-btn:active:not(:disabled){transform:scale(0.99)}
        .ws-btn:disabled{opacity:0.65;cursor:not-allowed}
        .ws-err-msg{font-size:11.5px;color:#D94040;margin:3px 0 0}
        .ws-label{display:block;font-size:12.5px;font-weight:600;color:#2D3A35;margin-bottom:5px}
        .ws-pass-eye{position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6D7A73;display:flex;align-items:center;padding:2px}
        .ws-pass-eye:hover{color:#151E13}
        .ws-scroll::-webkit-scrollbar{width:3px}
        .ws-scroll::-webkit-scrollbar-thumb{background:#C8D5CC;border-radius:3px}
        .ws-tab{flex:1;padding:8px 0;background:none;border:none;font-size:13.5px;font-weight:600;cursor:pointer;border-radius:8px;transition:all .15s;font-family:inherit}
        .ws-tab-active{background:white;color:#085041;box-shadow:0 1px 4px rgba(0,0,0,0.1)}
        .ws-tab-inactive{color:#6D7A73}
      `}</style>

      <div style={{
        background: '#F7FAF8', borderRadius: '22px', width: '100%',
        maxWidth: step === 3 ? '420px' : '480px',
        maxHeight: 'calc(100dvh - 64px)',
        display: 'flex', flexDirection: 'column',
        animation: 'wsSlideUp 0.24s ease',
        boxShadow: '0 24px 80px rgba(5,20,13,0.22), 0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden', position: 'relative',
      }}>

        {/* Header */}
        <div style={{ padding: '24px 26px 0', flexShrink: 0 }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px',
            borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6D7A73',
          }}>
            <CloseIcon />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: step === 3 ? '0' : '18px' }}>
            <PineTree />
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '19px', fontWeight: 700, color: '#085041' }}>
              El Árbol
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: '#00694C', color: '#fff', borderRadius: '100px', padding: '2px 8px', marginLeft: '4px',
            }}>Wholesale</span>
          </div>

          {step !== 3 && (
            <div style={{ display: 'flex', background: '#E7F1DF', borderRadius: '10px', padding: '4px', gap: '2px' }}>
              <button className={`ws-tab ${step === 1 ? 'ws-tab-active' : 'ws-tab-inactive'}`}
                onClick={() => { setStep(1); setErrors({}); setServerError('') }}>
                Apply for Account
              </button>
              <button className={`ws-tab ${step === 2 ? 'ws-tab-active' : 'ws-tab-inactive'}`}
                onClick={() => { setStep(2); setErrors({}); setServerError('') }}>
                Log In
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="ws-scroll" style={{ overflowY: 'auto', padding: '20px 26px 28px', flex: 1 }}>

          {/* ── APPLY ── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '21px', fontWeight: 700, color: '#151E13', margin: '0 0 5px' }}>
                  Open a wholesale account
                </h2>
                <p style={{ fontSize: '13px', color: '#6D7A73', margin: 0, lineHeight: 1.55 }}>
                  Review within 1 business day. Minimum order €400/month.
                </p>
              </div>

              <div style={{ background: '#E7F1DF', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
                <svg width="16" height="16" fill="none" stroke="#00694c" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ fontSize: '12px', color: '#3A5A44', margin: 0, lineHeight: 1.6 }}>
                  Wholesale account is <strong>separate</strong> from the retail store. A dedicated account manager will contact you within 24 hours.
                </p>
              </div>

              {serverError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#D94040' }}>
                  {serverError}
                </div>
              )}

              <form onSubmit={handleApplySubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="ws-label">Business Name *</label>
                      <input className={`ws-inp${errors.businessName ? ' ws-inp-err' : ''}`} name="businessName" placeholder="Restaurante Sol" value={applyData.businessName} onChange={handleApplyChange} />
                      {errors.businessName && <p className="ws-err-msg">{errors.businessName}</p>}
                    </div>
                    <div>
                      <label className="ws-label">Contact Name *</label>
                      <input className={`ws-inp${errors.contactName ? ' ws-inp-err' : ''}`} name="contactName" placeholder="María García" value={applyData.contactName} onChange={handleApplyChange} />
                      {errors.contactName && <p className="ws-err-msg">{errors.contactName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="ws-label">Business Email *</label>
                    <input className={`ws-inp${errors.email ? ' ws-inp-err' : ''}`} type="email" name="email" placeholder="orders@yourbusiness.com" value={applyData.email} onChange={handleApplyChange} autoComplete="email" />
                    {errors.email && <p className="ws-err-msg">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="ws-label">Trade License Number *</label>
                    <input className={`ws-inp${errors.tradeLicense ? ' ws-inp-err' : ''}`} name="tradeLicense" placeholder="e.g. TL-123456" value={applyData.tradeLicense} onChange={handleApplyChange} required />
                    {errors.tradeLicense && <p className="ws-err-msg">{errors.tradeLicense}</p>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="ws-label">Phone *</label>
                      <input className={`ws-inp${errors.phone ? ' ws-inp-err' : ''}`} name="phone" placeholder="+34 600 000 000" value={applyData.phone} onChange={handleApplyChange} required />
                      {errors.phone && <p className="ws-err-msg">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="ws-label">Delivery Postcode</label>
                      <input className="ws-inp" name="postcode" placeholder="28001" value={applyData.postcode} onChange={handleApplyChange} />
                    </div>
                  </div>

                  <div>
                    <label className="ws-label">Business Type *</label>
                    <select className={`ws-sel${errors.businessType ? ' ws-sel-err' : ''}`} name="businessType" value={applyData.businessType} onChange={handleApplyChange}>
                      <option value="">Select type…</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.businessType && <p className="ws-err-msg">{errors.businessType}</p>}
                  </div>

                  <div>
                    <label className="ws-label">Estimated Monthly Volume *</label>
                    <select className={`ws-sel${errors.volume ? ' ws-sel-err' : ''}`} name="volume" value={applyData.volume} onChange={handleApplyChange}>
                      <option value="">Select range…</option>
                      {VOLUME_RANGES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {errors.volume && <p className="ws-err-msg">{errors.volume}</p>}
                  </div>

                  <div>
                    <label className="ws-label">Create Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input className={`ws-inp${errors.password ? ' ws-inp-err' : ''}`}
                        type={showPass ? 'text' : 'password'} name="password"
                        placeholder="Min. 8 characters" value={applyData.password}
                        onChange={handleApplyChange} autoComplete="new-password"
                        style={{ paddingRight: '40px' }} />
                      <button type="button" className="ws-pass-eye" onClick={() => setShowPass(p => !p)}>
                        <EyeIcon show={showPass} />
                      </button>
                    </div>
                    {errors.password && <p className="ws-err-msg">{errors.password}</p>}
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#9DAAA3', lineHeight: 1.5, margin: '2px 0 0' }}>
                    By applying you agree to our <span style={{ color: '#00694C', cursor: 'pointer' }}>Wholesale Terms</span> and <span style={{ color: '#00694C', cursor: 'pointer' }}>Privacy Policy</span>.
                  </p>

                  <button type="submit" className="ws-btn" disabled={loading} style={{ marginTop: '4px' }}>
                    {loading ? <><SpinnerIcon /> Submitting…</> : 'Submit Application'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── LOGIN ── */}

          {step === 2 && showForgot && (
            <WholesaleForgotPasswordFlow
              onBack={() => setShowForgot(false)}
              onSuccess={() => { setShowForgot(false); setErrors({}); setServerError('') }}
            />
          )}
          {step === 2 && !showForgot && (
            <>
              <div style={{ marginBottom: '22px' }}>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '21px', fontWeight: 700, color: '#151E13', margin: '0 0 5px' }}>
                  Welcome back
                </h2>
                <p style={{ fontSize: '13px', color: '#6D7A73', margin: 0 }}>Sign in to your wholesale account</p>
              </div>

              {serverError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#D94040' }}>
                  {serverError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="ws-label">Business Email</label>
                    <input className={`ws-inp${errors.email ? ' ws-inp-err' : ''}`} type="email"
                      placeholder="orders@yourbusiness.com" value={loginData.email}
                      onChange={e => { setLoginData(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); setServerError('') }} />
                    {errors.email && <p className="ws-err-msg">{errors.email}</p>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label className="ws-label" style={{ margin: 0 }}>Password</label>
                      <button type="button" onClick={() => { setShowForgot(true); setErrors({}); setServerError('') }}
                        style={{ fontSize: '12px', color: '#00694C', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input className={`ws-inp${errors.password ? ' ws-inp-err' : ''}`}
                        type={showPass ? 'text' : 'password'} placeholder="••••••••"
                        value={loginData.password}
                        onChange={e => { setLoginData(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); setServerError('') }}
                        style={{ paddingRight: '40px' }} />
                      <button type="button" className="ws-pass-eye" onClick={() => setShowPass(p => !p)}>
                        <EyeIcon show={showPass} />
                      </button>
                    </div>
                    {errors.password && <p className="ws-err-msg">{errors.password}</p>}
                  </div>

                  <button type="submit" className="ws-btn" disabled={loading} style={{ marginTop: '6px' }}>
                    {loading ? <><SpinnerIcon /> Signing in…</> : 'Log In to Wholesale'}
                  </button>
                </div>
              </form>

              <p style={{ fontSize: '12.5px', color: '#6D7A73', textAlign: 'center', marginTop: '18px' }}>
                Don&apos;t have an account?{' '}
                <button onClick={() => { setStep(1); setErrors({}); setServerError('') }}
                  style={{ color: '#00694C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12.5px', fontFamily: 'inherit' }}>
                  Apply now
                </button>
              </p>
            </>
          )}

          {/* ── SUCCESS ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '32px 16px 8px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E7F1DF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckIcon />
              </div>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#151E13', margin: '0 0 10px' }}>
                Application received!
              </h2>
              <p style={{ fontSize: '14px', color: '#6D7A73', lineHeight: 1.7, margin: '0 0 10px' }}>
                Thank you, <strong style={{ color: '#151E13' }}>{applyData.contactName || 'there'}</strong>. We&apos;ll review your application for{' '}
                <strong style={{ color: '#151E13' }}>{applyData.businessName || 'your business'}</strong> within 1 business day.
              </p>
              <p style={{ fontSize: '13px', color: '#9DAAA3', lineHeight: 1.6, margin: '0 0 28px' }}>
                Confirmation email sent to <strong>{applyData.email}</strong>.
              </p>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #E2EDE6', textAlign: 'left', marginBottom: '20px' }}>
                {['Confirmation email sent immediately', 'Account review within 1 business day', 'Onboarding call from your account manager', 'First delivery within 48 hours of approval'].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: i < 3 ? '0 0 10px' : '0', borderBottom: i < 3 ? '1px solid #F0F5F2' : 'none' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E7F1DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#00694C' }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#3A5A44' }}>{s}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { onClose(); window.location.href = '/wholesale/profile'; }} className="ws-btn">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}