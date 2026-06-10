// import Image from 'next/image'
// import Link from 'next/link'
// import heroImg from '../../../public/about/about_hero.png';

// export default function HeroSection({ onApplyClick }) {
//   return (
//     <>
//       <style>{`
//         .ws-hero {
//           background: #fff;
//           overflow: hidden;
//         }
//         .ws-hero-inner {
//           max-width: 1280px;
//           margin: 0 auto;
//           padding: 0 40px;
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           align-items: center;
//           gap: 48px;
//           min-height: 88vh;
//         }
//         .ws-hero-left { padding: 56px 0; }
//         .ws-hero-right {
//           display: flex;
//           align-items: stretch;
//           height: 100%;
//           min-height: 520px;
//         }
//         .ws-hero-img-wrap {
//           width: 100%;
//           height: 400px;
//           border-radius: 20px;
//           overflow: hidden;
//           position: relative;
//           align-self: center;
//         }
//         .ws-hero-img-wrap img {
//           width: 100%;
//           height: 100%;
//           object-fit: cover;
//           display: block;
//         }
//         .ws-hero-h1 {
//           font-family: "Playfair Display", Georgia, serif;
//           font-weight: 700;
//           color: #0a1f12;
//           line-height: 1.08;
//           margin: 0 0 18px;
//           letter-spacing: -0.02em;
//           font-size: clamp(32px, 4vw, 54px);
//         }
//         .ws-hero-btn-primary {
//           display: inline-flex; align-items: center; gap: 9px;
//           padding: 13px 24px; border-radius: 11px; font-weight: 700;
//           font-size: 13.5px; color: #fff; cursor: pointer;
//           background: #00694c; border: none;
//           box-shadow: 0 3px 16px rgba(0,105,76,0.25);
//           font-family: inherit; letter-spacing: 0.01em;
//           transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
//           white-space: nowrap;
//         }
//         .ws-hero-btn-primary:hover { background: #005540; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,105,76,0.32); }
//         .ws-hero-btn-sec {
//           display: inline-flex; align-items: center; gap: 7px;
//           padding: 12px 20px; border-radius: 11px; font-weight: 600;
//           font-size: 13.5px; color: #2D4A38; text-decoration: none;
//           border: 1.5px solid #C5DDD0; background: #fff;
//           transition: background 0.15s, border-color 0.15s;
//           white-space: nowrap;
//         }
//         .ws-hero-btn-sec:hover { background: #F0FBF5; border-color: #00694c; }

//         @media (max-width: 900px) {
//           .ws-hero-inner {
//             grid-template-columns: 1fr;
//             min-height: auto;
//             gap: 28px;
//             padding: 0 24px;
//           }
//           .ws-hero-left { padding: 44px 0 0; }
//           .ws-hero-right { min-height: auto; }
//           .ws-hero-img-wrap { height: 300px; }
//         }
//         @media (max-width: 560px) {
//           .ws-hero-inner { padding: 0 16px; }
//           .ws-hero-left { padding: 32px 0 0; }
//           .ws-hero-img-wrap { height: 240px; border-radius: 14px; margin-bottom: 32px; }
//           .ws-hero-cta-row { flex-direction: column; align-items: stretch; }
//           .ws-hero-btn-primary, .ws-hero-btn-sec { justify-content: center; }
//         }
//       `}</style>

//       <section className="ws-hero">
//         <div className="ws-hero-inner">

//           {/* ── LEFT ── */}
//           <div className="ws-hero-left">

//             {/* Eyebrow */}
//             {/* <div style={{
//               display: 'inline-flex', alignItems: 'center', gap: '7px',
//               background: '#F0FBF5', border: '1px solid #C5E8D5',
//               borderRadius: '100px', padding: '4px 12px 4px 7px', marginBottom: '20px',
//             }}>
//               <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00B87A', display: 'inline-block', boxShadow: '0 0 8px rgba(0,184,122,0.5)' }} />
//               <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00694c' }}>
//                 Wholesale Programme
//               </span>
//             </div> */}

