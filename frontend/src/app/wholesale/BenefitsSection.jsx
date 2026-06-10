import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function BenefitsSection({ data = [] }) {
  // Safe default if data is empty
  const benefits = data.length > 0 ? data : [
    {
      icon_name: 'Leaf',
      title: 'Guaranteed Freshness',
      body: 'Every order is harvested within 24 hours of dispatch. Our cold-chain logistics deliver produce at peak quality — every single time.',
    },
    {
      icon_name: 'Clock',
      title: 'Flexible Ordering Windows',
      body: 'Order daily, weekly, or on a custom schedule. Cut-off is 10 PM for next-morning delivery across Madrid, Barcelona, and Sevilla.',
    },
    {
      icon_name: 'UserCheck',
      title: 'Dedicated Account Manager',
      body: 'Every wholesale account gets a named contact who knows your kitchen, your seasonal needs, and is reachable directly — no call centres.',
    },
    {
      icon_name: 'TrendingDown',
      title: 'Transparent Volume Pricing',
      body: 'Pricing tiers based on monthly volume — the more you order, the better the rate. No hidden surcharges, no seasonal price shocks.',
    },
    {
      icon_name: 'Sun',
      title: 'Sustainability Credentials',
      body: 'All partner farms hold regenerative agriculture certification. Full traceability documentation for menu provenance and ESG reporting.',
    },
    {
      icon_name: 'Truck',
      title: 'Nationwide Cold-Chain Delivery',
      body: 'Refrigerated fleet covering all major Spanish cities. Temperature-monitored throughout, with live tracking on Growth and Enterprise plans.',
    },
  ];
  return (
    <>
      <style>{`
        .ws-benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .ws-benefit-card {
          background: #F7FAF8;
          border-radius: 14px;
          padding: 22px 20px;
          border: 1px solid rgba(188,202,193,0.3);
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          cursor: default;
        }
        .ws-benefit-card:hover {
          box-shadow: 0 6px 24px rgba(0,105,76,0.07);
          transform: translateY(-2px);
          border-color: rgba(0,105,76,0.18);
        }
        @media (max-width: 900px) {
          .ws-benefits-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .ws-benefits-grid { grid-template-columns: 1fr; gap: 10px; }
        }
      `}</style>

      <section style={{ background: '#fff', padding: '56px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          <div style={{ maxWidth: '520px', marginBottom: '40px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#00694c', display: 'block', marginBottom: '10px' }}>
              Why partner with us
            </span>
            <h2 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700, color: '#0d1f14', lineHeight: 1.18,
              marginBottom: '12px', fontSize: 'clamp(22px, 3vw, 34px)',
            }}>
              Everything your operation needs, nothing it doesn't.
            </h2>
            {/* <p style={{ fontSize: '14px', color: '#6D7A73', lineHeight: 1.75, margin: 0 }}>
              We built our wholesale programme by listening to chefs and buyers. Every feature exists because someone asked for it.
            </p> */}
          </div>

          <div className="ws-benefits-grid">
            {benefits.map((b, i) => (
              <div key={i} className="ws-benefit-card">
                <div style={{
                  width: '42px', height: '42px', borderRadius: '11px',
                  background: 'linear-gradient(135deg, #E7F5EB 0%, #D8EEE2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px', border: '1px solid rgba(0,105,76,0.08)',
                  color: '#00694c'
                }}>
                  {(() => {
                    const Icon = LucideIcons[b.icon_name] || LucideIcons.Circle;
                    return <Icon size={20} strokeWidth={1.7} />;
                  })()}
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0d1f14', marginBottom: '7px', lineHeight: 1.35 }}>
                  {b.title}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#6D7A73', lineHeight: 1.7, margin: 0 }}>{b.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  )
}