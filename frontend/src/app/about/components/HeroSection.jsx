import Image from 'next/image'
import Link from 'next/link'
import aboutHero from '../../../../public/about/about_hero.png';

export default function HeroSection({ data }) {
  const { badge, title_main, title_highlight, title, image_url } = data || {};
  return (
    <section style={{ background: '#fff', borderBottom: '1px solid rgba(188,202,193,0.2)' }}>
      <style>{`
        .hero-inner { display: flex; align-items: center; gap: 48px; }
        .hero-text  { flex: 1; min-width: 0; }
        .hero-img-wrap { display: none; }
        @media (min-width: 1024px) {
          .hero-img-wrap {
            display: block;
            flex: 0 0 420px;
            width: 500px;
            height: 350px;
            position: relative;
            border-radius: 20px;
            // overflow: hidden;
            flex-shrink: 0;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }} className="about-hero-pad">
        <div className="hero-inner">

          {/* ── Left: text ── */}
          <div className="hero-text" style={{ maxWidth: '600px' }}>
            <span style={{
              display: 'inline-block', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: '#00694c',
              marginBottom: '16px',
            }}>
              {badge || 'Our story'}
            </span>
            <h1 className="about-h1" style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600, color: '#151e13', lineHeight: 0.9,
              marginBottom: '20px',
            }}>
              {title_main || (title ? '' : 'Rooted in quality,')}
              {(title_main || !title) && <br />}
              {title_highlight ? (
                <em style={{ fontStyle: 'italic', color: '#00694c' }}>
                  {title_highlight}
                </em>
              ) : !title ? (
                <em style={{ fontStyle: 'italic', color: '#00694c' }}>
                  growing for the future.
                </em>
              ) : null}
              {title && !title_main && !title_highlight && (
                <span dangerouslySetInnerHTML={{ __html: title }} />
              )}
            </h1>
            {/* <p style={{ fontSize: '16px', color: '#6D7A73', lineHeight: 1.5, maxWidth: '580px', marginBottom: '32px' }}>
              El Árbol was born from a simple conviction: the gap between a Spanish farmer's harvest and your dinner table should be as short as possible. We are the bridge — careful, transparent, and deeply committed to the people on both ends.
            </p> */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className='pt-3'>
              <Link href="/shop" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '13px 24px', borderRadius: '12px', fontWeight: 700,
                fontSize: '14px', color: '#fff', textDecoration: 'none',
                background: 'linear-gradient(135deg, #00694c 0%, #008560 100%)',
              }}>
                Browse the Market
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/stores" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '13px 24px', borderRadius: '12px', fontWeight: 700,
                fontSize: '14px', color: '#151e13', textDecoration: 'none',
                background: '#ECF7E4', border: '1px solid rgba(0,105,76,0.12)',
              }}>
                Find a Store
              </Link>
            </div>
          </div>

          {/* ── Right: image (large screens only) ── */}
          <div className="hero-img-wrap">
            {image_url ? (
              <Image 
                src={image_url}
                alt={badge || "El Árbol"}
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            ) : (
              <Image placeholder='blur'
                src={aboutHero}
                alt="El Árbol — farm fresh produce"
                
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            )}
          </div>

        </div>
      </div>
    </section>
  )
}