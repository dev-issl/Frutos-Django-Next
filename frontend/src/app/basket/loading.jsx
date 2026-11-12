// src/app/basket/loading.jsx

export default function BasketLoading() {
  return (
    <div
      style={{ background: '#F6F6EC', minHeight: '100vh', width: '100%' }}
      className="flex flex-col items-center justify-center gap-5"
    >
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full border-4 animate-spin"
          style={{
            borderColor: '#DCE5D3',
            borderTopColor: '#0B462B',
            animationDuration: '0.75s',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-2xl"
            style={{
              color: '#0B462B',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            shopping_basket
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p
          className="text-xl italic"
          style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', color: '#14261B' }}
        >
          Loading your basket…
        </p>
        <p className="text-sm" style={{ color: '#586A5F' }}>
          Just a moment
        </p>
      </div>
    </div>
  )
}
