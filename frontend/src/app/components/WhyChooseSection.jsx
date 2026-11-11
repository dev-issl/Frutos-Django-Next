'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronRight, Plus, Minus, ArrowRight } from 'lucide-react'

const VALUE_PILLARS = [
  {
    id: 'sustainable',
    title: 'Sustainably Grown',
    subtitle: 'For a greener tomorrow.',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M19.5 4.5C13.2 4.5 7 7.9 5.3 14.3C4.9 15.8 5.2 17.3 6 18.4C7.2 17.4 9 15.7 11.4 13.3C12.7 12 14.3 10.8 15.7 9.9C14.1 11.4 12.2 13.4 10.2 15.5C9 16.7 7.9 17.8 7 18.7C8.5 19.5 10.5 19.7 12.6 19C17.8 17.3 20.5 11.8 19.5 4.5Z"
          fill="#085041"
        />
        <path
          d="M4.5 20.2C5.2 19 6.2 17.9 7.3 16.8"
          stroke="#085041"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'quality',
    title: 'Premium Quality',
    subtitle: 'Only the best produce.',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="9.5" r="5.5" fill="#085041" />
        <path
          d="M9 14L7.8 21L12 18.7L16.2 21L15 14"
          fill="#085041"
        />
        <path
          d="M9.7 9.6L11.2 11.1L14.4 7.9"
          stroke="#DCECD8"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'farmers',
    title: 'Support Local Farmers',
    subtitle: 'Strengthening our community.',
    icon: (
      <svg width="22" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15.5 7.2L19.5 11.2L16.8 13.9C16 14.7 14.7 14.7 13.9 13.9L11.8 11.8L9.6 14C8.9 14.7 7.8 14.7 7.1 14L4.5 11.4L8.5 7.4C9.5 6.4 11 6.1 12.3 6.7C13.4 6.2 14.6 6.4 15.5 7.2Z"
          fill="#085041"
        />
        <path
          d="M7.5 14.8L10.3 17.6C11.2 18.5 12.8 18.5 13.7 17.6L16.8 14.5M2.8 10.5L5.2 12.9M21.2 10.5L18.8 12.9"
          stroke="#085041"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'ecofriendly',
    title: 'Eco-Friendly',
    subtitle: 'A healthier planet.',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20.5C12 20.5 4.2 15.2 4.2 9.4C4.2 6.5 6.4 4.3 9.2 4.3C10.8 4.3 12 5.1 12 5.1C12 5.1 13.2 4.3 14.8 4.3C17.6 4.3 19.8 6.5 19.8 9.4C19.8 15.2 12 20.5 12 20.5Z"
          fill="#085041"
        />
        <path
          d="M14.7 8.4C11.8 8.4 9.6 10.2 9.3 13.4C12.2 13.2 14.4 11.4 14.7 8.4Z"
          fill="#DCECD8"
        />
      </svg>
    ),
  },
]

const TESTIMONIALS = [
  {
    id: 1,
    quote: 'Excellent quality and super fast delivery! El Árbol is my go-to for fresh produce.',
    author: 'Sarah M.',
    location: 'Dhaka',
    initials: 'SM',
  },
  {
    id: 2,
    quote: 'Every basket arrives farm-fresh and crisp. Knowing it supports local growers makes it even better.',
    author: 'Rafiq H.',
    location: 'Dhanmondi',
    initials: 'RH',
  },
  {
    id: 3,
    quote: 'Reliable doorstep delivery, fair prices, and genuinely organic vegetables our whole family trusts.',
    author: 'Nadia K.',
    location: 'Gulshan',
    initials: 'NK',
  },
]

const FAQ_ITEMS = [
  {
    id: 'order',
    question: 'How do I place an order?',
    answer:
      'Browse fresh items in our Shop, add your chosen produce to the cart, select your nearest store or delivery address, and confirm at checkout.',
  },
  {
    id: 'delivery',
    question: 'What is the delivery time?',
    answer:
      'Same-day or next-morning delivery is available across Dhaka, keeping harvested produce crisp straight from our local store hubs.',
  },
  {
    id: 'organic',
    question: 'Is the produce organic?',
    answer:
      'Yes, our certified organic produce is sourced directly from trusted partner farms grown with sustainable practices and zero harmful sprays.',
  },
  {
    id: 'returns',
    question: 'Can I return an item?',
    answer:
      'If anything arrives damaged or below quality standards, let our support team know within 24 hours for an immediate replacement or refund.',
  },
]

