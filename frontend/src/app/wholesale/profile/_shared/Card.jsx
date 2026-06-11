// src/app/wholesale/profile/_shared/Card.jsx
export default function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-[0_4px_24px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col h-full transition-shadow hover:shadow-[0_8px_32px_rgb(0,0,0,0.05)]">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
        <span className="text-[#1D9E75] bg-[#E7F1DF] p-2 rounded-xl shrink-0">{icon}</span>
        <h2 className="font-serif text-[19px] font-bold text-gray-900 m-0">{title}</h2>
      </div>
      <div className="p-6 sm:p-8 flex-1 flex flex-col">{children}</div>
    </div>
  )
}