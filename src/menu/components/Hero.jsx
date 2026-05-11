const Hero = ({ theme, onToggleTheme }) => (
  <header className="mn-hero">
    <div className="mn-hero-glow" aria-hidden />
    <div className="mn-hero-dots" aria-hidden />

    <button className="mn-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>

    <div className="mn-hero-center">
      <div className="mn-hero-ring">
        <img src="/logo.png" alt="Eryx Coffee" className="mn-hero-logo" />
      </div>
      <h1 className="mn-hero-title">Eryx Coffee</h1>
      <p className="mn-hero-sub">Crafted with passion · Served with love</p>
    </div>

    <svg className="mn-wave" viewBox="0 0 375 44" preserveAspectRatio="none" aria-hidden>
      <path d="M0,14 C60,44 160,0 250,28 C310,48 345,10 375,20 L375,44 L0,44 Z" fill="var(--page-bg)" />
    </svg>
  </header>
)

export default Hero