export default function WhyChooseSection() {
  const [slideIdx, setSlideIdx] = useState(0)
  const [openFaqId, setOpenFaqId] = useState(null)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const currentTestimonial = TESTIMONIALS[slideIdx]

  function handleNextSlide() {
    setSlideIdx((prev) => (prev + 1) % TESTIMONIALS.length)
  }

  function handleSubscribe(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
    setTimeout(() => setSubscribed(false), 3500)
  }

  return (
    <section
      className="relative w-full overflow-hidden pt-4 md:pt-6 pb-8 md:pb-10"
      style={{ backgroundColor: '#EFF9F2' }}
    >
      {/* Subtle Top Organic Botanical Wave Accent */}
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-[120px] pointer-events-none select-none"
        aria-hidden="true"
      >
        <path
          d="M0,40 C360,115 920,-15 1440,52 L1440,0 L0,0 Z"
          fill="#E4F2E8"
          fillOpacity="0.6"
        />
        <path
          d="M0,56 C380,122 920,-4 1440,64"
          fill="none"
          stroke="#CFE3D5"
          strokeWidth="1.2"
          strokeOpacity="0.7"
        />
      </svg>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Section Heading ── */}
        <div className="text-center mb-6 sm:mb-7">
          <h2
            style={{
              fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.65rem, 2.5vw, 2.15rem)',
              fontWeight: 700,
              color: '#085041',
              lineHeight: 1.15,
            }}
          >
            Why Choose El Árbol?
          </h2>
          <div className="inline-flex items-center justify-center gap-2.5 mt-1.5">
            <span className="text-[13px] text-[#45665B]">
              Quality, trust and sustainability.
            </span>
            <span className="h-[1px] w-7 bg-[#9BB6A4]" />
          </div>
        </div>

        {/* ── 4 Value Pillars Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {VALUE_PILLARS.map((pillar) => (
            <div
              key={pillar.id}
              className="flex items-center gap-3.5 rounded-[14px] px-4 py-3.5 sm:px-5 sm:py-4 bg-[#F7FAF5] border border-[#DCE8DF]"
            >
              <div className="w-11 h-11 rounded-full bg-[#DCECD8] flex items-center justify-center shrink-0">
                {pillar.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold text-[#085041] leading-snug truncate">
                  {pillar.title}
                </h3>
                <p className="text-[12px] text-[#4B685B] leading-snug mt-0.5 truncate">
                  {pillar.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom 3-Column Bento Grid: Testimonials / FAQ / Newsletter ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.42fr_0.96fr_1.08fr] gap-5 items-start lg:min-h-[304px] mt-8 sm:mt-10">
          {/* Column 1: What Our Customers Say */}
          <div className="flex flex-col">
            <div className="mb-3.5">
              <h3
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 1.9vw, 1.55rem)',
                  fontWeight: 700,
                  color: '#085041',
                  lineHeight: 1.15,
                }}
              >
                What Our Customers Say
              </h3>
              <p className="text-[12.5px] text-[#4B685B] mt-0.5">
                Real stories. Real satisfaction.
              </p>
            </div>

            <div className="relative flex flex-col sm:flex-row items-stretch">
              {/* Testimonial Quote Card */}
              <div className="relative z-10 w-full sm:w-[62%] bg-[#F7FAF5] rounded-[14px] border border-[#DCE8DF] p-4 sm:p-5 flex flex-col justify-between min-h-[192px] sm:h-[192px]">
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#DCECD8] text-[#085041] flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="13" height="10" viewBox="0 0 14 11" fill="currentColor" aria-hidden="true">
                      <path d="M5.4 0C2.6 1.5 1 4 1 6.7C1 8.9 2.3 10.4 4.1 10.4C5.4 10.4 6.4 9.4 6.4 8.1C6.4 6.8 5.5 5.9 4.3 5.9C3.9 5.9 3.6 6 3.3 6.1C3.5 4.4 4.5 2.9 6.2 1.8L5.4 0ZM12.7 0C9.9 1.5 8.3 4 8.3 6.7C8.3 8.9 9.6 10.4 11.4 10.4C12.7 10.4 13.7 9.4 13.7 8.1C13.7 6.8 12.8 5.9 11.6 5.9C11.2 5.9 10.9 6 10.6 6.1C10.8 4.4 11.8 2.9 13.5 1.8L12.7 0Z" />
                    </svg>
                  </span>
                  <p className="text-[12.5px] sm:text-[13px] leading-[1.5] text-[#224338]">
                    &ldquo;{currentTestimonial.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-end justify-between gap-2 mt-4 pt-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#DCECD8] border border-[#C3DEC5] flex items-center justify-center text-[11.5px] font-bold text-[#085041] shrink-0">
                      {currentTestimonial.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[#085041] leading-tight truncate">
                        {currentTestimonial.author}
                      </p>
                      <p className="text-[11.5px] text-[#567063] leading-tight mt-0.5 truncate">
                        {currentTestimonial.location}
                      </p>
                    </div>
                  </div>

                  {/* 5 Stars */}
                  <div className="flex items-center gap-0.5 shrink-0 pb-0.5" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <svg
                        key={starIdx}
                        width="13"
                        height="13"
                        viewBox="0 0 20 20"
                        fill="#E89828"
                        aria-hidden="true"
                      >
                        <path d="M10 1.5L12.5 6.8L18.3 7.6L14.1 11.7L15.1 17.5L10 14.8L4.9 17.5L5.9 11.7L1.7 7.6L7.5 6.8L10 1.5Z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Crate Image Card With Carousel Next Trigger */}
              <div className="hidden sm:block relative sm:w-[46%] sm:-ml-7 z-0 rounded-[14px] overflow-hidden border border-[#DCE8DF] h-[192px]">
                <Image
                  src="/homepage/why_crate.jpg"
                  alt="Fresh produce wooden crate from local farms"
                  fill
                  unoptimized
                  sizes="260px"
                  className="object-cover object-right"
                />
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next customer review"
                  className="absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#3E6A2D] hover:bg-[#085041] text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {TESTIMONIALS.map((item, idx) => {
                const isActive = idx === slideIdx
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSlideIdx(idx)}
                    aria-label={`View review ${idx + 1}`}
                    className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                      isActive ? 'bg-[#085041]' : 'bg-[#C4D3C8] hover:bg-[#8FB09D]'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Column 2: Frequently Asked Questions */}
          <div className="flex flex-col">
            <div className="mb-3.5">
              <h3
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 1.9vw, 1.55rem)',
                  fontWeight: 700,
                  color: '#085041',
                  lineHeight: 1.15,
                }}
              >
                Frequently Asked Questions
              </h3>
              <p className="text-[12.5px] text-[#4B685B] mt-0.5">
                Find quick answers to common questions.
              </p>
            </div>

            <div className="rounded-[14px] bg-[#F7FAF5] border border-[#DCE8DF] divide-y divide-[#E3ECE5] overflow-hidden">
              {FAQ_ITEMS.map((faq) => {
                const isOpen = openFaqId === faq.id
                return (
                  <div key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-3 px-4 py-[13px] text-left text-[13px] font-medium text-[#085041] hover:bg-[#EEF6F0] transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <span className="shrink-0 transition-transform duration-300 ease-out">
                        {isOpen ? (
                          <Minus className="w-3.5 h-3.5 text-[#085041]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-[#085041]" />
                        )}
                      </span>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-2.5 pt-0 text-[11.5px] leading-[1.45] text-[#45665B]">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Column 3: Stay Connected Card (Matched Height & Top Alignment) */}
          <div className="flex flex-col">
            {/* Invisible spacer matching Columns 1 & 2 headers so card aligns horizontally on desktop */}
            <div className="hidden lg:block mb-3.5 invisible select-none pointer-events-none" aria-hidden="true">
              <div
                style={{
                  fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                  fontSize: 'clamp(1.3rem, 1.9vw, 1.55rem)',
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                &nbsp;
              </div>
              <div className="text-[12.5px] mt-0.5">&nbsp;</div>
            </div>

            <div className="relative rounded-[16px] overflow-hidden bg-[#0D462F] border border-[#0A3A27] flex flex-col justify-center h-[192px]">
              {/* Bottom Glowing Green Crop Field Photo Faded into Dark Green Card */}
              <div className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none select-none">
                <Image
                  src="/homepage/why_farm_field.jpg"
                  alt="Green organic farm rows in morning sunlight"
                  fill
                  unoptimized
                  sizes="360px"
                  className="object-cover object-bottom"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, #0D462F 0%, rgba(13, 70, 47, 0.86) 36%, rgba(13, 70, 47, 0.14) 100%)',
                  }}
                />
              </div>

              <div className="relative z-10 px-5 py-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="21" height="20" viewBox="0 0 26 24" fill="none" aria-hidden="true">
                    <path
                      d="M21 4.5C13.5 4.5 6.8 8.2 5 15C4.6 16.5 5 18 5.8 19.2C7.4 17.8 9.6 15.8 12.4 13C14 11.4 15.8 10.1 17.3 9.2C15.5 11 13.3 13.3 11 15.7C9.6 17.1 8.3 18.4 7.3 19.4C9.1 20.3 11.5 20.5 14 19.6C19.6 17.7 22.3 11.8 21 4.5Z"
                      fill="#62B33B"
                    />
                  </svg>
                  <h3
                    style={{
                      fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif',
                      fontSize: 'clamp(1.25rem, 1.75vw, 1.48rem)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      lineHeight: 1.15,
                    }}
                  >
                    Stay Connected
                  </h3>
                </div>

                <p className="text-[12px] text-white/90 leading-snug mb-3.5 max-w-[260px]">
                  Get the latest updates, offers and healthy living tips.
                </p>

                <form
                  onSubmit={handleSubscribe}
                  className="bg-white rounded-full p-1 pl-3.5 flex items-center gap-1.5 border border-white/20"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    aria-label="Your email address"
                    className="flex-1 min-w-0 bg-transparent text-[#085041] placeholder-[#7B8F85] text-[12px] outline-none border-0"
                  />
                  <button
                    type="submit"
                    className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#4F9A2A] hover:bg-[#428422] text-white text-[11.5px] font-semibold px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>{subscribed ? 'Subscribed ✓' : 'Subscribe'}</span>
                    {!subscribed && <ArrowRight className="w-3 h-3" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

