import Image from 'next/image'
import SectionHeader from './SectionHeader'

function BotanicalSideLeaf({ className = '' }) {
  return (
    <svg viewBox="0 0 180 220" fill="none" aria-hidden="true" className={className}>
      <path
        d="M28 190C34 118 76 58 148 24c-8 66-46 122-120 166Z"
        fill="currentColor"
      />
      <path
        d="M22 198c24-38 66-92 126-174"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M92 184c28-14 52-38 68-70-26 6-50 26-68 70Z"
        fill="currentColor"
        opacity="0.65"
      />
    </svg>
  )
}

/**
 * Tailored warm botanical studio portrait avatar used when CMS has not uploaded
 * an explicit headshot URL for a team member slot.
 */
function PortraitFallback({ index, name }) {
  const isFemale = index % 2 === 0
  const bgId = `aboutTeamBg${index}`
  const jacketColor = index === 0 ? '#183C2E' : index === 2 ? '#29483B' : '#23312B'
  const hairColor = '#1E211F'
  const skinBase = index === 0 || index === 2 ? '#E7B99B' : '#D9A788'
  const skinShadow = index === 0 || index === 2 ? '#D29F80' : '#C28E70'

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={name}
      className="w-full h-full"
    >
      <defs>
        <radialGradient id={bgId} cx="42%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#EEF4EA" />
          <stop offset="65%" stopColor="#D7E2CF" />
          <stop offset="100%" stopColor="#BDCCB5" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${bgId})`} />

      {/* Back hair for female silhouettes */}
      {isFemale && (
        <path
          d="M28 45c0-18 10-28 22-28s22 10 22 28v24H28V45Z"
          fill={hairColor}
        />
      )}

      {/* Shoulders & Blazer */}
      <path
        d="M14 102c3-19 16-27 36-27s33 8 36 27H14Z"
        fill={jacketColor}
      />
      {/* Crisp Shirt V / Collar */}
      <path d="M40 75l10 17 10-17H40Z" fill="#F8FBF6" />
      <path d="M45 64v12c0 3 2.2 5 5 5s5-2 5-5V64H45Z" fill={skinShadow} />

      {/* Head */}
      <ellipse cx="50" cy="46" rx="15" ry="18" fill={skinBase} />

      {/* Hair front */}
      {isFemale ? (
        <path
          d="M34 44c1-16 9-24 16-24s15 8 16 24c-4-7-10-10-16-10s-12 3-16 10Z"
          fill={hairColor}
        />
      ) : (
        <path
          d="M34 42c0-14 7-22 16-22s16 8 16 22c-3-6-9-9-16-9s-13 3-16 9Z"
          fill={hairColor}
        />
      )}

      {/* Subtle facial features */}
      <circle cx="44.5" cy="46" r="1.4" fill="#232B26" />
      <circle cx="55.5" cy="46" r="1.4" fill="#232B26" />
      <path
        d="M45.5 54c2.5 2.4 6.5 2.4 9 0"
        stroke="#A46B55"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Neatly trimmed facial hair for male slots */}
      {!isFemale && (
        <path
          d="M39 51c2 9 7 13 11 13s9-4 11-13c-2.5 4.5-6.5 6.5-11 6.5s-8.5-2-11-6.5Z"
          fill={hairColor}
          opacity="0.35"
        />
      )}
    </svg>
  )
}

export default function TeamSection({ team = [] }) {
  return (
    <section className="relative py-10 sm:py-14 overflow-hidden bg-[#F2F5EC]">
      {/* Faint botanical side accents */}
      <BotanicalSideLeaf className="hidden md:block pointer-events-none select-none absolute -left-8 bottom-0 w-36 h-44 text-[#9CB799] opacity-[0.22]" />
      <BotanicalSideLeaf className="hidden md:block pointer-events-none select-none absolute -right-8 bottom-0 w-36 h-44 text-[#9CB799] opacity-[0.22] -scale-x-100" />

      <div className="relative z-10 max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="MEET THE TEAM"
          title="Meet the team"
          className="mb-8 sm:mb-10"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
          {team.map((t, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="relative w-[78px] h-[78px] sm:w-[86px] sm:h-[86px] rounded-full overflow-hidden ring-[3px] ring-white shadow-[0_6px_18px_rgba(16,66,45,0.12)] mb-3 bg-[#DCE8D8]">
                {t.image_url ? (
                  <Image
                    src={t.image_url}
                    alt={t.name}
                    fill
                    decoding="async"
                    unoptimized
                    sizes="90px"
                    className="object-cover"
                  />
                ) : (
                  <PortraitFallback index={i} name={t.name} />
                )}
              </div>

              <h3 className="text-[13.5px] sm:text-[14.5px] font-bold text-[#143728] leading-snug">
                {t.name}
              </h3>
              <p className="text-[11.5px] sm:text-[12px] text-[#5D7366] mt-0.5 leading-snug">
                {t.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
