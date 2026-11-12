'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Mail,
  Lock,
  User,
  UserCheck,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  X,
  Leaf,
  Truck,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

function BrandTreeEmblem() {
  return (
    <div className="w-11 h-11 rounded-full border-[1.75px] border-[#15543A] bg-white/85 flex items-center justify-center shrink-0 shadow-xs">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.2C8.8 3.2 6.4 5.4 6.2 8.2C4.7 8.8 3.8 10.2 4 11.9C4.2 13.8 5.9 15 7.9 15H16.1C18.1 15 19.8 13.8 20 11.9C20.2 10.2 19.3 8.8 17.8 8.2C17.6 5.4 15.2 3.2 12 3.2Z"
          fill="#15543A"
        />
        <path
          d="M12 12.5V20.5M12 15.2L9.4 13.2M12 16.4L14.6 14.3"
          stroke="#EFF5E8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect x="10.8" y="15" width="2.4" height="5.5" rx="0.8" fill="#15543A" />
      </svg>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        fill="#FFFFFF"
        d="M15.12 12.82l.46-2.98h-2.86V7.91c0-.82.4-1.61 1.68-1.61h1.3V3.76s-1.18-.2-2.31-.2c-2.36 0-3.9 1.43-3.9 4.02v2.26H6.88v2.98h2.61V20.5a10.9 10.9 0 003.23 0v-7.68h2.4z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#181717" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.64 3.01 8.58 7.18 9.97.52.1.71-.23.71-.5 0-.25-.01-1.08-.01-1.96-2.92.63-3.54-1.24-3.54-1.24-.48-1.21-1.17-1.53-1.17-1.53-.95-.65.07-.64.07-.64 1.05.07 1.61 1.08 1.61 1.08.94 1.61 2.46 1.14 3.06.87.09-.68.37-1.14.67-1.4-2.33-.27-4.78-1.17-4.78-5.19 0-1.15.41-2.08 1.08-2.82-.11-.27-.47-1.33.1-2.78 0 0 .88-.28 2.89 1.08a10.05 10.05 0 015.26 0c2.01-1.36 2.89-1.08 2.89-1.08.57 1.45.21 2.51.1 2.78.67.74 1.08 1.67 1.08 2.82 0 4.03-2.46 4.92-4.8 5.18.38.32.72.97.72 1.95 0 1.41-.01 2.54-.01 2.89 0 .28.19.61.72.5A10.5 10.5 0 0022.5 12c0-5.8-4.7-10.5-10.5-10.5z"
      />
    </svg>
  )
}

// ── Forgot Password Steps (Preserved 100%) ───────────────────────────────────

