/**
 * src/app/about/config/aboutIcons.jsx
 *
 * Attaches the correct JSX icon to each value object from the API using DynamicIcon.
 */

import DynamicIcon from '@/app/components/DynamicIcon'

export function normalizeValues(rawValues) {
  return rawValues.map((v) => ({
    ...v,
    icon: <DynamicIcon name={v.icon_name} className="text-[#00694c]" size={28} fallbackName="Leaf" />,
  }))
}