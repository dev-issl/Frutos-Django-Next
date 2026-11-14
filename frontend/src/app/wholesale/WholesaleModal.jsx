'use client'
// src/app/wholesale/WholesaleModal.jsx
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { signIn, signOut } from 'next-auth/react'
import { useSafeSession } from '@/lib/useSafeSession'
import { wholesaleRegister, wholesaleLogin } from '@/lib/api'
import { getStores } from '@/lib/stores-api'
import { useAuth } from '@/app/context/AuthContext'
import {
  Building2,
  User,
  Mail,
  CreditCard,
  Phone,
  MapPin,
  Briefcase,
  Send,
  FileText,
  LogIn,
  Info,
  X,
  Check,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

// ── HELPER SPINNER ICON ──
function SpinnerIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="animate-spin inline-block"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

// ── BUSINESS TYPES ──
const BUSINESS_TYPES = [
  'Restaurant / Bistro',
  'Hotel / Resort',
  'Catering Company',
  'Food Retail / Grocery',
  'Dark Kitchen',
  'Café / Bakery',
  'Other',
]

const BUSINESS_TYPE_VALUES = {
  'Restaurant / Bistro': 'restaurant',
  'Hotel / Resort': 'hotel',
  'Catering Company': 'catering',
  'Food Retail / Grocery': 'food_retail',
  'Dark Kitchen': 'dark_kitchen',
  'Café / Bakery': 'cafe',
  'Other': 'other',
}

const EMPTY_APPLY = {
  businessName: '',
  contactName: '',
  cif: '',
  tradeLicense: '',
  email: '',
  phone: '',
  businessType: '',
  volume: '400_1000',
  postcode: '',
  password: '',
  accountType: 'RESTAURANT',
  store: '',
}

const WS_API = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api') + '/wholesale'

// ── CUSTOM SELECT DROPDOWN (Matching reference select style) ──
function SelectBusinessType({ value, onChange, hasError }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative z-30">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(p => !p)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(p => !p)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className={`w-full h-[42px] sm:h-[44px] px-3.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 select-none ${
          hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
              ? 'border-[#0B4828] ring-2 ring-[#0B4828]/15 shadow-xs'
              : 'border-[#D4DFD8] hover:border-[#B7C7BB] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
        }`}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Briefcase className="w-4 h-4 text-[#7A8C81] flex-shrink-0" />
          <span
            className={`text-[13px] sm:text-[13.5px] truncate ${
              value ? 'text-[#14261C] font-medium' : 'text-[#9BAAA0]'
            }`}
          >
            {value || 'Select business type'}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#7A8C81] transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#0B4828]' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-[#D4DFD8] rounded-xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
          {BUSINESS_TYPES.map(opt => {
            const isSelected = opt === value
            return (
              <div
                key={opt}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onChange({ target: { name: 'businessType', value: opt } })
                  setIsOpen(false)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange({ target: { name: 'businessType', value: opt } })
                    setIsOpen(false)
                  }
                }}
                className={`px-3.5 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#EAF3E4] text-[#0B4828] font-semibold'
                    : 'text-[#1F3327] hover:bg-[#F2F7EF]'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <span>{opt}</span>
                {isSelected && <Check className="w-4 h-4 text-[#0B4828]" strokeWidth={2.5} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── FORGOT PASSWORD FLOW ──
function WholesaleForgotPasswordFlow({ onBack, onSuccess }) {
  const [step, setStep] = useState('email')
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
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid business email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${WS_API}/auth/password-reset/send-otp/`, {
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
      setError('Enter the 6-digit OTP code.')
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
      const res = await fetch(`${WS_API}/auth/password-reset/verify/`, {
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
    try {
      await fetch(`${WS_API}/auth/password-reset/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendTimer(60)
    } catch {}
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-2">
      {step !== 'done' && (
        <button
          type="button"
          onClick={step === 'email' ? onBack : () => { setStep('email'); setError('') }}
          className="flex items-center gap-1.5 text-xs text-[#526F5E] hover:text-[#0B4828] mb-4 font-medium transition-colors cursor-pointer"
          style={{ cursor: 'pointer' }}
        >
          <ChevronDown className="w-3.5 h-3.5 rotate-90" />
          {step === 'email' ? 'Back to login' : 'Change email'}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <h3
              className="font-serif text-[22px] font-bold text-[#143223]"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              Reset Password
            </h3>
            <p className="text-xs sm:text-[13px] text-[#556F60] mt-0.5">
              Enter your wholesale registered email to receive an OTP.
            </p>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#183526] mb-1.5">
              Business Email
            </label>
            <div className="flex items-center w-full bg-white border border-[#D5DFD8] rounded-xl px-3.5 h-[42px] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15">
              <Mail className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
              <input
                type="email"
                placeholder="order@yourbusiness.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="w-full bg-transparent border-0 outline-none text-[13.5px] text-[#14261C]"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B4828] hover:bg-[#07361D] text-white py-3 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            {loading ? <><SpinnerIcon /> Sending OTP…</> : 'Send Reset Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <h3
              className="font-serif text-[22px] font-bold text-[#143223]"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              Enter Verification Code
            </h3>
            <p className="text-xs sm:text-[13px] text-[#556F60] mt-0.5">
              We sent a 6-digit code to <strong className="text-[#143223]">{email}</strong>.
            </p>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#183526] mb-1.5">
              6-Digit OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="------"
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
              className="w-full text-center tracking-[0.4em] font-mono text-[20px] font-bold bg-white border border-[#D5DFD8] rounded-xl h-[46px] outline-none focus:border-[#0B4828] focus:ring-2 focus:ring-[#0B4828]/15"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={otp.length !== 6}
            className="w-full bg-[#0B4828] hover:bg-[#07361D] text-white py-3 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            Verify OTP
          </button>
          <p className="text-xs text-center text-[#556F60]">
            Didn&apos;t receive it?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0}
              className="text-[#0B4828] font-semibold underline disabled:opacity-60 disabled:no-underline cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
            </button>
          </p>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <h3
              className="font-serif text-[22px] font-bold text-[#143223]"
              style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
            >
              New Password
            </h3>
            <p className="text-xs sm:text-[13px] text-[#556F60] mt-0.5">
              Choose a strong password with at least 8 characters.
            </p>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#183526] mb-1.5">
              New Password
            </label>
            <div className="flex items-center w-full bg-white border border-[#D5DFD8] rounded-xl px-3.5 h-[42px] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15">
              <Lock className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                className="w-full bg-transparent border-0 outline-none text-[13.5px] text-[#14261C]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="text-[#7A8C81] hover:text-[#14261C] p-1 cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#183526] mb-1.5">
              Confirm Password
            </label>
            <div className="flex items-center w-full bg-white border border-[#D5DFD8] rounded-xl px-3.5 h-[42px] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15">
              <Lock className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                className="w-full bg-transparent border-0 outline-none text-[13.5px] text-[#14261C]"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B4828] hover:bg-[#07361D] text-white py-3 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            {loading ? <><SpinnerIcon /> Updating…</> : 'Reset Password'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-[#EAF3E4] text-[#0B4828] flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3
            className="font-serif text-[22px] font-bold text-[#143223]"
            style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
          >
            Password Reset Complete
          </h3>
          <p className="text-xs sm:text-[13px] text-[#556F60] mt-1 mb-5">
            Your wholesale password has been updated successfully.
          </p>
          <button
            type="button"
            onClick={onSuccess}
            className="w-full bg-[#0B4828] hover:bg-[#07361D] text-white py-3 rounded-full font-semibold text-[14px] cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  )
}

// ── MAIN WHOLESALE MODAL COMPONENT ──
export default function WholesaleModal({ isOpen, onClose }) {
  const { data: session } = useSafeSession()
  const { user: normalUser, logout: normalLogout } = useAuth()
  const [step, setStep] = useState(1) // 1 = Apply, 2 = Login, 3 = Success
  const [loginMode, setLoginMode] = useState('wholesale_id') // 'wholesale_id' | 'email'
  const [showPass, setShowPass] = useState(false)
  const [showOptionalPassword, setShowOptionalPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [applyData, setApplyData] = useState(EMPTY_APPLY)
  const [loginData, setLoginData] = useState({ email: '', password: '', wholesaleId: '' })
  const [, setStores] = useState([])
  const [showForgot, setShowForgot] = useState(false)
  const overlayRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    getStores()
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setStores(data)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  // Reset modal state on open
  const [prevOpen, setPrevOpen] = useState(isOpen)
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setStep(1)
      setLoginMode('wholesale_id')
      setShowForgot(false)
      setShowOptionalPassword(false)
      setErrors({})
      setServerError('')
      setApplyData(EMPTY_APPLY)
      setLoginData({ email: '', password: '', wholesaleId: '' })
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const fn = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const handleOverlay = e => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleApplyChange = e => {
    const { name, value } = e.target
    setApplyData(p => ({
      ...p,
      [name]: value,
      ...(name === 'cif' ? { tradeLicense: value } : {}),
      ...(name === 'tradeLicense' ? { cif: value } : {}),
    }))
    if (errors[name] || (name === 'cif' && errors.tradeLicense)) {
      setErrors(p => ({ ...p, [name]: '', tradeLicense: '', cif: '' }))
    }
    setServerError('')
  }

  const validateApply = () => {
    const e = {}
    const cif = (applyData.cif || applyData.tradeLicense || '').trim()
    const phone = (applyData.phone || '').trim()
    const phonePattern = /^\+?[\d\s\-()]{7,25}$/
    const cifPattern = /^[A-Za-z0-9\-\/\s]{4,100}$/

    if (!applyData.businessName?.trim()) e.businessName = 'Business name is required'
    if (!applyData.contactName?.trim()) e.contactName = 'Contact name is required'
    if (!cif) e.cif = 'CIF is required'
    else if (!cifPattern.test(cif)) e.cif = 'Enter a valid CIF (e.g. B12345678)'

    if (!applyData.email?.trim() || !/\S+@\S+\.\S+/.test(applyData.email)) {
      e.email = 'Valid business email is required'
    }
    if (!phone) e.phone = 'Phone number is required'
    else if (!phonePattern.test(phone)) e.phone = 'Enter a valid phone number'

    if (!applyData.businessType) e.businessType = 'Please select a business type'

    // If custom password was typed, ensure minimum 8 characters
    if (applyData.password && applyData.password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    }
    return e
  }

  const handleApplySubmit = async e => {
    e.preventDefault()
    const errs = validateApply()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setServerError('')
    try {
      const cifValue = (applyData.cif || applyData.tradeLicense || '').trim().toUpperCase()

      // Generate secure default password if user didn't enter custom one
      const finalPassword =
        applyData.password?.trim() ||
        `ElArbol#${Math.random().toString(36).slice(-6)}WHL2026!`

      const payload = {
        email: applyData.email.toLowerCase().trim(),
        password: finalPassword,
        business_name: applyData.businessName.trim(),
        contact_name: applyData.contactName.trim(),
        cif: cifValue,
        trade_license_number: cifValue,
        phone: applyData.phone.trim(),
        postcode: applyData.postcode.trim(),
        business_type: BUSINESS_TYPE_VALUES[applyData.businessType] || 'other',
        monthly_volume: applyData.volume || '400_1000',
        user_type: applyData.accountType || 'RESTAURANT',
      }
      if (applyData.store) {
        payload.store = applyData.store
      }

      await wholesaleRegister(payload)

      // Clear any normal user session before wholesale auto login
      if (normalUser) {
        await normalLogout()
      }
      if (session?.user) {
        await signOut({ redirect: false })
      }

      // Auto sign-in via NextAuth wholesale provider
      await signIn('wholesale', {
        email: payload.email,
        password: finalPassword,
        redirect: false,
      })

      setStep(3)
    } catch (err) {
      const fieldMap = {
        business_name: 'businessName',
        contact_name: 'contactName',
        cif: 'cif',
        trade_license_number: 'cif',
        phone: 'phone',
        postcode: 'postcode',
        business_type: 'businessType',
        monthly_volume: 'volume',
        email: 'email',
        password: 'password',
      }
      const backendErrors = {}
      let message = ''

      const mapErrorValue = value => {
        if (Array.isArray(value)) return value[0]
        if (typeof value === 'object' && value !== null) return JSON.stringify(value)
        return String(value)
      }

      if (err && typeof err === 'object') {
        for (const [key, value] of Object.entries(err)) {
          const target = fieldMap[key] || key
          const text = mapErrorValue(value)
          if (target in applyData || target === 'businessType') {
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
        const msg =
          message ||
          err?.non_field_errors?.[0] ||
          err?.detail ||
          err?.message ||
          'Something went wrong. Please check your information and try again.'
        setServerError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async e => {
    e.preventDefault()
    const errs = {}

    if (loginMode === 'wholesale_id') {
      const wid = (loginData.wholesaleId || '').trim()
      if (!wid) {
        setErrors({ wholesaleId: 'Wholesale ID is required' })
        return
      }
    } else {
      if (!loginData.email?.trim()) errs.email = 'Business email is required'
      if (!loginData.password) errs.password = 'Password is required'
      if (Object.keys(errs).length) {
        setErrors(errs)
        return
      }
    }

    setLoading(true)
    setServerError('')
    try {
      if (normalUser) {
        await normalLogout()
      }
      if (session?.user) {
        await signOut({ redirect: false })
      }

      const identifier =
        loginMode === 'wholesale_id'
          ? loginData.wholesaleId.trim()
          : loginData.email.trim()

      const payload = {
        login_type: loginMode === 'wholesale_id' ? 'wholesale_id' : 'email',
      }
      if (loginMode === 'wholesale_id') {
        payload.wholesale_id = identifier
      } else {
        payload.email = identifier
        payload.password = loginData.password
      }

      try {
        await wholesaleLogin(payload)
      } catch (err) {
        const errorMsg =
          err?.non_field_errors?.[0] ||
          err?.detail ||
          err?.error ||
          err?.message ||
          (loginMode === 'wholesale_id'
            ? 'Wholesale ID not found or account deactivated. Please try again.'
            : 'Invalid email or password. Please try again.')
        setServerError(errorMsg)
        return
      }

      const credentials =
        loginMode === 'wholesale_id'
          ? { wholesaleId: identifier, loginType: 'wholesale_id' }
          : { email: identifier, password: loginData.password, loginType: 'email' }

      const result = await signIn('wholesale', {
        ...credentials,
        redirect: false,
      })

      if (result?.error) {
        setServerError(
          loginMode === 'wholesale_id'
            ? 'Wholesale ID not found or account deactivated. Please try again.'
            : 'Invalid email or password. Please try again.'
        )
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

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
    >
      <style>{`
        .ws-modal-card button,
        .ws-modal-card [role="button"],
        .ws-modal-card select,
        .ws-modal-card a,
        .ws-modal-card .cursor-pointer {
          cursor: pointer !important;
        }
      `}</style>

      {/* ── MAIN MODAL CARD (EXACT 100% VISUAL & EFFECT MATCH) ── */}
      <div
        className="ws-modal-card relative w-full max-w-[580px] bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_28px_70px_-15px_rgba(10,35,20,0.25)] border border-[#DCE6DE]/80 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200 select-text"
      >
        {/* Close Button (with explicit cursor-pointer) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:text-black hover:bg-[#EEF4EC] transition-colors cursor-pointer"
          style={{ cursor: 'pointer' }}
          aria-label="Close wholesale modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.4} />
        </button>

        {/* Modal Inner Container */}
        <div className="relative z-10 px-6 sm:px-9 pt-7 sm:pt-8 pb-7 sm:pb-8 flex flex-col">
          {/* ── HEADER ── */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full border border-[#D4E2D8] bg-white flex items-center justify-center p-1 shadow-xs flex-shrink-0">
              <Image
                src="/el-erbol-logo.png"
                alt="El Árbol"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <div>
                <h1
                  className="font-serif text-[19px] sm:text-[21px] font-bold text-[#113824] leading-tight tracking-[-0.01em]"
                  style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
                >
                  El Árbol
                </h1>
                <p
                  className="font-serif italic text-[11px] sm:text-[11.5px] text-[#557364] leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
                >
                  Fresh. Local. Together.
                </p>
              </div>
              <span className="bg-[#0B4828] text-white text-[10px] sm:text-[10.5px] font-bold tracking-[0.14em] uppercase px-3 py-1 rounded-full shadow-xs self-center">
                WHOLESALE
              </span>
            </div>
          </div>

          {/* ── SEGMENTED TAB SWITCHER (with explicit cursor-pointer) ── */}
          {step !== 3 && (
            <div className="mt-5 mb-5 p-1 bg-[#EEF4EC] rounded-full inline-flex sm:flex max-w-sm sm:max-w-md w-full gap-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setShowForgot(false)
                  setErrors({})
                  setServerError('')
                }}
                className={`flex-1 py-2 sm:py-2.5 px-4 rounded-full text-[13px] sm:text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${
                  step === 1 && !showForgot
                    ? 'bg-[#0B4828] text-white shadow-xs'
                    : 'bg-transparent text-[#284435] hover:text-[#0B4828]'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <FileText
                  className={`w-4 h-4 ${step === 1 && !showForgot ? 'text-white' : 'text-[#284435]'}`}
                  strokeWidth={2.2}
                />
                <span>Apply for Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(2)
                  setShowForgot(false)
                  setErrors({})
                  setServerError('')
                }}
                className={`flex-1 py-2 sm:py-2.5 px-4 rounded-full text-[13px] sm:text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${
                  step === 2 || showForgot
                    ? 'bg-[#0B4828] text-white shadow-xs'
                    : 'bg-transparent text-[#284435] hover:text-[#0B4828]'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <LogIn
                  className={`w-4 h-4 ${step === 2 || showForgot ? 'text-white' : 'text-[#284435]'}`}
                  strokeWidth={2.2}
                />
                <span>Log In</span>
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              STEP 1: APPLY FOR WHOLESALE ACCOUNT
              ═══════════════════════════════════════════ */}
          {step === 1 && (
            <div>
              {/* Title & Subtitle */}
              <div className="mb-4">
                <h2
                  className="font-serif text-[23px] sm:text-[25px] font-bold text-[#143223] tracking-tight"
                  style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
                >
                  Open a wholesale account
                </h2>
                <p className="text-[13px] sm:text-[13.5px] text-[#556F60] mt-1 leading-snug">
                  Grow your business with El Árbol — get exclusive wholesale benefits.
                </p>
              </div>

              {/* Alert notice box */}
              <div className="bg-[#EAF3E4] border border-[#D5E5CD] rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 mb-5">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B4828] flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                <p className="text-[12px] sm:text-[12.5px] text-[#224030] leading-relaxed">
                  Wholesale account is separate from the retail store. A dedicated account manager will contact you within 24 hours.
                </p>
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">
                  {serverError}
                </div>
              )}

              {/* Application Form */}
              <form onSubmit={handleApplySubmit} noValidate className="space-y-3.5 sm:space-y-4">
                {/* Row 1: Business Name * | Contact Name * */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      Business Name <span className="text-[#183526]">*</span>
                    </label>
                    <div
                      className={`flex items-center w-full bg-white border rounded-xl px-3 sm:px-3.5 h-[42px] sm:h-[44px] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        errors.businessName
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        name="businessName"
                        placeholder="Restaurant Sol"
                        value={applyData.businessName}
                        onChange={handleApplyChange}
                        className="w-full bg-transparent border-0 outline-none text-[13px] sm:text-[13.5px] text-[#14261C] placeholder-[#9BAAA0]"
                        required
                      />
                    </div>
                    {errors.businessName && (
                      <p className="text-[11.5px] text-red-600 mt-1">{errors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      Contact Name <span className="text-[#183526]">*</span>
                    </label>
                    <div
                      className={`flex items-center w-full bg-white border rounded-xl px-3 sm:px-3.5 h-[42px] sm:h-[44px] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        errors.contactName
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                      }`}
                    >
                      <User className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        name="contactName"
                        placeholder="Maria Garcia"
                        value={applyData.contactName}
                        onChange={handleApplyChange}
                        className="w-full bg-transparent border-0 outline-none text-[13px] sm:text-[13.5px] text-[#14261C] placeholder-[#9BAAA0]"
                        required
                      />
                    </div>
                    {errors.contactName && (
                      <p className="text-[11.5px] text-red-600 mt-1">{errors.contactName}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Business Email * | CIF * */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      Business Email <span className="text-[#183526]">*</span>
                    </label>
                    <div
                      className={`flex items-center w-full bg-white border rounded-xl px-3 sm:px-3.5 h-[42px] sm:h-[44px] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        errors.email
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="email"
                        name="email"
                        placeholder="order@yourbusiness.com"
                        value={applyData.email}
                        onChange={handleApplyChange}
                        className="w-full bg-transparent border-0 outline-none text-[13px] sm:text-[13.5px] text-[#14261C] placeholder-[#9BAAA0]"
                        autoComplete="email"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11.5px] text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      CIF <span className="text-[#183526]">*</span>
                    </label>
                    <div
                      className={`flex items-center w-full bg-white border rounded-xl px-3 sm:px-3.5 h-[42px] sm:h-[44px] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        errors.cif
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        name="cif"
                        placeholder="e.g. B12345678"
                        value={applyData.cif ?? applyData.tradeLicense ?? ''}
                        onChange={handleApplyChange}
                        className="w-full bg-transparent border-0 outline-none text-[13px] sm:text-[13.5px] text-[#14261C] placeholder-[#9BAAA0] uppercase"
                        required
                      />
                    </div>
                    {errors.cif && (
                      <p className="text-[11.5px] text-red-600 mt-1">{errors.cif}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Phone * | Delivery Postcode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      Phone <span className="text-[#183526]">*</span>
                    </label>
                    <div
                      className={`flex items-center w-full bg-white border rounded-xl px-3 sm:px-3.5 h-[42px] sm:h-[44px] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        errors.phone
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                      }`}
                    >
                      <Phone className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+34 600 000 000"
                        value={applyData.phone}
                        onChange={handleApplyChange}
                        className="w-full bg-transparent border-0 outline-none text-[13px] sm:text-[13.5px] text-[#14261C] placeholder-[#9BAAA0]"
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[11.5px] text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      Delivery Postcode
                    </label>
                    <div className="flex items-center w-full bg-white border border-[#D4DFD8] rounded-xl px-3 sm:px-3.5 h-[42px] sm:h-[44px] transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15">
                      <MapPin className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        name="postcode"
                        placeholder="28001"
                        value={applyData.postcode}
                        onChange={handleApplyChange}
                        className="w-full bg-transparent border-0 outline-none text-[13px] sm:text-[13.5px] text-[#14261C] placeholder-[#9BAAA0]"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Business Type * */}
                <div>
                  <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                    Business Type <span className="text-[#183526]">*</span>
                  </label>
                  <SelectBusinessType
                    value={applyData.businessType}
                    onChange={handleApplyChange}
                    hasError={!!errors.businessType}
                  />
                  {errors.businessType && (
                    <p className="text-[11.5px] text-red-600 mt-1">{errors.businessType}</p>
                  )}
                </div>

                {/* Optional Custom Password Toggle (with explicit cursor-pointer) */}
                <div className="pt-0.5">
                  {!showOptionalPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowOptionalPassword(true)}
                      className="text-[11.5px] text-[#526F5E] hover:text-[#0B4828] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      style={{ cursor: 'pointer' }}
                    >
                      <Sparkles className="w-3 h-3 text-[#7A8C81]" />
                      <span>Set custom password (optional)</span>
                    </button>
                  ) : (
                    <div className="bg-[#FAFCF9] border border-[#E0EAE2] rounded-xl p-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-semibold text-[#183526]">
                          Custom Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowOptionalPassword(false)
                            setApplyData(p => ({ ...p, password: '' }))
                          }}
                          className="text-[11px] text-gray-500 hover:text-gray-700 cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-center w-full bg-white border border-[#D4DFD8] rounded-xl px-3 h-[40px] focus-within:border-[#0B4828]">
                        <Lock className="w-4 h-4 text-[#7A8C81] mr-2 flex-shrink-0" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          name="password"
                          placeholder="Min. 8 characters"
                          value={applyData.password}
                          onChange={handleApplyChange}
                          className="w-full bg-transparent border-0 outline-none text-[13px] text-[#14261C] placeholder-[#9BAAA0]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(p => !p)}
                          className="text-[#7A8C81] hover:text-[#14261C] p-1 cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Application Button (with explicit cursor-pointer) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0B4828] hover:bg-[#07361D] active:scale-[0.99] text-white py-3.5 sm:py-4 px-6 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(11,72,40,0.32)] hover:shadow-[0_6px_22px_rgba(11,72,40,0.42)] transition-all duration-150 mt-4 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      <span>Submitting Application…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 -rotate-12 fill-white text-white flex-shrink-0 translate-y-[-0.5px]" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              STEP 2: LOGIN TO WHOLESALE
              ═══════════════════════════════════════════ */}
          {step === 2 && showForgot && (
            <WholesaleForgotPasswordFlow
              onBack={() => setShowForgot(false)}
              onSuccess={() => {
                setShowForgot(false)
                setErrors({})
                setServerError('')
              }}
            />
          )}

          {step === 2 && !showForgot && (
            <div>
              <div className="mb-4">
                <h2
                  className="font-serif text-[23px] sm:text-[25px] font-bold text-[#143223] tracking-tight"
                  style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
                >
                  Welcome back
                </h2>
                <p className="text-[13px] sm:text-[13.5px] text-[#556F60] mt-1">
                  Sign in to access your wholesale dashboard and preferred bulk rates.
                </p>
              </div>

              {/* Login Mode Switcher */}
              <div className="flex bg-[#F0F5ED] p-1 rounded-xl mb-4 border border-[#E0EBE2]">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('wholesale_id')
                    setErrors({})
                    setServerError('')
                  }}
                  className={`flex-1 py-2 text-[12.5px] font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                    loginMode === 'wholesale_id'
                      ? 'bg-white text-[#0B4828] shadow-xs'
                      : 'text-[#5A7365] hover:text-[#0B4828]'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  Wholesale ID (Quick)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('email')
                    setErrors({})
                    setServerError('')
                  }}
                  className={`flex-1 py-2 text-[12.5px] font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                    loginMode === 'email'
                      ? 'bg-white text-[#0B4828] shadow-xs'
                      : 'text-[#5A7365] hover:text-[#0B4828]'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  Email & Password
                </button>
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                {loginMode === 'wholesale_id' ? (
                  <div>
                    <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                      Wholesale ID <span className="text-[#183526]">*</span>
                    </label>
                    <div
                      className={`flex items-center w-full bg-white border rounded-xl px-3.5 h-[44px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        errors.wholesaleId
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="e.g. WHL-1001"
                        value={loginData.wholesaleId}
                        onChange={e => {
                          setLoginData(p => ({ ...p, wholesaleId: e.target.value }))
                          setErrors(p => ({ ...p, wholesaleId: '' }))
                          setServerError('')
                        }}
                        className="w-full bg-transparent border-0 outline-none text-[13.5px] text-[#14261C] uppercase font-mono font-medium"
                        autoFocus
                      />
                    </div>
                    {errors.wholesaleId && (
                      <p className="text-[11.5px] text-red-600 mt-1">{errors.wholesaleId}</p>
                    )}
                    <p className="text-[12px] text-[#5C7566] mt-1.5 leading-relaxed">
                      Instant wholesale access with your assigned ID. No password required.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[12px] sm:text-[12.5px] font-semibold text-[#183526] mb-1.5">
                        Business Email <span className="text-[#183526]">*</span>
                      </label>
                      <div
                        className={`flex items-center w-full bg-white border rounded-xl px-3.5 h-[44px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                          errors.email
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                        }`}
                      >
                        <Mail className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                        <input
                          type="email"
                          placeholder="order@yourbusiness.com"
                          value={loginData.email}
                          onChange={e => {
                            setLoginData(p => ({ ...p, email: e.target.value }))
                            setErrors(p => ({ ...p, email: '' }))
                            setServerError('')
                          }}
                          className="w-full bg-transparent border-0 outline-none text-[13.5px] text-[#14261C]"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[11.5px] text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] sm:text-[12.5px] font-semibold text-[#183526]">
                          Password <span className="text-[#183526]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgot(true)
                            setErrors({})
                            setServerError('')
                          }}
                          className="text-[12px] text-[#0B4828] hover:underline font-semibold cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div
                        className={`flex items-center w-full bg-white border rounded-xl px-3.5 h-[44px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                          errors.password
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-[#D4DFD8] focus-within:border-[#0B4828] focus-within:ring-2 focus-within:ring-[#0B4828]/15'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-[#7A8C81] mr-2.5 flex-shrink-0" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={e => {
                            setLoginData(p => ({ ...p, password: e.target.value }))
                            setErrors(p => ({ ...p, password: '' }))
                            setServerError('')
                          }}
                          className="w-full bg-transparent border-0 outline-none text-[13.5px] text-[#14261C]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(p => !p)}
                          className="text-[#7A8C81] hover:text-[#14261C] p-1 cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-[11.5px] text-red-600 mt-1">{errors.password}</p>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0B4828] hover:bg-[#07361D] active:scale-[0.99] text-white py-3.5 sm:py-4 px-6 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(11,72,40,0.32)] hover:shadow-[0_6px_22px_rgba(11,72,40,0.42)] transition-all mt-4 disabled:opacity-60 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      <span>Signing In…</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {loginMode === 'wholesale_id'
                          ? 'Log In with Wholesale ID'
                          : 'Log In to Wholesale'}
                      </span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-[12.5px] text-center text-[#556F60] mt-4">
                Don&apos;t have a wholesale account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setErrors({})
                    setServerError('')
                  }}
                  className="text-[#0B4828] font-bold hover:underline cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  Apply now
                </button>
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              STEP 3: SUCCESS / APPLICATION RECEIVED
              ═══════════════════════════════════════════ */}
          {step === 3 && (
            <div className="text-center py-4 sm:py-6">
              <div className="w-16 h-16 rounded-full bg-[#EAF3E4] text-[#0B4828] flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Check className="w-8 h-8" strokeWidth={2.8} />
              </div>

              <h2
                className="font-serif text-[24px] sm:text-[26px] font-bold text-[#143223]"
                style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
              >
                Application received!
              </h2>

              <p className="text-[13.5px] sm:text-[14px] text-[#556F60] mt-2 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-[#143223]">{applyData.contactName || 'there'}</strong>.
                We&apos;ll review your application for{' '}
                <strong className="text-[#143223]">{applyData.businessName || 'your business'}</strong>{' '}
                within 1 business day.
              </p>

              <p className="text-[12.5px] text-[#7A8C81] mt-1 mb-6">
                Confirmation details sent to <strong>{applyData.email}</strong>.
              </p>

              <div className="bg-[#F8FAF7] border border-[#E2ECE4] rounded-2xl p-4 text-left mb-6 space-y-2.5">
                {[
                  'Application logged directly into verification queue',
                  'Dedicated wholesale account manager assigned within 24 hours',
                  'Special tier wholesale catalog & bulk invoicing unlocked',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#EAF3E4] text-[#0B4828] flex items-center justify-center text-[10.5px] font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-[12.5px] text-[#294234]">{item}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.location.href = '/wholesale/profile'
                }}
                className="w-full bg-[#0B4828] hover:bg-[#07361D] text-white py-3.5 rounded-full font-semibold text-[15px] shadow-[0_4px_16px_rgba(11,72,40,0.32)] transition-all cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                Go to Wholesale Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
