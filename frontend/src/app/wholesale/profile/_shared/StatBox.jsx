// src/app/wholesale/profile/_shared/StatBox.jsx
export function StatBox({ label, value, sub }) {
  return (
    <div className="bg-white rounded-[20px] p-5 sm:p-6 flex flex-col justify-center items-center text-center border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
      <p className="text-[22px] sm:text-2xl font-bold text-[#085041] mb-2 leading-tight break-words">{value}</p>
      <p className="text-[11px] font-bold text-gray-500 m-0 uppercase tracking-[0.08em]">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1.5 italic font-medium">{sub}</p>}
    </div>
  )
}

// src/app/wholesale/profile/_shared/Field.jsx
export function Field({ label, value, name, onChange, readOnly, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
        {label}
      </label>
      <input
        type={type} name={name} value={value || ''} onChange={onChange} readOnly={readOnly}
        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${
          readOnly 
            ? 'bg-gray-50/80 border-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-gray-50/50 border-gray-200 text-[#151e13] focus:border-[#00694C] focus:ring-1 focus:ring-[#00694C] placeholder-gray-400'
        }`}
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}