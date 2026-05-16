import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../../shared/lib/supabase'
import { useCategories } from '../hooks/useCategories'
import { useItems } from '../hooks/useItems'
import { usePacks } from '../hooks/usePacks'
import StatBar from '../components/StatBar'
import CategoryStudio from '../components/CategoryStudio'
import ItemForm from '../components/ItemForm'
import ItemList from '../components/ItemList'
import PackForm from '../components/PackForm'
import PackList from '../components/PackList'
import QRPanel from '../components/QRPanel'

let toastTimer

const AdminDashboard = () => {
  const [theme, setTheme]             = useState(() => localStorage.getItem('bb-theme') || 'light')
  const [view, setView]               = useState('management') // 'categories' | 'management' | 'qr'
  const [tab, setTab]                 = useState('items')      // 'items' | 'packs'
  const [toast, setToast]             = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingPack, setEditingPack] = useState(null)

  const cats  = useCategories()
  const items = useItems()
  const packs = usePacks()

  // ── Theme ────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bb-theme', theme)
  }, [theme])

  // ── Initial load ─────────────────────────────────────
  useEffect(() => {
    cats.fetchCategories()
    items.fetchItems()
    packs.fetchPacks()
  }, [])

  // ── Toast ────────────────────────────────────────────
  const showToast = (msg) => {
    clearTimeout(toastTimer)
    setToast(msg)
    toastTimer = setTimeout(() => setToast(null), 3400)
  }

  // ── Stats ────────────────────────────────────────────
  const counts = useMemo(() => ({
  totalItems: items.items.length,
  inStock:    items.items.filter(i => i.available !== false).length,
  packs:      packs.packs.length,
  categories: cats.categories.length,
}), [items.items, packs.packs, cats.categories])

  // ── Item handlers ────────────────────────────────────
  const handleSubmitItem = async (payload) => {
    if (editingItem) {
      await items.updateItem(editingItem.id, payload)
      showToast('✏️ Item updated!')
    } else {
      await items.addItem(payload)
      showToast('☕ Item added!')
    }
    setEditingItem(null)
    const latest = await items.fetchItems()
    await packs.syncAvailability(latest)
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Remove this item?')) return
    try {
      const latest = await items.deleteItem(id)
      await packs.syncAvailability(latest)
      showToast('Item removed.')
    } catch { showToast('❌ Error deleting item.') }
  }

  const handleToggleItem = async (id, current) => {
    try {
      const latest = await items.toggleAvailability(id, current)
      await packs.syncAvailability(latest)
    } catch { showToast('❌ Error updating status.') }
  }

  // ── Pack handlers ────────────────────────────────────
  const handleSubmitPack = async (payload) => {
    if (editingPack) {
      await packs.updatePack(editingPack.id, payload)
      showToast('✏️ Pack updated!')
    } else {
      await packs.addPack(payload)
      showToast('🎁 Pack created!')
    }
    setEditingPack(null)
  }

  const handleDeletePack = async (id) => {
    if (!window.confirm('Delete this pack?')) return
    try {
      await packs.deletePack(id)
      showToast('Pack removed.')
    } catch { showToast('❌ Error deleting pack.') }
  }

  return (
    <div className="app-root" data-theme={theme}>
      <div className="admin-container admin-shell">

        {/* ── Header ── */}
<header className="admin-header">
  <div className="logo-area">
    <h1 className="admin-logo">Eryx Coffee</h1>
  </div>
  <div className="header-right">
    <div className="status-indicator">
      <span className="status-dot" /> Live
    </div>
    <button
      className="theme-btn"
      type="button"
      onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
    <button
      className="btn-cancel"
      type="button"
      onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
    >
      Sign Out
    </button>
  </div>
</header>

        {/* ── Stats ── */}
        <StatBar counts={counts} />

        {/* ── Workspace ── */}
        <div className="workspace-shell">
          <div className="tabs workspace-tabs">
            <button type="button" className={`tab-btn${view === 'categories'  ? ' tab-active' : ''}`} onClick={() => setView('categories')}>
              Categories
            </button>
            <button type="button" className={`tab-btn${view === 'management'  ? ' tab-active' : ''}`} onClick={() => setView('management')}>
              Menu
            </button>
            <button type="button" className={`tab-btn${view === 'qr'          ? ' tab-active' : ''}`} onClick={() => setView('qr')}>
              QR Code 
            </button>
          </div>

          {/* ── Category Studio ── */}
          {view === 'categories' && (
            <CategoryStudio
              categories={cats.categories}
              onAddCategory={cats.addCategory}
              onUpdateCategory={cats.updateCategory}
              onDeleteCategory={cats.deleteCategory}
              onToggleCategory={cats.toggleCategory}
              onAddSubcategory={cats.addSubcategory}
              onUpdateSubcategory={cats.updateSubcategory}
              onDeleteSubcategory={cats.deleteSubcategory}
              onToggleSubcategory={cats.toggleSubcategory}
              showToast={showToast}
            />
          )}

          {/* ── Items / Packs ── */}
          {view === 'management' && (
            <>
              <div className="tabs">
                <button type="button" className={`tab-btn${tab === 'items' ? ' tab-active' : ''}`} onClick={() => setTab('items')}>
                  ☕ Menu Items
                </button>
                <button type="button" className={`tab-btn${tab === 'packs' ? ' tab-active' : ''}`} onClick={() => setTab('packs')}>
                  🎁 Packs &amp; Combos
                </button>
              </div>

              {tab === 'items' && (
                <div className="admin-main">
                  <ItemForm
                    categories={cats.categories}
                    editingItem={editingItem}
                    onSubmit={handleSubmitItem}
                    onCancel={() => setEditingItem(null)}
                    showToast={showToast}
                  />
                  <ItemList
                    items={items.items}
                    categories={cats.categories}
                    loading={items.loading}
                    editingItem={editingItem}
                    onEdit={(item) => { setEditingItem(item); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    onDelete={handleDeleteItem}
                    onToggle={handleToggleItem}
                  />
                </div>
              )}

              {tab === 'packs' && (
                <div className="admin-main">
                  <PackForm
                    items={items.items}
                    editingPack={editingPack}
                    onSubmit={handleSubmitPack}
                    onCancel={() => setEditingPack(null)}
                    showToast={showToast}
                  />
                  <PackList
                    packs={packs.packs}
                    loading={packs.loading}
                    editingPack={editingPack}
                    onEdit={(pack) => { setEditingPack(pack); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    onDelete={handleDeletePack}
                  />
                </div>
              )}
            </>
          )}

          {/* ── QR Code ── */}
          {view === 'qr' && <QRPanel showToast={showToast} />}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default AdminDashboard
