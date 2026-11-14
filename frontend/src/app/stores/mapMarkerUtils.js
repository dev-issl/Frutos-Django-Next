// src/app/stores/mapMarkerUtils.js
// Optimized self-contained brand marker generator with embedded vector + logo

export const EL_ARBOL_LOGO_DATA_URI =
  'data:image/png;base64,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'

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildBrandTeardropSvg({
  width = 38,
  height = 48,
  isActive = false,
  logoSrc = '',
}) {
  const fill = isActive ? '#0A4325' : '#0E4D2D'
  const resolvedLogo = logoSrc && String(logoSrc).trim() ? String(logoSrc).trim() : EL_ARBOL_LOGO_DATA_URI
  const shadowOpacity = isActive ? '0.45' : '0.30'
  const shadowId = isActive ? 'pin-shadow-act' : 'pin-shadow-norm'

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="overflow:visible;">
      <defs>
        <filter id="${shadowId}" x="-25%" y="-15%" width="150%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0A4325" flood-opacity="${shadowOpacity}"/>
        </filter>
        <clipPath id="pin-circle-clip-${isActive ? 'act' : 'norm'}">
          <circle cx="19" cy="19" r="13"/>
        </clipPath>
      </defs>
      <g filter="url(#${shadowId})">
        <path d="M19 1.5C9.34 1.5 1.5 9.34 1.5 19C1.5 30.5 17.5 45.2 18.25 45.9C18.66 46.3 19.34 46.3 19.75 45.9C20.5 45.2 36.5 30.5 36.5 19C36.5 9.34 28.66 1.5 19 1.5Z"
          fill="${fill}" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="19" cy="19" r="13.2" fill="#FFFFFF"/>
        <g clip-path="url(#pin-circle-clip-${isActive ? 'act' : 'norm'})">
          <image href="${resolvedLogo}" xlink:href="${resolvedLogo}" x="6" y="6" width="26" height="26" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </g>
    </svg>
  `.trim()
}

export function buildStoreMarkerIcon(L, isActive, store) {
  const width = isActive ? 46 : 38
  const height = isActive ? 58 : 48
  const logoSrc = store?.logo || ''
  const svgHtml = buildBrandTeardropSvg({ width, height, isActive, logoSrc })

  return L.divIcon({
    className: 'el-arbol-leaflet-marker',
    html: `<div style="
      position:relative;
      width:${width}px;
      height:${height}px;
      display:flex;
      align-items:center;
      justify-content:center;
      transform:${isActive ? 'scale(1.08)' : 'scale(1)'};
      transition:transform 0.18s ease;
      cursor:pointer;
    ">
      ${svgHtml}
    </div>`,
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), height - 2],
    tooltipAnchor: [0, -Math.round(height * 0.85)],
  })
}

export function buildStoreMiniMapIcon(L, store, pinLabel) {
  const width = 38
  const height = 48
  const logoSrc = store?.logo || ''
  const svgHtml = buildBrandTeardropSvg({ width, height, isActive: false, logoSrc })

  return L.divIcon({
    className: 'el-arbol-leaflet-marker',
    html: `<div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      cursor:pointer;
    ">
      <div style="
        position:relative;
        width:${width}px;
        height:${height}px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${svgHtml}
      </div>
      <span style="
        margin-top:2px;
        padding:2px 8px;
        border-radius:5px;
        background:rgba(255,255,255,0.96);
        color:#0E4D2D;
        font-size:11px;
        font-weight:700;
        line-height:1.2;
        box-shadow:0 1px 4px rgba(0,0,0,0.15);
        white-space:nowrap;
        letter-spacing:-0.01em;
      ">${escapeHtml(pinLabel)}</span>
    </div>`,
    iconSize: [100, 72],
    iconAnchor: [50, 48],
  })
}
