// src/app/wholesale/profile/_tabs/SettingsTab.jsx
import Card from '../_shared/Card'
import { Field } from '../_shared/StatBox'

export default function SettingsTab({ 
  profile, editForm, onChange, onSave, saving, success, error,
  pwForm, pwOnChange, pwOnSave, pwSaving, pwSuccess, pwError
}) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
    <Card title="Edit Profile" icon={
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    }>
      {/* 1 col mobile → 2 col md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business Name" value={profile.business_name} readOnly hint="Contact support to change." />
        <Field label="Email" value={profile.email} readOnly hint="Contact support to change." />
        <Field label="Contact Name" name="contact_name" value={editForm.contact_name} onChange={onChange} />
        <Field label="Phone" name="phone" value={editForm.phone} onChange={onChange} type="tel" />
        <Field label="Delivery Postcode" name="postcode" value={editForm.postcode} onChange={onChange} />

        {/* Volume select */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Monthly Volume
          </label>
          <select name="monthly_volume" value={editForm.monthly_volume} onChange={onChange} 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[#151e13] focus:border-[#00694C] focus:ring-1 focus:ring-[#00694C] outline-none transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="400_1000">€400 – €1,000 / month</option>
            <option value="1000_3000">€1,000 – €3,000 / month</option>
            <option value="3000_7000">€3,000 – €7,000 / month</option>
            <option value="7000_plus">€7,000+ / month</option>
          </select>
        </div>
      </div>

      {success && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Profile updated successfully.
        </div>
      )}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      <button 
        onClick={onSave} 
        disabled={saving} 
        className={`mt-4 w-full md:w-auto px-6 py-3 rounded-xl font-bold text-white text-sm transition-all ${
          saving 
            ? 'bg-[#00694C]/70 cursor-not-allowed' 
            : 'bg-[#00694C] hover:bg-[#085041] shadow-md shadow-[#00694C]/20 hover:-translate-y-0.5 cursor-pointer'
        }`}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </Card>

    {/* Change Password Card */}
    <Card title="Change Password" icon={
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    }>
      <div className="flex flex-col gap-4 max-w-md">
        {[
          { label: 'Current Password', name: 'old_password' },
          { label: 'New Password',     name: 'new_password' },
          { label: 'Confirm New',      name: 'confirm'      },
        ].map(({ label, name }) => (
          <Field key={name} label={label} name={name} type="password"
            value={pwForm[name]} onChange={pwOnChange} />
        ))}

        {pwSuccess && (
          <div className="mt-2 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Password changed successfully.
          </div>
        )}
        {pwError && (
          <div className="mt-2 p-3.5 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {pwError}
          </div>
        )}

        <button 
          onClick={pwOnSave} 
          disabled={pwSaving} 
          className={`mt-2 w-full md:w-auto px-6 py-3 rounded-xl font-bold text-[#085041] bg-[#E7F1DF] hover:bg-[#D5E6C9] text-sm transition-all ${
            pwSaving ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5 cursor-pointer'
          }`}
        >
          {pwSaving ? 'Changing…' : 'Update Password'}
        </button>
      </div>
    </Card>

    </div>
  )
}