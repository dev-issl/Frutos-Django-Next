'use client'

function triggerOpenModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ws:open-apply-modal'))
  }
}

function triggerPrefetchModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ws:prefetch-apply-modal'))
  }
}

export default function WholesaleApplyButton({ children, className = '' }) {
  return (
    <button
      type="button"
      onClick={triggerOpenModal}
      onMouseEnter={triggerPrefetchModal}
      onFocus={triggerPrefetchModal}
      className={className}
    >
      {children}
    </button>
  )
}

