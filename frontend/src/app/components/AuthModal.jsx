'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function PineTree() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#00694C">
      <polygon points="12,2 5.5,10.5 8.5,10.5 3,18 21,18 15.5,10.5 18.5,10.5" />
      <rect x="10.5" y="18" width="3" height="3.5" rx="0.4" />
    </svg>
  )
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

// ── Forgot Password Steps ─────────────────────────────────────────────────────

function ForgotPasswordFlow({ onBack, onSuccess }) {
  const [step, setStep]           = useState('email')   // email → otp → password → done
  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP.')
      setStep('otp')
      setResendTimer(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return }
    setStep('password')
    setError('')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Reset failed.')
      setStep('done')
    } catch (err) {
      setError(err.message)
      if (err.message.includes('OTP')) setStep('otp')  // OTP error হলে back to OTP step
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setLoading(true); setError('')
    try {
      await fetch(`${API_BASE}/auth/password-reset/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendTimer(60)
    } catch {}
    finally { setLoading(false) }
  }

  const inp = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #BCCAC1',
    borderRadius: '10px', background: '#FAFAF8', color: '#151E13',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div>
      {/* Back button */}
      {step !== 'done' && (
        <button onClick={step === 'email' ? onBack : () => { setStep('email'); setError('') }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6D7A73', fontSize: '13px', padding: '0 0 16px', fontFamily: 'inherit' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {step === 'email' ? 'Back to login' : 'Change email'}
        </button>
      )}

      {/* Step indicator */}
      {step !== 'done' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {['email', 'otp', 'password'].map((s, i) => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: '99px',
              background: ['email', 'otp', 'password'].indexOf(step) >= i ? '#00694C' : '#E8F0EA',
              transition: 'background .3s',
            }} />
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#BA1A1A' }}>
          {error}
        </div>
      )}

      {/* STEP 1: Email */}
      {step === 'email' && (
        <form onSubmit={handleSendOTP}>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#151E13', margin: '0 0 6px' }}>
            Forgot password?
          </h2>
          <p style={{ fontSize: '13.5px', color: '#6D7A73', margin: '0 0 20px', lineHeight: 1.5 }}>
            Enter your email and we'll send a 6-digit OTP to reset your password.
          </p>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>
            Email Address
          </label>
          <input style={inp} type="email" placeholder="you@example.com"
            value={email} onChange={e => { setEmail(e.target.value); setError('') }}
            onFocus={e => e.target.style.borderColor = '#00694C'}
            onBlur={e => e.target.style.borderColor = '#BCCAC1'} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', marginTop: '16px', padding: '11px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* STEP 2: OTP */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#151E13', margin: '0 0 6px' }}>
            Check your email
          </h2>
          <p style={{ fontSize: '13.5px', color: '#6D7A73', margin: '0 0 20px', lineHeight: 1.5 }}>
            We sent a 6-digit code to <strong style={{ color: '#151E13' }}>{email}</strong>. It expires in 10 minutes.
          </p>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>
            Enter OTP
          </label>
          <input style={{ ...inp, letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center', fontWeight: 700 }}
            type="text" inputMode="numeric" maxLength={6} placeholder="──────"
            value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
            onFocus={e => e.target.style.borderColor = '#00694C'}
            onBlur={e => e.target.style.borderColor = '#BCCAC1'} />
          <button type="submit" disabled={loading || otp.length !== 6}
            style={{ width: '100%', marginTop: '16px', padding: '11px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: 600, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer', opacity: (loading || otp.length !== 6) ? 0.65 : 1, fontFamily: 'inherit' }}>
            Verify OTP
          </button>
          <p style={{ fontSize: '13px', color: '#6D7A73', textAlign: 'center', marginTop: '14px' }}>
            Didn't receive it?{' '}
            <button type="button" onClick={handleResend} disabled={resendTimer > 0}
              style={{ color: resendTimer > 0 ? '#BCCAC1' : '#00694C', fontWeight: 600, background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer', padding: 0, fontSize: '13px', fontFamily: 'inherit' }}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </p>
        </form>
      )}

      {/* STEP 3: New Password */}
      {step === 'password' && (
        <form onSubmit={handleResetPassword}>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#151E13', margin: '0 0 6px' }}>
            Set new password
          </h2>
          <p style={{ fontSize: '13.5px', color: '#6D7A73', margin: '0 0 20px' }}>
            Choose a strong password for your account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: '40px' }}
                  type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={e => e.target.style.borderColor = '#00694C'}
                  onBlur={e => e.target.style.borderColor = '#BCCAC1'} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6D7A73', display: 'flex' }}>
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>Confirm Password</label>
              <input style={inp} type="password" placeholder="Re-enter password"
                value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                onFocus={e => e.target.style.borderColor = '#00694C'}
                onBlur={e => e.target.style.borderColor = '#BCCAC1'} />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '11px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E7F1DF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" fill="none" stroke="#00694C" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#151E13', margin: '0 0 10px' }}>
            Password reset!
          </h2>
          <p style={{ fontSize: '13.5px', color: '#6D7A73', margin: '0 0 24px', lineHeight: 1.6 }}>
            Your password has been updated. You can now log in with your new password.
          </p>
          <button onClick={onSuccess}
            style={{ width: '100%', padding: '11px', background: '#00694C', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Go to Login
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main AuthModal ────────────────────────────────────────────────────────────

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }) {
  const { login, register } = useAuth()

  const [mode,        setMode]        = useState(defaultMode)
  const [showForgot,  setShowForgot]  = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [apiError,    setApiError]    = useState('')
  const [formData,    setFormData]    = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const overlayRef = useRef(null)

  useEffect(() => { setMode(defaultMode); setShowForgot(false) }, [defaultMode, isOpen])
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function switchMode(m) {
    setMode(m); setErrors({}); setApiError(''); setShowForgot(false)
    setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function validate() {
    const e = {}
    if (mode === 'signup' && !formData.firstName.trim()) e.firstName = 'First name is required'
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email'
    if (!formData.password) e.password = 'Password is required'
    else if (mode === 'signup' && formData.password.length < 8) e.password = 'Min. 8 characters'
    if (mode === 'signup' && formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Passwords do not match'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError('')
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        await register({ email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword, firstName: formData.firstName, lastName: formData.lastName })
      }
      onClose()
    } catch (err) {
      setApiError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,28,20,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', overflowY: 'auto', animation: 'authFadeIn 0.18s ease' }}>
      <style>{`
        @keyframes authFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes authSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .ai{width:100%;padding:10px 14px;border:1.5px solid #BCCAC1;border-radius:10px;background:#FAFAF8;color:#151E13;font-size:14px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;}
        .ai:focus{border-color:#00694C;box-shadow:0 0 0 3px rgba(0,105,76,.12);}
        .ai::placeholder{color:#9DAAA3;}
        .ai-err{border-color:#C84040!important;}
        .abp{width:100%;padding:11px;background:#00694C;color:white;border:none;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;transition:background .15s;}
        .abp:hover:not(:disabled){background:#085041;}
        .abp:disabled{opacity:.65;cursor:not-allowed;}
        .pt{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6D7A73;padding:2px;display:flex;align-items:center;}
        .tab{flex:1;padding:9px 0;background:none;border:none;font-size:14px;cursor:pointer;border-radius:8px;transition:background .15s,color .15s;font-weight:500;}
        .tab-a{background:white;color:#085041;box-shadow:0 1px 4px rgba(0,0,0,.08);}
        .tab-i{color:#6D7A73;}
      `}</style>

      <div style={{ background: '#FAFAF8', borderRadius: '20px', width: '100%', maxWidth: '420px', maxHeight: 'calc(100dvh - 96px)', display: 'flex', flexDirection: 'column', animation: 'authSlideUp 0.22s ease', boxShadow: '0 20px 60px rgba(8,28,20,.18), 0 4px 16px rgba(0,0,0,.08)', position: 'relative', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '28px 28px 0', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6D7A73' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <PineTree />
            <span style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#085041' }}>El Árbol</span>
          </div>

          {/* Tabs — শুধু login/signup mode-এ দেখাবে, forgot-এ না */}
          {!showForgot && (
            <div style={{ display: 'flex', background: '#ECF7E4', borderRadius: '10px', padding: '4px', marginBottom: '4px', gap: '2px' }}>
              <button className={`tab ${mode === 'login'  ? 'tab-a' : 'tab-i'}`} onClick={() => switchMode('login')}>Log In</button>
              <button className={`tab ${mode === 'signup' ? 'tab-a' : 'tab-i'}`} onClick={() => switchMode('signup')}>Sign Up</button>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px 28px', overflowY: 'auto' }}>

          {/* Forgot Password Flow */}
          {showForgot ? (
            <ForgotPasswordFlow
              onBack={() => setShowForgot(false)}
              onSuccess={() => { setShowForgot(false); switchMode('login') }}
            />
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: '"Playfair Display",Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#151E13', margin: '0 0 5px' }}>
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p style={{ fontSize: '13.5px', color: '#6D7A73', margin: 0 }}>
                  {mode === 'login' ? 'Sign in to continue to El Árbol' : 'Fresh produce delivered to your door'}
                </p>
              </div>

              {apiError && (
                <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13.5px', color: '#BA1A1A' }}>
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {mode === 'signup' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>First Name *</label>
                        <input className={`ai${errors.firstName ? ' ai-err' : ''}`} type="text" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleChange} />
                        {errors.firstName && <p style={{ fontSize: '12px', color: '#C84040', margin: '4px 0 0' }}>{errors.firstName}</p>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>Last Name</label>
                        <input className="ai" type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>Email Address *</label>
                    <input className={`ai${errors.email ? ' ai-err' : ''}`} type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} autoComplete="email" />
                    {errors.email && <p style={{ fontSize: '12px', color: '#C84040', margin: '4px 0 0' }}>{errors.email}</p>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#2D3A35' }}>Password *</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => setShowForgot(true)}
                          style={{ fontSize: '12.5px', color: '#00694C', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input className={`ai${errors.password ? ' ai-err' : ''}`}
                        type={showPass ? 'text' : 'password'} name="password"
                        placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                        value={formData.password} onChange={handleChange} style={{ paddingRight: '40px' }} />
                      <button type="button" className="pt" onClick={() => setShowPass(p => !p)}>
                        <EyeIcon show={showPass} />
                      </button>
                    </div>
                    {errors.password && <p style={{ fontSize: '12px', color: '#C84040', margin: '4px 0 0' }}>{errors.password}</p>}
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2D3A35', marginBottom: '6px' }}>Confirm Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input className={`ai${errors.confirmPassword ? ' ai-err' : ''}`}
                          type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                          placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} style={{ paddingRight: '40px' }} />
                        <button type="button" className="pt" onClick={() => setShowConfirm(p => !p)}>
                          <EyeIcon show={showConfirm} />
                        </button>
                      </div>
                      {errors.confirmPassword && <p style={{ fontSize: '12px', color: '#C84040', margin: '4px 0 0' }}>{errors.confirmPassword}</p>}
                    </div>
                  )}

                  {mode === 'signup' && (
                    <p style={{ fontSize: '12px', color: '#9DAAA3', lineHeight: 1.5 }}>
                      By signing up, you agree to our <span style={{ color: '#00694C', cursor: 'pointer' }}>Terms</span> and <span style={{ color: '#00694C', cursor: 'pointer' }}>Privacy Policy</span>.
                    </p>
                  )}

                  <button type="submit" className="abp" disabled={loading} style={{ marginTop: '4px' }}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                      </span>
                    ) : mode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                </div>
              </form>

              <p style={{ fontSize: '13px', color: '#6D7A73', textAlign: 'center', margin: '16px 0 0' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  style={{ color: '#00694C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontFamily: 'inherit' }}>
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}