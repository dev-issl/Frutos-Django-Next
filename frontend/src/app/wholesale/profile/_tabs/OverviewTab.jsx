// src/app/wholesale/profile/_tabs/OverviewTab.jsx
import Card from '../_shared/Card'
import { StatBox } from '../_shared/StatBox'

const VOLUME_LABELS = {
  '400_1000':  '€400 – €1,000 / month',
  '1000_3000': '€1,000 – €3,000 / month',
  '3000_7000': '€3,000 – €7,000 / month',
  '7000_plus': '€7,000+ / month',
}

export default function OverviewTab({ profile, orders }) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <StatBox label="Total Orders" value={orders.length} />
        <StatBox
          label="Total Spent"
          value={`€${Number(profile.total_spent || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
        />
        <StatBox
          label="Monthly Vol."
          value={VOLUME_LABELS[profile.monthly_volume]?.split('/')[0]?.trim() || '—'}
          sub="estimated"
        />
      </div>

      {/* Details + Manager Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card title="Account Details" icon={
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        }>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Business', value: profile.business_name },
              { label: 'Contact',  value: profile.contact_name },
              { label: 'Email',    value: profile.email },
              { label: 'Phone',    value: profile.phone || '—' },
              { label: 'Postcode', value: profile.postcode || '—' },
              { label: 'Type',     value: profile.display_business_type || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 text-[13px] sm:text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-500 font-medium shrink-0 uppercase tracking-wide text-xs mt-0.5">{label}</span>
                <span className="text-gray-900 font-semibold text-right break-words">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Account Manager" icon={
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72A12.84 12.84 0 007.5 4.5a2 2 0 01-.45 2.11L5.91 7.74a16 16 0 006.29 6.29l1.13-1.14a2 2 0 012.11-.45 12.84 12.84 0 002.81.76A2 2 0 0122 14.92z" />
          </svg>
        }>
          {profile.account_manager_name ? (
            <div className="flex flex-col gap-6 h-full justify-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full shrink-0 bg-gradient-to-br from-[#085041] to-[#1D9E75] flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl font-serif">
                    {profile.account_manager_name[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-base sm:text-lg m-0">{profile.account_manager_name}</p>
                  <p className="text-gray-500 text-sm m-0 truncate">{profile.account_manager_email}</p>
                </div>
              </div>
              <a href={`mailto:${profile.account_manager_email}`} className="inline-flex items-center gap-2 bg-[#E7F1DF] hover:bg-[#D5E6C9] text-[#085041] rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors w-fit">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Send Message
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <svg width="24" height="24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium m-0 max-w-[200px]">
                {profile.status === 'pending'
                  ? 'Your account manager will be assigned after approval.'
                  : 'No account manager assigned yet.'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Timeline / Dates Section */}
      {(profile.applied_at || profile.approved_at) && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-12 shadow-[0_2px_12px_rgb(0,0,0,0.02)]">
          {profile.applied_at && (
            <div className="relative">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                Application Received
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold m-0 pl-4">
                {new Date(profile.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          {profile.approved_at && (
            <div className="relative sm:pl-12 sm:before:content-[''] sm:before:absolute sm:before:left-0 sm:before:top-1/2 sm:before:-translate-y-1/2 sm:before:w-px sm:before:h-12 sm:before:bg-gray-100">
              <p className="text-xs font-bold text-[#085041] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1D9E75] shadow-[0_0_8px_rgba(29,158,117,0.4)]"></span>
                Account Approved
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold m-0 pl-4">
                {new Date(profile.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}