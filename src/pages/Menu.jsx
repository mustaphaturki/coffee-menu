import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cngjgwtnaoecuwgakrpj.supabase.co',
  'sb_publishable_4AchmnqFGUX3epT2torLPw_u-ij7hkP'
);

const ITEM_CATS  = ['Coffee', 'Drinks', 'Pastry', 'Dessert', 'Sweets', 'Chicha'];
const PACK_CATS  = ['Petit Déj', 'Lunch', 'Dinner', 'Other'];
const CAT_ICONS  = { Coffee: '☕', Drinks: '🧃', Pastry: '🥐', Dessert: '🍮', Sweets: '🍬', Chicha: '💨', 'Petit Déj': '🌅', Lunch: '🌞', Dinner: '🌙', Other: '🎁' };

/* ─── inject styles once ─────────────────────────────────── */
let _injected = false;
function injectMenuStyles() {
  if (_injected || document.getElementById('eryx-menu-styles')) return;
  _injected = true;
  const s = document.createElement('style');
  s.id = 'eryx-menu-styles';
  s.textContent = MENU_CSS;
  document.head.appendChild(s);
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */
const Menu = () => {
  const [theme,   setTheme]   = useState(() => localStorage.getItem('bb-theme') || 'light');
  const [items,   setItems]   = useState([]);
  const [packs,   setPacks]   = useState([]);
  const [itemCat,  setItemCat]  = useState('Coffee');
  const [packCat,  setPackCat]  = useState('Petit Déj');
  const [loading,  setLoading]  = useState(true);
  const [animKey,  setAnimKey]  = useState(0);

  useEffect(() => { injectMenuStyles(); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bb-theme', theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from('menu').select('*').order('created_at', { ascending: false }),
        supabase.from('packs').select('*').order('created_at', { ascending: false }),
      ]);
      setItems(m || []);
      setPacks(p || []);
      setLoading(false);
    })();
  }, []);

  const switchItemCat = (c) => { setItemCat(c); setAnimKey(k => k + 1); };
  const switchPackCat = (c) => { setPackCat(c); setAnimKey(k => k + 1); };

  const visItems = items.filter(i => i.category === itemCat);
  const visPacks = packs.filter(p => (p.pack_category || 'Other') === packCat);

  const itemCounts = Object.fromEntries(ITEM_CATS.map(c => [c, items.filter(i => i.category === c).length]));
  const packCounts = Object.fromEntries(PACK_CATS.map(c => [c, packs.filter(p => (p.pack_category || 'Other') === c).length]));

  return (
    <div className="mn-root" data-theme={theme}>

      {/* ── HERO ─────────────────────────────────── */}
      <header className="mn-hero">
        <div className="mn-hero-glow" aria-hidden />
        <div className="mn-hero-dots" aria-hidden />

        <button
          className="mn-theme-btn"
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="mn-hero-center">
          <div className="mn-hero-ring">
            <span className="mn-hero-cup">☕</span>
          </div>
          <h1 className="mn-hero-title">Eryx Coffee</h1>
          <p className="mn-hero-sub">Crafted with passion · Served with love</p>
        </div>

        {/* wave cut */}
        <svg className="mn-wave" viewBox="0 0 375 44" preserveAspectRatio="none" aria-hidden>
          <path d="M0,14 C60,44 160,0 250,28 C310,48 345,10 375,20 L375,44 L0,44 Z" fill="var(--page-bg)"/>
        </svg>
      </header>

      {/* ── DOUBLE STRIP ─────────────────────────── */}
      <div className="mn-strip-wrap">
        <div className="mn-strip-row mn-strip-divider">
          {ITEM_CATS.map(c => (
            <button key={c} className={`mn-pill${itemCat === c ? ' mn-pill-on' : ''}`} onClick={() => switchItemCat(c)}>
              <span className="mn-pill-icon">{CAT_ICONS[c]}</span>
              <span className="mn-pill-label">{c}</span>
              {itemCounts[c] > 0 && <span className="mn-pill-badge">{itemCounts[c]}</span>}
            </button>
          ))}
        </div>
        <div className="mn-strip-row">
          {PACK_CATS.map(c => (
            <button key={c} className={`mn-pill mn-pill-sm${packCat === c ? ' mn-pill-pack-on' : ''}`} onClick={() => switchPackCat(c)}>
              <span className="mn-pill-icon">{CAT_ICONS[c]}</span>
              <span className="mn-pill-label">{c}</span>
              {packCounts[c] > 0 && <span className="mn-pill-badge">{packCounts[c]}</span>}
            </button>
          ))}
        </div>
      </div>

      <main className="mn-main" key={animKey}>
        {loading ? (
          <SkeletonGrid />
        ) : (
          <>
            {/* Items */}
            {visItems.length === 0
              ? <EmptyState cat={itemCat} />
              : <div className="mn-grid">
                  {visItems.map((item, i) => <ItemCard key={item.id} item={item} idx={i} />)}
                </div>
            }

            {/* Packs */}
            <div className="mn-section-label" style={{ marginTop: 24 }}>
              <span>{CAT_ICONS[packCat]}</span> {packCat} Packs
            </div>
            {visPacks.length === 0
              ? <EmptyState cat={packCat} />
              : <div className="mn-packs">
                  {visPacks.map((pack, i) => <PackCard key={pack.id} pack={pack} items={items} idx={i} />)}
                </div>
            }
          </>
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="mn-footer">
        <div className="mn-footer-line" />
        <p>☕ Eryx Coffee — Thank you for visiting</p>
      </footer>
    </div>
  );
};

/* ─── ItemCard ───────────────────────────────────────────── */
const ItemCard = ({ item, idx }) => {
  const avail = item.available !== false;
  return (
    <div
      className={`mn-card${!avail ? ' mn-card-off' : ''}`}
      style={{ animationDelay: `${Math.min(idx * 0.07, 0.56)}s` }}
    >
      <div className="mn-card-img-wrap">
        <img
          src={item.image_url}
          alt={item.name}
          className="mn-card-img"
          loading="lazy"
        />
        <span className="mn-card-cat">
          {CAT_ICONS[item.category]}
        </span>
        {!avail && (
          <div className="mn-card-veil">
            <span className="mn-card-soldout">Sold Out</span>
          </div>
        )}
      </div>
      <div className="mn-card-body">
        <p className="mn-card-name">{item.name}</p>
        <p className="mn-card-price">
          {Number(item.price).toFixed(3)}
          <span className="mn-card-currency"> DT</span>
        </p>
      </div>
    </div>
  );
};

/* ─── PackCard ───────────────────────────────────────────── */
const PackCard = ({ pack, items, idx }) => {
  const avail  = pack.available !== false;
  const qty    = pack.item_quantities || {};
  const chips  = Object.entries(qty)
    .map(([id, q]) => ({ item: items.find(i => i.id === id), q }))
    .filter(({ item }) => item);

  return (
    <div
      className={`mn-pack${!avail ? ' mn-card-off' : ''}`}
      style={{ animationDelay: `${Math.min(idx * 0.07, 0.56)}s` }}
    >
      <div className="mn-pack-img-wrap">
        <img
          src={pack.image_url}
          alt={pack.name}
          className="mn-pack-img"
          loading="lazy"
        />
        {!avail && (
          <div className="mn-card-veil">
            <span className="mn-card-soldout">Sold Out</span>
          </div>
        )}
      </div>

      <div className="mn-pack-body">
        <span className="mn-pack-badge">🎁 Pack</span>
        <h3 className="mn-pack-name">{pack.name}</h3>
        {pack.description && (
          <p className="mn-pack-desc">{pack.description}</p>
        )}
        {chips.length > 0 && (
          <div className="mn-pack-chips">
            {chips.map(({ item, q }) => (
              <span key={item.id} className="mn-chip">
                {CAT_ICONS[item.category]} {item.name}{q > 1 ? ` ×${q}` : ''}
              </span>
            ))}
          </div>
        )}
        <p className="mn-pack-price">
          {Number(pack.price).toFixed(3)}
          <span className="mn-card-currency"> DT</span>
        </p>
      </div>
    </div>
  );
};

/* ─── Skeleton ───────────────────────────────────────────── */
const SkeletonGrid = () => (
  <div className="mn-grid">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="mn-skeleton" style={{ animationDelay: `${i * 0.09}s` }}>
        <div className="mn-sk-img shimmer" />
        <div className="mn-sk-body">
          <div className="mn-sk-line shimmer" style={{ width: '72%' }} />
          <div className="mn-sk-line shimmer" style={{ width: '42%', marginTop: 6 }} />
        </div>
      </div>
    ))}
  </div>
);