//             <h1 className="ws-hero-h1">
//               Premium produce,<br />
//               <em style={{ fontStyle: 'italic', color: '#00694c' }}>built for your business.</em>
//             </h1>

//             <p style={{ fontSize: '15px', color: '#4A6358', lineHeight: 1.78, maxWidth: '500px', marginBottom: '10px' }}>
//               El Árbol supplies restaurants, hotels, caterers, and retailers across Spain with directly sourced produce — harvested to order, delivered within 48 hours.
//             </p>
//             <p style={{ fontSize: '12.5px', color: '#9aada3', marginBottom: '30px' }}>
//               Trusted by 200+ food businesses · Minimum order from €400/month
//             </p>

//             <div className="ws-hero-cta-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
//               <button className="ws-hero-btn-primary" onClick={onApplyClick}>
//                 Apply for an Account
//                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//                   <path d="M5 12h14M12 5l7 7-7 7" />
//                 </svg>
//               </button>
//               <Link href="#how-it-works" className="ws-hero-btn-sec">
//                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                   <circle cx="12" cy="12" r="10" />
//                   <path d="M10 15l5-3-5-3v6z" fill="currentColor" stroke="none" />
//                 </svg>
//                 How it works
//               </Link>
//             </div>

//             {/* Trust strip */}
//             <div style={{ marginTop: '36px', paddingTop: '22px', borderTop: '1px solid #EAF0EB', display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center' }}>
//               <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b0bdb8', marginRight: '2px' }}>Serving</span>
//               {[
//                 { label: 'Fine Dining' },
//                 { label: 'Hotel Groups' },
//                 { label: 'Catering' },
//                 { label: 'Food Retail' },
//                 { label: 'Dark Kitchens' },
//               ].map((t, i) => (
//                 <span key={i} style={{
//                   fontSize: '11.5px', fontWeight: 600, color: '#4A6358',
//                   padding: '4px 10px', borderRadius: '100px',
//                   border: '1px solid #D5E8DC', background: '#F5FBF7',
//                 }}>
//                   {t.label}
//                 </span>
//               ))}
//             </div>
//           </div>

//           {/* ── RIGHT — image ── */}
//           <div className="ws-hero-right">
//             <div className="ws-hero-img-wrap">
//               <Image fill placeholder='blur'
//                 src={heroImg}
//                 alt="Fresh premium produce — El Árbol wholesale"
//               />

//               {/* Gradient overlay at bottom */}
//               <div style={{
//                 position: 'absolute', inset: 0,
//                 background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(8,28,18,0.6) 100%)',
//                 borderRadius: '20px',
//               }} />

//               {/* Bottom badge */}
//               <div style={{
//                 position: 'absolute', bottom: '18px', left: '18px', right: '18px',
//                 background: 'rgba(255,255,255,0.94)',
//                 backdropFilter: 'blur(14px)',
//                 borderRadius: '13px', padding: '13px 15px',
//                 display: 'flex', alignItems: 'center', gap: '12px',
//                 boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
//                 border: '1px solid rgba(255,255,255,0.7)',
//               }}>
//                 <div style={{
//                   width: '38px', height: '38px', borderRadius: '10px',
//                   background: '#E7F5EE', display: 'flex', alignItems: 'center',
//                   justifyContent: 'center', flexShrink: 0,
//                 }}>
//                   <svg width="20" height="20" fill="none" stroke="#00694c" strokeWidth="1.8" viewBox="0 0 24 24">
//                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
//                     <polyline points="22 4 12 14.01 9 11.01" />
//                   </svg>
//                 </div>
//                 <div>
//                   <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#0a1f12', margin: '0 0 2px' }}>
//                     Harvested to order
//                   </p>
//                   <p style={{ fontSize: '11.5px', color: '#6D7A73', margin: 0 }}>
//                     From 40+ certified farms across Spain
//                   </p>
//                 </div>
//               </div>