function ForgotPasswordFlow({ onBack, onSuccess }) {
  const [step, setStep] = useState('email') // email → otp → password → done
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
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
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP.')
      return
    }
    setStep('password')
    setError('')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
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
      if (err.message.includes('OTP')) setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setLoading(true)
    setError('')
    try {
      await fetch(`${API_BASE}/auth/password-reset/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendTimer(60)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-tab-reveal">
      {step !== 'done' && (
        <button
          type="button"
          onClick={
            step === 'email'
              ? onBack
              : () => {
                  setStep('email')
                  setError('')
                }
          }
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#546E61] hover:text-[#15543A] bg-transparent border-none p-0 mb-4 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{step === 'email' ? 'Back to login' : 'Change email'}</span>
        </button>
      )}

      {/* Step indicator */}
      {step !== 'done' && (
        <div className="flex gap-1.5 mb-5">
          {['email', 'otp', 'password'].map((s, i) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full transition-colors duration-300"
              style={{
                background:
                  ['email', 'otp', 'password'].indexOf(step) >= i
                    ? '#15543A'
                    : '#E2ECE0',
              }}
            />
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-[#FFF2F2] border border-[#F7CACA] rounded-xl px-3.5 py-2.5 mb-4 text-[13px] text-[#B82828]">
          {error}
        </div>
      )}

      {/* STEP 1: Email */}
      {step === 'email' && (
        <form onSubmit={handleSendOTP}>
          <h2
            className="text-[24px] font-bold text-[#143D2C] mb-1 leading-tight"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Forgot password?
          </h2>
          <p className="text-[13px] text-[#5B7266] mb-5 leading-relaxed">
            Enter your email and we&apos;ll send a 6-digit OTP to reset your password.
          </p>
          <div className="relative mb-4">
            <Mail className="w-4 h-4 text-[#4B6B5C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="auth-pill-input pl-11 pr-4"
              type="email"
              placeholder="Email Address *"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="auth-submit-btn">
            <span>{loading ? 'Sending…' : 'Send OTP'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}

      {/* STEP 2: OTP */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <h2
            className="text-[24px] font-bold text-[#143D2C] mb-1 leading-tight"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Check your email
          </h2>
          <p className="text-[13px] text-[#5B7266] mb-5 leading-relaxed">
            We sent a 6-digit code to <strong className="text-[#143D2C]">{email}</strong>. It expires in 10 minutes.
          </p>
          <input
            className="auth-pill-input text-center text-[20px] font-bold tracking-[0.35em] px-4 mb-4"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="──────"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''))
              setError('')
            }}
          />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="auth-submit-btn"
          >
            <span>Verify OTP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[12.5px] text-[#5B7266] text-center mt-4">
            Didn&apos;t receive it?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0}
              className="font-semibold bg-transparent border-none p-0 cursor-pointer"
              style={{ color: resendTimer > 0 ? '#9EB0A6' : '#15543A' }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </p>
        </form>
      )}

      {/* STEP 3: New Password */}
      {step === 'password' && (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div>
            <h2
              className="text-[24px] font-bold text-[#143D2C] mb-1 leading-tight"
              style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
              Set new password
            </h2>
            <p className="text-[13px] text-[#5B7266]">
              Choose a strong password for your account.
            </p>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#4B6B5C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="auth-pill-input pl-11 pr-11"
              type={showPass ? 'text' : 'password'}
              placeholder="New Password (Min. 8 chars)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#647D71] hover:text-[#15543A] bg-transparent border-none p-1 cursor-pointer flex items-center"
            >
              {showPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#4B6B5C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              className="auth-pill-input pl-11 pr-4"
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setError('')
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="auth-submit-btn">
            <span>{loading ? 'Resetting…' : 'Reset Password'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#E7F2E2] flex items-center justify-center mx-auto mb-4 text-[#15543A]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2
            className="text-[24px] font-bold text-[#143D2C] mb-2"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
          >
            Password reset!
          </h2>
          <p className="text-[13.5px] text-[#5B7266] mb-6 leading-relaxed">
            Your password has been updated. You can now log in with your new password.
          </p>
          <button type="button" onClick={onSuccess} className="auth-submit-btn">
            <span>Go to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main AuthModal ────────────────────────────────────────────────────────────

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }) {
  if (!isOpen) return null
  return <AuthModalContent key={defaultMode} onClose={onClose} defaultMode={defaultMode} />
}

function AuthModalContent({ onClose, defaultMode = 'login' }) {
  const { login, register } = useAuth()

  const [mode, setMode] = useState(defaultMode)
  const [showForgot, setShowForgot] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [socialNotice, setSocialNotice] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const overlayRef = useRef(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function switchMode(m) {
    setMode(m)
    setErrors({})
    setApiError('')
    setSocialNotice('')
    setShowForgot(false)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }))
    if (socialNotice) setSocialNotice('')
  }

  function validate() {
    const e = {}
    if (mode === 'signup' && !formData.firstName.trim()) {
      e.firstName = 'First name is required'
    }
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email'
    if (!formData.password) e.password = 'Password is required'
    else if (mode === 'signup' && formData.password.length < 8) {
      e.password = 'Min. 8 characters'
    }
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setApiError('')
    setSocialNotice('')
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        })
      }
      onClose()
    } catch (err) {
      setApiError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleSocialClick(provider) {
    setSocialNotice(
      `${provider} sign-in is not enabled yet. Please continue with your email and password.`
    )
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#072217]/45 backdrop-blur-[6px]"
      style={{ animation: 'authBackdropIn 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
    >
      <style>{`
        @keyframes authBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes authModalSpring {
          0% {
            opacity: 0;
            transform: scale(0.93) translateY(14px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes authTabReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .auth-tab-reveal {
          animation: authTabReveal 190ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .auth-pill-input {
          width: 100%;
          height: 44px;
          border: 1.35px solid #D3DDD1;
          border-radius: 9999px;
          background: #FCFDF9;
          color: #133527;
          font-size: 13.5px;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
          box-sizing: border-box;
        }
        .auth-pill-input:focus {
          border-color: #15543A;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(21, 84, 58, 0.12);
        }
        .auth-pill-input::placeholder {
          color: #6B8275;
        }
        .auth-pill-input-err {
          border-color: #C94242 !important;
          background: #FFF9F9 !important;
        }
        .auth-submit-btn {
          width: 100%;
          height: 46px;
          border-radius: 9999px;
          background: #15543A;
          color: #FFFFFF;
          border: none;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 6px 18px -4px rgba(21, 84, 58, 0.38);
          transition: background-color 160ms ease, transform 130ms ease, box-shadow 160ms ease;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #0E422C;
          box-shadow: 0 8px 22px -4px rgba(14, 66, 44, 0.45);
        }
        .auth-submit-btn:active:not(:disabled) {
          transform: scale(0.985);
        }
        .auth-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      {/* Main Two-Column Card */}
      <div
        className="relative w-full max-w-[820px] rounded-[24px] bg-[#FDFCF8] border border-[#E3EADA] overflow-hidden shadow-[0_28px_80px_-14px_rgba(7,34,23,0.42),0_10px_28px_-8px_rgba(7,34,23,0.16)] grid grid-cols-1 md:grid-cols-[44%_56%] max-h-[calc(100dvh-24px)]"
        style={{
          animation: 'authModalSpring 230ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          willChange: 'transform, opacity',
        }}
      >
        {/* ── Left Botanical Welcome Panel (Desktop/Tablet) ── */}
        <div
          className="hidden md:flex flex-col justify-between relative overflow-hidden px-6 pt-7 pb-5 select-none"
          style={{
            background:
              'linear-gradient(180deg, #F6FAF0 0%, #EEF5E6 60%, #E5EFE0 100%)',
          }}
        >
          {/* Subtle decorative botanical leaves on left edge */}
          <svg
            viewBox="0 0 180 340"
            className="pointer-events-none absolute left-0 top-12 w-32 h-72 opacity-[0.22]"
            aria-hidden="true"
          >
            <path
              d="M12 290 C28 210 38 140 24 45 M24 95 C48 80 65 65 74 42 C50 48 34 66 24 95 Z M27 148 C58 134 80 112 92 84 C64 94 42 118 27 148 Z M23 200 C54 188 76 168 88 142 C60 152 38 174 23 200 Z"
              fill="#729B79"
              stroke="#5A8362"
              strokeWidth="1.5"
            />
          </svg>

          {/* Brand Header */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2.5">
              <BrandTreeEmblem />
              <div className="text-left">
                <p
                  className="text-[22px] font-bold text-[#0F4934] leading-none"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  El Árbol
                </p>
                <p
                  className="text-[11px] italic text-[#2B5A46] leading-tight mt-0.5"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  Fresh. Local. Together.
                </p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="mt-7 text-center">
              <h2
                className="text-[31px] font-bold text-[#0E4A35] leading-[1.12] tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {showForgot
                  ? 'Reset Password'
                  : mode === 'login'
                  ? 'Welcome Back!'
                  : 'Join El Árbol!'}
              </h2>
              <p className="mt-2 text-[13px] text-[#355446] leading-[1.45] max-w-[230px] mx-auto">
                {showForgot
                  ? 'Quickly recover access to your fresh produce account'
                  : mode === 'login'
                  ? 'Sign in to continue your fresh shopping journey'
                  : 'Create an account for fresh produce delivered to your door'}
              </p>
            </div>
          </div>

          {/* Center-Bottom Produce Basket + Floating Trust Pill Bar */}
          <div className="relative z-10 mt-3 flex flex-col items-center">
            <div className="relative w-full h-[185px] flex items-end justify-center overflow-hidden">
              <Image
                src="/wholesale/hero-basket.webp"
                alt="Fresh produce basket"
                width={320}
                height={200}
                priority
                unoptimized
                className="w-[290px] h-auto object-contain mix-blend-multiply drop-shadow-[0_12px_20px_rgba(14,74,53,0.12)] translate-y-2"
              />
            </div>

            {/* Frosted 3-item Trust Strip */}
            <div className="relative z-20 -mt-5 w-full bg-white/90 backdrop-blur-sm border border-[#DAE5D4] rounded-[16px] px-2.5 py-2.5 shadow-[0_6px_18px_rgba(14,74,53,0.08)] grid grid-cols-3 divide-x divide-[#DCE6D6]">
              <div className="flex flex-col items-center text-center px-1">
                <Leaf className="w-4 h-4 text-[#15543A] mb-1" strokeWidth={2} />
                <span className="text-[10.5px] font-semibold text-[#174231] leading-[1.2]">
                  Fresh
                  <br />
                  Products
                </span>
              </div>
              <div className="flex flex-col items-center text-center px-1">
                <Truck className="w-4 h-4 text-[#15543A] mb-1" strokeWidth={2} />
                <span className="text-[10.5px] font-semibold text-[#174231] leading-[1.2]">
                  Fast
                  <br />
                  Delivery
                </span>
              </div>
              <div className="flex flex-col items-center text-center px-1">
                <ShieldCheck className="w-4 h-4 text-[#15543A] mb-1" strokeWidth={2} />
                <span className="text-[10.5px] font-semibold text-[#174231] leading-[1.2]">
                  Secure
                  <br />
                  Payment
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Auth Form Panel ── */}
        <div className="relative bg-[#FDFCF8] px-6 sm:px-8 pt-6 pb-7 overflow-y-auto flex flex-col justify-center">
          {/* Top-right Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EDF3E8] hover:bg-[#DFEBDC] text-[#28493A] flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:scale-105"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>

          {/* Compact Mobile Header (shown only below md) */}
          <div className="flex md:hidden items-center gap-2.5 mb-4 pr-8">
            <BrandTreeEmblem />
            <div>
              <p
                className="text-[18px] font-bold text-[#0F4934] leading-none"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                El Árbol
              </p>
              <p
                className="text-[10.5px] italic text-[#2B5A46] leading-tight mt-0.5"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                Fresh. Local. Together.
              </p>
            </div>
          </div>

          {/* Pill Tab Switcher (Log In | Sign Up) */}
          {!showForgot && (
            <div className="flex items-center bg-[#F6F8F0] border border-[#E1E8D7] rounded-full p-1 mb-5 max-w-[300px] mx-auto w-full">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-[#15543A] text-white shadow-sm'
                    : 'bg-transparent text-[#244435] hover:text-[#0E4A35]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Log In</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-[#15543A] text-white shadow-sm'
                    : 'bg-transparent text-[#244435] hover:text-[#0E4A35]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          {showForgot ? (
            <ForgotPasswordFlow
              onBack={() => setShowForgot(false)}
              onSuccess={() => {
                setShowForgot(false)
                switchMode('login')
              }}
            />
          ) : (
            <div key={mode} className="auth-tab-reveal">
              <div className="mb-4">
                <h2
                  className="text-[26px] font-bold text-[#143D2C] leading-tight"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-[12.5px] text-[#5B7266] mt-0.5">
                  {mode === 'login'
                    ? 'Welcome back! Please enter your details'
                    : 'Fresh produce delivered to your door'}
                </p>
              </div>

              {apiError && (
                <div className="bg-[#FFF2F2] border border-[#F7CACA] rounded-xl px-3.5 py-2.5 mb-3.5 text-[12.5px] text-[#B82828]">
                  {apiError}
                </div>
              )}

              {socialNotice && (
                <div className="bg-[#F2F7EE] border border-[#CFE0C8] rounded-xl px-3.5 py-2.5 mb-3.5 text-[12.5px] text-[#22503B]">
                  {socialNotice}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-3">
                  {/* Sign Up: First Name + Last Name */}
                  {mode === 'signup' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#4C6B5C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            className={`auth-pill-input pl-10 pr-3.5${
                              errors.firstName ? ' auth-pill-input-err' : ''
                            }`}
                            type="text"
                            name="firstName"
                            placeholder="First Name *"
                            value={formData.firstName}
                            onChange={handleChange}
                          />
                        </div>
                        {errors.firstName && (
                          <p className="text-[11.5px] text-[#C94242] mt-1 pl-3">
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#4C6B5C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            className="auth-pill-input pl-10 pr-3.5"
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Address * */}
                  <div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#4C6B5C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        className={`auth-pill-input pl-11 pr-4${
                          errors.email ? ' auth-pill-input-err' : ''
                        }`}
                        type="email"
                        name="email"
                        placeholder="Email Address *"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11.5px] text-[#C94242] mt-1 pl-3">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password * */}
                  <div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#4C6B5C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        className={`auth-pill-input pl-11 pr-11${
                          errors.password ? ' auth-pill-input-err' : ''
                        }`}
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder={
                          mode === 'signup'
                            ? 'Password * (Min. 8 chars)'
                            : 'Password *'
                        }
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#647D71] hover:text-[#15543A] bg-transparent border-none p-1 cursor-pointer flex items-center"
                      >
                        {showPass ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11.5px] text-[#C94242] mt-1 pl-3">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password * (Sign Up only) */}
                  {mode === 'signup' && (
                    <div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#4C6B5C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          className={`auth-pill-input pl-11 pr-11${
                            errors.confirmPassword ? ' auth-pill-input-err' : ''
                          }`}
                          type={showConfirm ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Confirm Password *"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          aria-label={
                            showConfirm ? 'Hide password' : 'Show password'
                          }
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#647D71] hover:text-[#15543A] bg-transparent border-none p-1 cursor-pointer flex items-center"
                        >
                          {showConfirm ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-[11.5px] text-[#C94242] mt-1 pl-3">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Forgot password link (Login) or Terms (Sign Up) */}
                  {mode === 'login' ? (
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[12px] font-semibold text-[#15543A] hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11.5px] text-[#6E8378] leading-snug pl-1">
                      By signing up, you agree to our{' '}
                      <span className="text-[#15543A] font-medium">Terms</span> and{' '}
                      <span className="text-[#15543A] font-medium">
                        Privacy Policy
                      </span>
                      .
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="auth-submit-btn mt-0.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="white"
                            strokeWidth="3"
                            strokeOpacity=".3"
                          />
                          <path
                            d="M12 2a10 10 0 0 1 10 10"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>
                          {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {mode === 'login' ? 'Log In' : 'Create Account'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Social Divider + Buttons */}
              <div className="mt-4">
                <p className="text-center text-[11.5px] text-[#6A7F74] mb-2.5">
                  or continue with
                </p>

                <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                  <button
                    type="button"
                    onClick={() => handleSocialClick('Google')}
                    aria-label="Continue with Google"
                    className="h-9 rounded-full bg-[#FCFDF9] hover:bg-[#F3F7EE] border border-[#DCE5D9] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[#B6CBB5]"
                  >
                    <GoogleIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialClick('Facebook')}
                    aria-label="Continue with Facebook"
                    className="h-9 rounded-full bg-[#FCFDF9] hover:bg-[#F3F7EE] border border-[#DCE5D9] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[#B6CBB5]"
                  >
                    <FacebookIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialClick('GitHub')}
                    aria-label="Continue with GitHub"
                    className="h-9 rounded-full bg-[#FCFDF9] hover:bg-[#F3F7EE] border border-[#DCE5D9] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[#B6CBB5]"
                  >
                    <GitHubIcon />
                  </button>
                </div>
              </div>

              {/* Bottom Toggle Link */}
              <p className="text-[12.5px] text-[#5B7266] text-center mt-4 mb-0">
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() =>
                    switchMode(mode === 'login' ? 'signup' : 'login')
                  }
                  className="text-[#15543A] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer text-[12.5px]"
                >
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