/* ─── Empty ──────────────────────────────────────────────── */
const EmptyState = ({ cat }) => (
  <div className="mn-empty">
    <span className="mn-empty-icon">{CAT_ICONS[cat] || '☕'}</span>
    <p>Nothing here yet</p>
  </div>
);

/* ════════════════════════════════════════════════════════════
   CSS  — uses same variables as App.css (already loaded globally)
════════════════════════════════════════════════════════════ */
const MENU_CSS = `
/* ── root ── */
.mn-root {
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background:
    radial-gradient(600px 300px at 80% 4%, var(--glow1) 0%, transparent 60%),
    radial-gradient(500px 250px at 10% 0%, var(--glow2) 0%, transparent 55%),
    var(--page-bg);
  color: var(--ink);
  font-family: 'Sora', sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.4s, color 0.4s;
  position: relative;
  overflow-x: hidden;
}

/* ── hero ── */
.mn-hero {
  position: relative;
  background: linear-gradient(170deg, var(--espresso) 0%, #0e0705 100%);
  padding: 52px 24px 56px;
  text-align: center;
  overflow: hidden;
}

.mn-hero-glow {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 260px 180px at 50% 60%, rgba(201,121,74,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 200px 140px at 15% 30%, rgba(47,122,90,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 180px 120px at 90% 20%, rgba(201,121,74,0.10) 0%, transparent 70%);
}

.mn-hero-dots {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 22px 22px;
  opacity: 0.6;
}

.mn-theme-btn {
  position: absolute; top: 18px; right: 18px;
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.16);
  font-size: 17px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, background 0.2s;
  z-index: 3;
}
.mn-theme-btn:hover { transform: scale(1.1) rotate(12deg); background: rgba(255,255,255,0.18); }

.mn-hero-center { position: relative; z-index: 2; }

.mn-hero-ring {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(201,121,74,0.18);
  border: 1.5px solid rgba(201,121,74,0.35);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
  box-shadow: 0 0 0 12px rgba(201,121,74,0.07);
  animation: mn-ring-pulse 3s ease-in-out infinite;
}
.mn-hero-cup { font-size: 32px; }

.mn-hero-title {
  font-family: 'Fraunces', serif;
  font-size: 38px;
  font-weight: 900;
  color: #f5e8d8;
  letter-spacing: 0.5px;
  line-height: 1;
  margin-bottom: 10px;
}

.mn-hero-sub {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(201,121,74,0.85);
}

.mn-wave {
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  width: 100%; height: 44px;
  z-index: 2;
}

/* ── strip ── */
.mn-strip-wrap {
  position: sticky; top: 0; z-index: 10;
  background: var(--search-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--card-border);
  padding: 10px 0 8px;
  transition: background 0.4s;
}

.mn-strip-row {
  display: flex; gap: 8px;
  padding: 0 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.mn-strip-row::-webkit-scrollbar { display: none; }
.mn-strip-divider { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--card-border); }

.mn-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--input-border);
  background: transparent;
  font-family: 'Sora', sans-serif;
  font-size: 13px; font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.22s;
  flex-shrink: 0;
}
.mn-pill:hover { border-color: var(--caramel); color: var(--espresso); }
.mn-pill-on {
  background: var(--caramel) !important;
  border-color: var(--caramel) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px var(--caramel-glow);
}

.mn-pill-sm { font-size: 12px; padding: 6px 12px; }

.mn-pill-pack-on {
  background: var(--matcha) !important;
  border-color: var(--matcha) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(47,122,90,0.3);
}

.mn-pill-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px;
  border-radius: 999px;
  background: rgba(255,255,255,0.25);
  font-size: 10px; font-weight: 700;
  padding: 0 4px;
}
.mn-pill:not(.mn-pill-on) .mn-pill-badge {
  background: var(--badge-bg);
  color: var(--badge-color);
}

/* ── main ── */
.mn-main {
  padding: 20px 16px 32px;
  min-height: 40vh;
}

/* ── items grid ── */
.mn-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 8px;
}

/* ── item card ── */
.mn-card {
  background: var(--card);
  border-radius: 20px;
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.22s, box-shadow 0.22s, background 0.4s;
  animation: mn-fade-up 0.45s ease both;
}
.mn-card:active { transform: scale(0.97); }
.mn-card-off { opacity: 0.62; filter: grayscale(0.3); }

.mn-card-img-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--oat);
}
.mn-card-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
  display: block;
}
.mn-card:hover .mn-card-img { transform: scale(1.04); }

.mn-card-cat {
  position: absolute; top: 8px; left: 8px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.15);
}

.mn-card-veil {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
}
.mn-card-soldout {
  background: rgba(255,255,255,0.14);
  border: 1.5px solid rgba(255,255,255,0.35);
  color: #fff;
  font-size: 11px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  padding: 5px 12px; border-radius: 999px;
}

.mn-card-body {
  padding: 10px 12px 12px;
}
.mn-card-name {
  font-size: 13px; font-weight: 600;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px;
}
.mn-card-price {
  font-family: 'Fraunces', serif;
  font-size: 17px; font-weight: 700;
  color: var(--caramel);
  line-height: 1;
}
.mn-card-currency {
  font-family: 'Sora', sans-serif;
  font-size: 10px; font-weight: 600;
  color: var(--muted);
  vertical-align: top; margin-top: 3px;
  display: inline-block;
}

/* ── section label ── */
.mn-section-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700;
  color: var(--muted);
  text-transform: uppercase; letter-spacing: 2px;
  padding: 12px 0 14px;
}
.mn-section-label::before,
.mn-section-label::after {
  content: '';
  flex: 1; height: 1px;
  background: var(--card-border);
}

/* ── packs ── */
.mn-packs {
  display: flex; flex-direction: column; gap: 14px;
  margin-top: 8px;
}

.mn-pack {
  display: flex; gap: 0;
  background: var(--card);
  border-radius: 20px;
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.22s, box-shadow 0.22s, background 0.4s;
  animation: mn-fade-up 0.45s ease both;
}
.mn-pack:active { transform: scale(0.98); }

.mn-pack-img-wrap {
  position: relative;
  width: 110px; min-width: 110px;
  aspect-ratio: 1 / 1;
  background: var(--oat);
  overflow: hidden;
  flex-shrink: 0;
  align-self: stretch;
}
.mn-pack-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.mn-pack:hover .mn-pack-img { transform: scale(1.05); }

.mn-pack-body {
  flex: 1; min-width: 0;
  padding: 14px 14px 14px 16px;
  display: flex; flex-direction: column; gap: 5px;
  justify-content: center;
}

.mn-pack-badge {
  display: inline-block;
  background: rgba(47,122,90,0.14);
  color: var(--matcha);
  font-size: 10px; font-weight: 700;
  letter-spacing: 1px; text-transform: uppercase;
  padding: 3px 10px; border-radius: 999px;
  align-self: flex-start;
  margin-bottom: 2px;
}

.mn-pack-name {
  font-family: 'Fraunces', serif;
  font-size: 18px; font-weight: 700;
  color: var(--espresso);
  line-height: 1.15;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.mn-pack-desc {
  font-size: 12px; color: var(--muted);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.mn-pack-chips {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.mn-chip {
  font-size: 11px; font-weight: 600;
  background: var(--chip-bg);
  color: var(--chip-color);
  padding: 2px 8px; border-radius: 999px;
  white-space: nowrap;
}

.mn-pack-price {
  font-family: 'Fraunces', serif;
  font-size: 19px; font-weight: 700;
  color: var(--caramel);
  line-height: 1;
  margin-top: 4px;
}

/* ── skeleton ── */
.mn-skeleton {
  border-radius: 20px; overflow: hidden;
  border: 1px solid var(--card-border);
  background: var(--card);
  animation: mn-fade-up 0.45s ease both;
}
.mn-sk-img {
  aspect-ratio: 1 / 1; width: 100%;
  border-radius: 0;
}
.mn-sk-body { padding: 10px 12px 14px; }
.mn-sk-line {
  height: 12px; border-radius: 6px;
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--empty-bg) 25%,
    var(--card-border) 50%,
    var(--empty-bg) 75%
  );
  background-size: 200% 100%;
  animation: shimmer-wave 1.5s infinite;
}

/* ── empty ── */
.mn-empty {
  padding: 60px 24px;
  text-align: center;
  color: var(--muted);
  font-weight: 600; font-size: 15px;
}
.mn-empty-icon {
  font-size: 40px; opacity: 0.4;
  display: block; margin-bottom: 12px;
}

/* ── footer ── */
.mn-footer {
  padding: 24px 24px 40px;
  text-align: center;
}
.mn-footer-line {
  width: 48px; height: 2px;
  background: linear-gradient(90deg, var(--caramel), var(--matcha));
  border-radius: 2px; margin: 0 auto 16px;
  opacity: 0.5;
}
.mn-footer p {
  font-size: 12px; font-weight: 600;
  color: var(--muted);
  letter-spacing: 1.5px; text-transform: uppercase;
}

/* ── keyframes ── */
@keyframes mn-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes mn-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 12px rgba(201,121,74,0.07); }
  50%       { box-shadow: 0 0 0 20px rgba(201,121,74,0.02); }
}
@keyframes shimmer-wave {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

export default Menu;