//               {/* Top-right stat */}
//               <div style={{
//                 position: 'absolute', top: '16px', right: '16px',
//                 background: '#00694c', borderRadius: '11px', padding: '8px 14px',
//                 display: 'flex', flexDirection: 'column', alignItems: 'center',
//                 boxShadow: '0 4px 16px rgba(0,105,76,0.35)',
//               }}>
//                 <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>48h</span>
//                 <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.08em', marginTop: '1px' }}>DELIVERY</span>
//               </div>
//             </div>
//           </div>

//         </div>
//       </section>
//     </>
//   )
// }



// src/app/wholesale/HeroSection.jsx
// Accepts `data` prop from the server component — no client fetch needed.
// Icons and copy are fully CMS-driven.

import Link from 'next/link'

export default function HeroSection({ data, onApplyClick }) {
  // ── Fallback defaults (shown while CMS is empty / API is down) ────────────
  const hero = {
    headline:              data?.headline             ?? 'Premium produce,',
    headline_em:           data?.headline_em          ?? 'built for your business.',
    subtitle:              data?.subtitle             ?? 'El Árbol supplies restaurants, hotels, caterers, and retailers across Spain with directly sourced produce — harvested to order, delivered within 48 hours.',
    trust_text:            data?.trust_text           ?? 'Trusted by 200+ food businesses · Minimum order from €400/month',
    hero_image_url:        data?.hero_image_url_final ?? null,
    badge_stat:            data?.badge_stat           ?? '48h',
    badge_label:           data?.badge_label          ?? 'DELIVERY',
    bottom_badge_title:    data?.bottom_badge_title   ?? 'Harvested to order',
    bottom_badge_subtitle: data?.bottom_badge_subtitle ?? 'From 40+ certified farms across Spain',
    trust_badges:          data?.trust_badges         ?? [
      { id: 1, label: 'Fine Dining' },
      { id: 2, label: 'Hotel Groups' },
      { id: 3, label: 'Catering' },
      { id: 4, label: 'Food Retail' },
      { id: 5, label: 'Dark Kitchens' },
    ],
  }

  return (
    <>
      <style>{`
        .ws-hero { background: #fff; overflow: hidden; }
        .ws-hero-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 40px;
          display: grid; grid-template-columns: 1fr 1fr;
          align-items: center; gap: 48px; min-height: 88vh;
        }
        .ws-hero-left  { padding: 56px 0; }
        .ws-hero-right { display: flex; align-items: stretch; height: 100%; min-height: 520px; }
        .ws-hero-img-wrap {
          width: 100%; height: 400px; border-radius: 20px;
          overflow: hidden; position: relative; align-self: center;
          background: #e8f4ec;
        }
        .ws-hero-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ws-hero-h1 {
          font-family: "Playfair Display", Georgia, serif; font-weight: 700;
          color: #0a1f12; line-height: 1.08; margin: 0 0 18px;
          letter-spacing: -0.02em; font-size: clamp(32px, 4vw, 54px);
        }
        .ws-hero-btn-primary {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 24px; border-radius: 11px; font-weight: 700;
          font-size: 13.5px; color: #fff; cursor: pointer;
          background: #00694c; border: none;
          box-shadow: 0 3px 16px rgba(0,105,76,0.25); font-family: inherit;
          letter-spacing: 0.01em;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .ws-hero-btn-primary:hover {
          background: #005540; transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,105,76,0.32);
        }
        .ws-hero-btn-sec {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 12px 20px; border-radius: 11px; font-weight: 600;
          font-size: 13.5px; color: #2D4A38; text-decoration: none;
          border: 1.5px solid #C5DDD0; background: #fff;
          transition: background 0.15s, border-color 0.15s; white-space: nowrap;
        }
        .ws-hero-btn-sec:hover { background: #F0FBF5; border-color: #00694c; }
        @media (max-width: 900px) {
          .ws-hero-inner { grid-template-columns: 1fr; min-height: auto; gap: 28px; padding: 0 24px; }
          .ws-hero-left  { padding: 44px 0 0; }
          .ws-hero-right { min-height: auto; }
          .ws-hero-img-wrap { height: 300px; }
        }
        @media (max-width: 560px) {
          .ws-hero-inner { padding: 0 16px; }
          .ws-hero-left  { padding: 32px 0 0; }
          .ws-hero-img-wrap { height: 240px; border-radius: 14px; margin-bottom: 32px; }
          .ws-hero-cta-row { flex-direction: column; align-items: stretch; }
          .ws-hero-btn-primary, .ws-hero-btn-sec { justify-content: center; }
        }
      `}</style>

      <section className="ws-hero">
        <div className="ws-hero-inner">

          {/* ── LEFT ── */}
          <div className="ws-hero-left">
            <h1 className="ws-hero-h1">
              {hero.headline}<br />
              <em style={{ fontStyle: 'italic', color: '#00694c' }}>{hero.headline_em}</em>
            </h1>

            <p style={{ fontSize: '15px', color: '#4A6358', lineHeight: 1.78, maxWidth: '500px', marginBottom: '10px' }}>
              {hero.subtitle}
            </p>
            <p style={{ fontSize: '12.5px', color: '#9aada3', marginBottom: '30px' }}>
              {hero.trust_text}
            </p>

            <div className="ws-hero-cta-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="ws-hero-btn-primary" onClick={onApplyClick}>
                Apply for an Account
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <Link href="#how-it-works" className="ws-hero-btn-sec">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M10 15l5-3-5-3v6z" fill="currentColor" stroke="none" />
                </svg>
                How it works
              </Link>
            </div>

            {/* Trust strip */}
            {hero.trust_badges.length > 0 && (
              <div style={{
                marginTop: '36px', paddingTop: '22px', borderTop: '1px solid #EAF0EB',
                display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b0bdb8', marginRight: '2px' }}>
                  Serving
                </span>
                {hero.trust_badges.map((b, index) => (
                  <span key={b.id || index} style={{
                    fontSize: '11.5px', fontWeight: 600, color: '#4A6358',
                    padding: '4px 10px', borderRadius: '100px',
                    border: '1px solid #D5E8DC', background: '#F5FBF7',
                  }}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT — image ── */}
          <div className="ws-hero-right">
            <div className="ws-hero-img-wrap">
              {hero.hero_image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={hero.hero_image_url} alt="Fresh premium produce — El Árbol wholesale" />
              ) : (
                /* Placeholder when no image is set yet */
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, #e8f4ec 0%, #d4eddc 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="64" height="64" fill="none" stroke="#00694c" strokeWidth="1.2" viewBox="0 0 24 24" opacity="0.3">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(8,28,18,0.6) 100%)',
                borderRadius: '20px',
              }} />

              {/* Bottom badge */}
              <div style={{
                position: 'absolute', bottom: '18px', left: '18px', right: '18px',
                background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)',
                borderRadius: '13px', padding: '13px 15px',
                display: 'flex', alignItems: 'center', gap: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                border: '1px solid rgba(255,255,255,0.7)',
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: '#E7F5EE', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="20" height="20" fill="none" stroke="#00694c" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#0a1f12', margin: '0 0 2px' }}>
                    {hero.bottom_badge_title}
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#6D7A73', margin: 0 }}>
                    {hero.bottom_badge_subtitle}
                  </p>
                </div>
              </div>

              {/* Top-right stat badge */}
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: '#00694c', borderRadius: '11px', padding: '8px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,105,76,0.35)',
              }}>
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                  {hero.badge_stat}
                </span>
                <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.08em', marginTop: '1px' }}>
                  {hero.badge_label}
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}