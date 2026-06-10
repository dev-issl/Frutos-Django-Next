import * as LucideIcons from 'lucide-react';

export default function HowItWorksSection({ data = [], guarantee = null }) {
  const defaultData = [
    {
      id: 1,
      number: '1',
      title: 'Apply for an Account',
      body: 'Fill out our short application form with your business details.',
      icon_name: 'FileText'
    },
    {
      id: 2,
      number: '2',
      title: 'Get Approved',
      body: 'Our team will review your application within 24 hours.',
      icon_name: 'CheckSquare'
    },
    {
      id: 3,
      number: '3',
      title: 'Place Order',
      body: 'Access our wholesale catalog and place your first order.',
      icon_name: 'ShoppingCart'
    },
    {
      id: 4,
      number: '4',
      title: 'Receive Delivery',
      body: 'Get your fresh produce delivered within 48 hours.',
      icon_name: 'Truck'
    }
  ];

  const steps = data && data.length ? data : defaultData;

  const bar = guarantee ?? {
    title: 'No long-term commitment required',
    subtitle: 'Rolling monthly arrangement. Upgrade or pause anytime.',
    checks: [
      { id: 1, text: '48h setup' },
      { id: 2, text: 'Cancel anytime' },
      { id: 3, text: 'No setup fee' },
    ],
  }

  return (
    <>
      <style>{`
        .ws-steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0; position: relative;
        }
        .ws-step-connector {
          display: block; position: absolute; top: 36px;
          left: 12.5%; width: 75%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,105,76,0.18) 15%, rgba(0,105,76,0.18) 85%, transparent);
          z-index: 0;
        }
        .ws-step-item { padding: 0 16px 0; text-align: center; position: relative; z-index: 1; }
        .ws-step-circle {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px; position: relative; z-index: 1;
          transition: transform 0.2s;
        }
        .ws-step-circle:hover { transform: scale(1.05); }
        @media (max-width: 768px) {
          .ws-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 24px 12px; }
          .ws-step-connector { display: none; }
          .ws-step-item { padding: 0 8px; }
        }
        @media (max-width: 460px) {
          .ws-steps-grid { grid-template-columns: 1fr; gap: 20px; }
          .ws-step-item  { text-align: left; display: flex; gap: 16px; align-items: flex-start; }
          .ws-step-circle { margin: 0; width: 56px; height: 56px; flex-shrink: 0; }
          .ws-step-text  { text-align: left; }
        }
      `}</style>

      <section id="how-it-works" style={{ background: '#fff', padding: '56px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#00694c', display: 'block', marginBottom: '10px' }}>
              Simple process
            </span>
            <h2 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700, color: '#0d1f14', lineHeight: 1.18,
              marginBottom: '12px', fontSize: 'clamp(22px, 3vw, 36px)',
            }}>
              From application to first delivery<br />in under 48 hours.
            </h2>
            <p style={{ fontSize: '14px', color: '#6D7A73', maxWidth: '400px', margin: '0 auto', lineHeight: 1.72 }}>
              We keep onboarding simple so your kitchen doesn't skip a beat.
            </p>
          </div>

          {/* Steps */}
          <div className="ws-steps-grid">
            <div className="ws-step-connector" />
            {steps.map((s, i) => (
              <div key={s.id || i} className="ws-step-item">
                <div
                  className="ws-step-circle"
                  style={{
                    background: i === 0 ? '#00694c' : '#fff',
                    border:     i === 0 ? 'none'    : '1.5px solid rgba(0,105,76,0.2)',
                    color:      i === 0 ? '#fff'    : '#00694c',
                    boxShadow:  i === 0
                      ? '0 6px 20px rgba(0,105,76,0.28)'
                      : '0 2px 10px rgba(0,0,0,0.05)',
                  }}
                >
                  <span
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {(() => {
                      const Icon = LucideIcons[s.icon_name] || LucideIcons.Circle;
                      return <Icon size={24} strokeWidth={2} />;
                    })()}
                  </span>
                </div>
                <div className="ws-step-text">
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#00694c', marginBottom: '7px' }}>
                    STEP {s.number}
                  </span>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0d1f14', marginBottom: '8px', lineHeight: 1.35 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#6D7A73', lineHeight: 1.7, maxWidth: '200px', margin: '0 auto' }}>
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Guarantee bar */}
          <div style={{
            marginTop: '44px',
            background: 'linear-gradient(135deg, #071a10 0%, #0a2a1c 100%)',
            borderRadius: '14px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', minWidth: 0 }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(93,217,168,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" fill="none" stroke="#5dd9a8" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>
                  {bar.title}
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.5 }}>
                  {bar.subtitle}
                </p>
              </div>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0', width: '100%' }}
              className="guarantee-checks"
            >
              {(bar?.checks || []).map((c, index) => (
                <div key={c.id || index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="13" height="13" fill="none" stroke="#5dd9a8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                    {c.text}
                  </span>
                </div>
              ))}
            </div>

            <style>{`
              @media (min-width: 640px) {
                .guarantee-checks {
                  display: flex !important; width: auto !important; gap: 20px !important;
                  flex: 1 1 auto; justify-content: flex-end;
                }
              }
              @media (max-width: 639px) {
                .guarantee-checks {
                  grid-template-columns: repeat(3, 1fr) !important;
                  border-top: 1px solid rgba(255,255,255,0.08);
                  padding-top: 14px; margin-top: 4px;
                }
              }
            `}</style>
          </div>

        </div>
      </section>
    </>
  )
}