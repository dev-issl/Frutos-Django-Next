/**
 * src/app/about/config/aboutIcons.jsx
 *
 * Attaches bespoke botanical SVG icons matching the About Values cards,
 * falling back to Lucide DynamicIcon for custom dashboard entries.
 */

import DynamicIcon from '@/app/components/DynamicIcon'

function LeafSolidEmblem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[24px] h-[24px] text-[#11482F]">
      <path
        d="M20.2 3.8C12.2 4.2 6.2 8.4 3.8 16.5c5.8-.7 11-3.7 14.3-8.6.9-1.4 1.6-2.7 2.1-4.1Z"
        fill="currentColor"
      />
      <path
        d="M3.6 20.2c2.8-3.8 7.3-8.4 13.8-13"
        stroke="#D5E6CE"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.4 17.2c2.7-1.3 5.4-3.4 7.4-6.4-3.4.3-5.9 2.4-7.4 6.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function HandshakeEmblem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[25px] h-[25px] text-[#11482F]">
      <path
        d="M2.8 11.4 6.8 7.6a2.6 2.6 0 0 1 3.6-.1l1.1 1a1.5 1.5 0 0 0 2 0l1-.9a2.6 2.6 0 0 1 3.6.1l3.1 3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 14.6 9.2 17.6a2.2 2.2 0 0 0 2.9 0l5.6-4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.9 16.3 1.5-1.3M10.4 17.9l1.6-1.4M15.1 15.8l1.5 1.2"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RosetteSealEmblem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[25px] h-[25px] text-[#11482F]">
      <path
        d="M12 2.6 14.1 4l2.5-.3 1 2.3 2.3 1-.3 2.5L21 11.6l-1.4 2.1.3 2.5-2.3 1-1 2.3-2.5-.3L12 20.6 9.9 19.2l-2.5.3-1-2.3-2.3-1 .3-2.5L3 11.6l1.4-2.1-.3-2.5 2.3-1 1-2.3 2.5.3L12 2.6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.6" r="4.3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="11.6" r="1.8" fill="currentColor" />
    </svg>
  )
}

function TwinWingsSproutEmblem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[24px] h-[24px] text-[#11482F]">
      <path
        d="M12 18.8V9.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 12.2C8 12.2 4.5 9.1 4 4.9c3.9-.4 7.3 2.3 8 7.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.2c4 0 7.5-3.1 8-7.3-3.9-.4-7.3 2.3-8 7.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.4c-2.8 0-5.4 1.8-6 4.5 2.6.4 5.2-1.2 6-4.5ZM12 14.4c2.8 0 5.4 1.8 6 4.5-2.6.4-5.2-1.2-6-4.5Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const VALUE_BADGE_MAP = {
  leaf: LeafSolidEmblem,
  handshake: HandshakeEmblem,
  users: HandshakeEmblem,
  badgecheck: RosetteSealEmblem,
  award: RosetteSealEmblem,
  sprout: TwinWingsSproutEmblem,
}

export function normalizeValues(rawValues = []) {
  return rawValues.map((v, idx) => {
    const key = String(v.icon_name || '').replace(/[-_ ]+/g, '').toLowerCase()
    const PresetIcon =
      VALUE_BADGE_MAP[key] ||
      [LeafSolidEmblem, HandshakeEmblem, RosetteSealEmblem, TwinWingsSproutEmblem][idx]

    return {
      ...v,
      icon: PresetIcon ? (
        <PresetIcon />
      ) : (
        <DynamicIcon
          name={v.icon_name}
          className="text-[#134A31]"
          size={19}
          fallbackName="Leaf"
        />
      ),
    }
  })
}
