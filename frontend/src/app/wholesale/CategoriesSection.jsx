import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function CategoriesSection({ data = [] }) {
  // Safe default if data is empty
  const categories = data.length > 0 ? data : [
    {
      icon_name: 'Carrot',
      title: 'Fresh Vegetables',
      items: 'Heirloom tomatoes, peppers, courgettes, aubergines, leafy greens, brassicas',
      badge: 'Year-round',
      badge_bg_color: '#E7F1DF',
      badge_text_color: '#00694c',
      icon_bg_color: '#EDFAF2',
    },
    {
      icon_name: 'Apple',
      title: 'Seasonal Fruits',
      items: 'Stone fruit, berries, figs, pears, melons — sourced at peak ripeness per season',
      badge: 'Seasonal',
      badge_bg_color: '#FEF3C7',
      badge_text_color: '#92400e',
      icon_bg_color: '#FFF7ED',
    },
    {
      icon_name: 'Sprout',
      title: 'Fresh Herbs & Microgreens',
      items: 'Basil, thyme, rosemary, tarragon, chives, coriander, edible flowers, micro shoots',
      badge: 'Year-round',
      badge_bg_color: '#E7F1DF',
      badge_text_color: '#00694c',
      icon_bg_color: '#F0FDF4',
    },
    {
      icon_name: 'Sun',
      title: 'Citrus & Tropical',
      items: 'Valencia oranges, Eureka lemons, limes, grapefruits, pomelos, blood oranges',
      badge: 'Year-round',
      badge_bg_color: '#FEF3C7',
      badge_text_color: '#92400e',
      icon_bg_color: '#FFFBEB',
    },
    {
      icon_name: 'Tractor',
      title: 'Root & Allium',
      items: 'Carrots, beetroot, celeriac, parsnips, turnips, garlic varieties, shallots, onions',
      badge: 'Year-round',
      badge_bg_color: '#E7F1DF',
      badge_text_color: '#00694c',
      icon_bg_color: '#FDF4E7',
    },
    {
      icon_name: 'Star',
      title: 'Specialty & Heirloom',
      items: 'Rare varietals, wild-harvested items, foraged mushrooms, edible flowers, truffle products',
      badge: 'Limited',
      badge_bg_color: '#EDE9FE',
      badge_text_color: '#5b21b6',
      icon_bg_color: '#F5F3FF',
    },
  ];
  return (
    <>
      <style>{`
        .cat-section {
          background: #F7FAF8;
          padding: 64px 40px;
        }
        .cat-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .cat-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 36px;
        }
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .cat-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px 18px;
          border: 1px solid rgba(188,202,193,0.3);
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cat-card:hover {
          box-shadow: 0 6px 24px rgba(0,105,76,0.08);
          transform: translateY(-2px);
        }
        .cat-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .cat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.04);
          flex-shrink: 0;
        }
        .cat-badge {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 100px;
          padding: 3px 9px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .cat-title {
          font-size: 13px;
          font-weight: 700;
          color: #0d1f14;
          line-height: 1.35;
          margin: 0;
        }
        .cat-items {
          font-size: 11.5px;
          color: #9aada3;
          line-height: 1.7;
          font-style: italic;
          font-family: 'Newsreader', Georgia, serif;
          margin: 0;
        }
        .cat-footer {
          margin-top: 20px;
          display: flex;
          align-items: flex-start;
          gap: 7px;
        }
        .cat-footer-text {
          font-size: 11.5px;
          color: #9aada3;
          margin: 0;
          line-height: 1.6;
        }

        /* Tablet: 2 columns */
        @media (max-width: 960px) {
          .cat-section { padding: 48px 24px; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }

        /* Mobile large: 2 columns tighter */
        @media (max-width: 640px) {
          .cat-section { padding: 40px 16px; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .cat-card { padding: 14px 13px; gap: 8px; border-radius: 12px; }
          .cat-icon-wrap { width: 34px; height: 34px; border-radius: 8px; }
          .cat-title { font-size: 12px; }
          .cat-items { font-size: 11px; }
          .cat-badge { font-size: 9px; padding: 2px 7px; }
          .cat-header { margin-bottom: 24px; }
        }

        /* Mobile small: 1 column */
        @media (max-width: 380px) {
          .cat-grid { grid-template-columns: 1fr; gap: 8px; }
          .cat-card { padding: 14px; flex-direction: column; }
        }
      `}</style>

      <section className="cat-section">
        <div className="cat-inner">

          <div className="cat-header">
            <div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#00694c',
                display: 'block',
                marginBottom: '8px',
              }}>
                Product Range
              </span>
              <h2 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                color: '#0d1f14',
                lineHeight: 1.2,
                margin: 0,
                fontSize: 'clamp(22px, 3vw, 34px)',
              }}>
                What we supply
              </h2>
            </div>
          </div>

          <div className="cat-grid">
            {categories.map((c, i) => (
              <div key={i} className="cat-card">
                <div className="cat-card-top">
                  <div className="cat-icon-wrap" style={{ background: c.icon_bg_color, color: c.badge_text_color }}>
                    {(() => {
                      const Icon = LucideIcons[c.icon_name] || LucideIcons.Circle;
                      return <Icon size={18} strokeWidth={1.6} />;
                    })()}
                  </div>
                  <span
                    className="cat-badge"
                    style={{ background: c.badge_bg_color, color: c.badge_text_color }}
                  >
                    {c.badge}
                  </span>
                </div>
                <h3 className="cat-title">{c.title}</h3>
                <p className="cat-items">{c.items}</p>
              </div>
            ))}
          </div>

          <div className="cat-footer">
            <svg width="13" height="13" fill="none" stroke="#9aada3" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="cat-footer-text">
              Availability varies by season. Custom sourcing requests welcomed for approved accounts.
            </p>
          </div>

        </div>
      </section>
    </>
  )
}