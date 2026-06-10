export default function TeamSection({ team }) {
  return (
    <section className="about-section-pad-white">
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#00694c', display: 'block', marginBottom: '10px' }}>
            The people behind it
          </span>
          <h2 className="about-h2" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: '#151e13', lineHeight: 1.2 }}>
            Meet the team
          </h2>
        </div>
        <div className="about-team-grid">
          {team.map((t, i) => (
            <div key={i} style={{
              background: '#f2fdea', borderRadius: '16px', padding: '24px 16px',
              textAlign: 'center', border: '1px solid rgba(188,202,193,0.2)',
            }}>
              {t.image_url ? (
                <img 
                  src={t.image_url} 
                  alt={t.name} 
                  style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    objectFit: 'cover', margin: '0 auto 14px',
                    border: '1px solid rgba(188,202,193,0.4)',
                  }}
                />
              ) : (
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: '#adedd8', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 14px',
                }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#085041' }}>{t.initials}</span>
                </div>
              )}
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#151e13', marginBottom: '4px' }}>{t.name}</h3>
              <p style={{ fontSize: '11px', color: '#00694c', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>{t.role}</p>
              <p style={{ fontSize: '11px', color: '#9aada3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {t.origin}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}