import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function StatesSection({ data = [] }) {
  // Safe default if data is empty
  const stats = data.length > 0 ? data : [
    { value: '200+', label: 'Business Partners', sub: 'Restaurants, hotels & retailers', icon_name: 'Building2' },
    { value: '48h', label: 'Max Delivery Window', sub: 'Farm to kitchen, guaranteed', icon_name: 'Truck' },
    { value: '40+', label: 'Farm Sources', sub: 'Spain & southern Europe', icon_name: 'Tractor' },
    { value: '99.1%', label: 'On-time Delivery', sub: 'Rolling 12-month average', icon_name: 'CheckCircle2' },
  ];
  return (
    <>
      <style>{`
        .ws-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .ws-stat-cell {
          padding: 28px 28px;
          border-left: 1px solid rgba(255,255,255,0.06);
        }
        .ws-stat-cell:first-child { border-left: none; }
        @media (max-width: 768px) {
          .ws-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ws-stat-cell:nth-child(3) { border-left: none; }
          .ws-stat-cell { padding: 24px 20px; }
        }
        @media (max-width: 400px) {
          .ws-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ws-stat-cell { padding: 20px 16px; }
        }
      `}</style>

      <section style={{ background: '#071a10', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px' }}>
          <div className="ws-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="ws-stat-cell">
                <div style={{
                  width: '32px', height: '32px', borderRadius: '9px',
                  background: 'rgba(0,105,76,0.22)', border: '1px solid rgba(0,150,100,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                  color: 'rgba(93,217,168,0.85)'
                }}>
                  {(() => {
                    const Icon = LucideIcons[s.icon_name] || LucideIcons.Circle;
                    return <Icon size={18} strokeWidth={1.6} />;
                  })()}
                </div>
                <p style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 700,
                  color: '#5dd9a8', lineHeight: 1, margin: '0 0 5px',
                }}>
                  {s.value}
                </p>
                <p style={{ fontSize: '12.5px', color: '#fff', fontWeight: 600, margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)', margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}