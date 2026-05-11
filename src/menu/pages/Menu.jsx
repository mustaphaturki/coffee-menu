import { useState, useEffect, useMemo } from 'react'
import { useMenuData } from '../hooks/useMenuData'
import Hero from '../components/Hero'
import CategoryStrip from '../components/CategoryStrip'
import ItemCard from '../components/ItemCard'
import PackCard from '../components/PackCard'
import Skeleton from '../components/Skeleton'
import '../styles/menu.css'

const PACK_CATEGORIES = [
  { name: 'Petit Déj', icon: '🌅' },
  { name: 'Lunch',     icon: '🌞' },
  { name: 'Dinner',    icon: '🌙' },
  { name: 'Other',     icon: '🎁' },
]

const Menu = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('bb-theme') || 'light')
  const { categories, items, packs, loading } = useMenuData()

  // ── Selection state ──────────────────────────────────
  const [selectedCategoryId,    setSelectedCategoryId]    = useState(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null)
  const [selectedPackCat,       setSelectedPackCat]       = useState(null)
  const [view,                  setView]                   = useState('items') // 'items' | 'packs'
  const [animKey,               setAnimKey]               = useState(0)

  // ── Theme ────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bb-theme', theme)
  }, [theme])

  // ── Auto-select first category on load ───────────────
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const first = categories[0]
      setSelectedCategoryId(first.id)
      const firstSub = first.subcategories?.[0]
      if (firstSub) setSelectedSubcategoryId(firstSub.id)
    }
  }, [categories])

  // ── When category changes, auto-select first sub ─────
  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId)
    setView('items')
    const cat    = categories.find(c => c.id === catId)
    const firstSub = cat?.subcategories?.find(s => s.is_active !== false)
    setSelectedSubcategoryId(firstSub?.id || null)
    setAnimKey(k => k + 1)
  }

  const handleSelectSubcategory = (subId) => {
    setSelectedSubcategoryId(subId)
    setView('items')
    setAnimKey(k => k + 1)
  }

  const handleSelectPackCat = (name) => {
    setSelectedPackCat(name)
    setView('packs')
    setAnimKey(k => k + 1)
  }

  // ── Derived data ─────────────────────────────────────
  const itemCountBySubcategory = useMemo(() => {
    const map = {}
    items.forEach(item => {
      const sid = item.subcategory_id
      map[sid] = (map[sid] || 0) + 1
    })
    return map
  }, [items])

  const visibleItems = useMemo(() => {
    if (!selectedSubcategoryId) return []
    return items.filter(i => i.subcategory_id === selectedSubcategoryId)
  }, [items, selectedSubcategoryId])

  const visiblePacks = useMemo(() => {
    if (!selectedPackCat) return packs
    return packs.filter(p => (p.pack_category || 'Other') === selectedPackCat)
  }, [packs, selectedPackCat])

  // Active subcategory label
  const activeCategory = categories.find(c => c.id === selectedCategoryId)
  const activeSub      = activeCategory?.subcategories?.find(s => s.id === selectedSubcategoryId)

  // Pack categories that actually have packs
  const activePacks = useMemo(() => {
    return PACK_CATEGORIES.filter(pc =>
      packs.some(p => (p.pack_category || 'Other') === pc.name)
    )
  }, [packs])

  return (
    <div className="mn-root" data-theme={theme}>

      <Hero theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />

      <CategoryStrip
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onSelectCategory={handleSelectCategory}
        onSelectSubcategory={handleSelectSubcategory}
        itemCountBySubcategory={itemCountBySubcategory}
      />

      {/* ── Packs strip (below main strip) ── */}
      {activePacks.length > 0 && (
        <div style={{ padding: '10px 16px 0', borderBottom: '1px solid var(--card-border)' }}>
          <div className="mn-strip-row" style={{ paddingBottom: 10, paddingLeft: 0 }}>
            {activePacks.map(pc => (
              <button
                key={pc.name}
                className={`mn-pill mn-pill-sm${selectedPackCat === pc.name && view === 'packs' ? ' mn-pill-on' : ''}`}
                style={selectedPackCat === pc.name && view === 'packs'
                  ? { background: 'var(--matcha)', borderColor: 'var(--matcha)', boxShadow: '0 4px 14px rgba(47,122,90,0.3)' }
                  : {}
                }
                onClick={() => handleSelectPackCat(pc.name)}
              >
                {pc.icon} {pc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="mn-main" key={animKey}>
        {loading ? (
          <Skeleton />
        ) : view === 'items' ? (
          <>
            {activeSub && (
              <div className="mn-section-label">
                {activeSub.icon} {activeSub.name}
              </div>
            )}
            {visibleItems.length === 0 ? (
              <div className="mn-empty">
                <span className="mn-empty-icon">{activeCategory?.icon || '☕'}</span>
                <p>Nothing here yet</p>
              </div>
            ) : (
              <div className="mn-grid">
                {visibleItems.map((item, i) => (
                  <ItemCard key={item.id} item={item} idx={i} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mn-section-label">
              {PACK_CATEGORIES.find(pc => pc.name === selectedPackCat)?.icon} {selectedPackCat} Packs
            </div>
            {visiblePacks.length === 0 ? (
              <div className="mn-empty">
                <span className="mn-empty-icon">🎁</span>
                <p>No packs available</p>
              </div>
            ) : (
              <div className="mn-packs">
                {visiblePacks.map((pack, i) => (
                  <PackCard key={pack.id} pack={pack} idx={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mn-footer">
        <div className="mn-footer-line" />
        <p>☕ Eryx Coffee — Thank you for visiting</p>
      </footer>
    </div>
  )
}

export default Menu
