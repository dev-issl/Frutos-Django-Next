export default function WholesaleStyles() {
  return (
    <style>{`
      .ws-page-canvas {
        background-color: #F4F5EC;
        background-image:
          radial-gradient(ellipse 90% 420px at 8% 0%, rgba(255, 255, 250, 0.78), transparent 72%),
          radial-gradient(ellipse 75% 360px at 55% 44%, rgba(232, 241, 225, 0.65), transparent 75%);
        color: #123B29;
      }
      .ws-eyebrow-rule {
        height: 1px;
        flex: 1 1 0%;
        max-width: 72px;
        background: linear-gradient(90deg, rgba(114, 141, 121, 0), rgba(114, 141, 121, 0.35));
      }
      .ws-eyebrow-rule-right {
        height: 1px;
        flex: 1 1 0%;
        max-width: 72px;
        background: linear-gradient(90deg, rgba(114, 141, 121, 0.35), rgba(114, 141, 121, 0));
      }
      .ws-stats-shadow {
        box-shadow: 0 14px 32px -6px rgba(9, 58, 36, 0.22);
      }
      .ws-card-shadow {
        box-shadow: 0 6px 20px -4px rgba(24, 52, 34, 0.08), 0 1px 4px rgba(24, 52, 34, 0.03);
      }
    `}</style>
  )
}
