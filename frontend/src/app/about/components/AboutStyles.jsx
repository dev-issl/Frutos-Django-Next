export default function AboutStyles() {
  return (
    <style>{`
      .about-page-canvas {
        background-color: #F2F5EC;
        background-image:
          radial-gradient(ellipse 90% 420px at 10% 0%, rgba(255, 255, 255, 0.72), transparent 70%),
          radial-gradient(ellipse 75% 420px at 50% 34%, rgba(231, 241, 224, 0.8), transparent 72%);
        color: #123B29;
      }
      .about-eyebrow-rule {
        height: 1px;
        flex: 1 1 0%;
        max-width: 110px;
        background: linear-gradient(90deg, rgba(114, 141, 121, 0), rgba(114, 141, 121, 0.35));
      }
      .about-eyebrow-rule-right {
        height: 1px;
        flex: 1 1 0%;
        max-width: 110px;
        background: linear-gradient(90deg, rgba(114, 141, 121, 0.35), rgba(114, 141, 121, 0));
      }
    `}</style>
  )
}
