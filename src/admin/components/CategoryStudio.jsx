import { useState } from 'react'
import { ICON_CHOICES } from '../../shared/lib/constants'

const CategoryStudio = ({
  categories,
  onAddCategory, onUpdateCategory, onDeleteCategory, onToggleCategory,
  onAddSubcategory, onUpdateSubcategory, onDeleteSubcategory, onToggleSubcategory,
  showToast,
}) => {
  const [mode, setMode] = useState('category') // 'category' | 'subcategory'
  const [editing, setEditing] = useState(null)  // { type: 'category'|'subcategory', data }
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [parentId, setParentId] = useState(null)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())

  const reset = () => {
    setEditing(null)
    setName('')
    setIcon('')
    setParentId(null)
    setIconPickerOpen(false)
  }

  const startEdit = (type, data) => {
    setEditing({ type, data })
    setMode(type)
    setName(data.name)
    setIcon(data.icon || '')
    if (type === 'subcategory') setParentId(data.category_id)
    setIconPickerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const linkedItemCount = (cat) =>
    (cat.subcategories || []).reduce((sum, sub) => sum + (sub._itemCount || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { showToast('⚠️ Enter a name.'); return }
    if (mode === 'subcategory' && !parentId) { showToast('⚠️ Pick a category first.'); return }

    setBusy(true)
    try {
      if (editing) {
        if (editing.type === 'category') {
          await onUpdateCategory(editing.data.id, { name, icon })
        } else {
          await onUpdateSubcategory(editing.data.id, { name, icon })
        }
        showToast('✅ Updated.')
      } else {
        if (mode === 'category') {
          await onAddCategory({ name, icon })
        } else {
          await onAddSubcategory({ category_id: parentId, name, icon })
          setExpandedIds(prev => new Set([...prev, parentId]))
        }
        showToast('✅ Created.')
      }
      reset()
    } catch (err) {
      showToast('❌ ' + (err.message || 'Error.'))
    }
    setBusy(false)
  }

  const handleDelete = async (type, entry) => {
    const label = type === 'category' ? 'category and all its subcategories' : 'subcategory'
    if (!window.confirm(`Delete "${entry.name}"? This will remove the ${label}.`)) return
    try {
      if (type === 'category') await onDeleteCategory(entry.id)
      else await onDeleteSubcategory(entry.id)
      showToast('Deleted.')
    } catch (err) {
      showToast('❌ ' + (err.message || 'Error.'))
    }
  }

  const activeMode = editing?.type || mode

  return (
    <section className="studio-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Category Studio</h2>
          <p className="panel-subtitle">Manage categories and their subcategories.</p>
        </div>
        <div className="panel-badge">{categories.length} categories</div>
      </div>

      <div className="studio-grid">
        {/* ── LEFT: Form ── */}
        <div className="studio-form">
          <div className="form-header">
            <h3 className="form-title">
              {editing ? <>Edit <span>{editing.type}</span></> : <>New <span>{activeMode}</span></>}
            </h3>
            {editing && (
              <button type="button" className="btn-cancel" onClick={reset}>✕ Cancel</button>
            )}
          </div>

          {/* Mode toggle — only when not editing */}
          {!editing && (
            <div className="segment-tabs">
              <button
                type="button"
                className={`segment-btn${activeMode === 'category' ? ' segment-active' : ''}`}
                onClick={() => setMode('category')}
              >
                🗂️ Category
              </button>
              <button
                type="button"
                className={`segment-btn${activeMode === 'subcategory' ? ' segment-active' : ''}`}
                onClick={() => setMode('subcategory')}
              >
                📂 Subcategory
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Parent category picker (subcategory mode only) */}
            {activeMode === 'subcategory' && (
              <div className="field">
                <label className="field-label">Parent Category</label>
                <div className="category-tags">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-tag${parentId === cat.id ? ' active-tag' : ''}`}
                      onClick={() => setParentId(cat.id)}
                      disabled={!!editing}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label className="field-label">Name</label>
              <input
                type="text"
                placeholder={activeMode === 'category' ? 'e.g. Drinks' : 'e.g. Juice'}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label">Icon</label>
              <div className="icon-picker-wrap">
                <button
                  type="button"
                  className="icon-launch-btn"
                  onClick={() => setIconPickerOpen(o => !o)}
                >
                  {icon || '🙂'}
                  <span>{iconPickerOpen ? 'Hide' : 'Pick icon'}</span>
                </button>
                {iconPickerOpen && (
                  <div className="icon-picker-popover">
                    <div className="icon-picker">
                      {ICON_CHOICES.map(ic => (
                        <button
                          key={ic}
                          type="button"
                          className={`icon-chip${icon === ic ? ' icon-chip-active' : ''}`}
                          onClick={() => { setIcon(ic); setIconPickerOpen(false) }}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="icon-clear-btn" onClick={() => { setIcon(''); setIconPickerOpen(false) }}>
                      Clear icon
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-add" disabled={busy}>
              {busy
                ? <span className="dots"><span /><span /><span /></span>
                : editing ? '💾 Save' : `＋ Create ${activeMode === 'category' ? 'Category' : 'Subcategory'}`
              }
            </button>
          </form>
        </div>

        {/* ── RIGHT: Tree list ── */}
        <div className="studio-browser">
          <div className="studio-browser-head">
            <div>
              <h3>All categories</h3>
              <p>Click a category to manage its subcategories.</p>
            </div>
            <div className="studio-count">{categories.length}</div>
          </div>

          <div className="category-list">
            {categories.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🗂️</span>
                No categories yet. Create one!
              </div>
            ) : (
              categories.map(cat => {
                const expanded = expandedIds.has(cat.id)
                const subs = cat.subcategories || []

                return (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Category row */}
                    <article className={`category-card${cat.is_active === false ? ' category-card-hidden' : ''}`}>
                      <div className="category-card-top">
                        <span className="category-card-icon">{cat.icon || '🗂️'}</span>
                        <div>
                          <h4>{cat.name}</h4>
                          <p>{subs.length} subcategor{subs.length === 1 ? 'y' : 'ies'}</p>
                        </div>
                      </div>
                      <div className="category-card-meta">
                        <span className={`category-status${cat.is_active === false ? ' category-status-off' : ''}`}>
                          {cat.is_active === false ? 'Hidden' : 'Active'}
                        </span>
                      </div>
                      <div className="category-card-actions">
                        <button
                          type="button"
                          className="btn-edit"
                          title="Expand subcategories"
                          onClick={() => toggleExpand(cat.id)}
                        >
                          {expanded ? '▲' : '▼'}
                        </button>
                        <button type="button" className="btn-edit" onClick={() => startEdit('category', cat)}>✏️</button>
                        <button type="button" className="btn-cancel" onClick={() => onToggleCategory(cat.id, cat.is_active !== false)}>
                          {cat.is_active === false ? '↺' : 'Hide'}
                        </button>
                        <button type="button" className="category-delete-btn" onClick={() => handleDelete('category', cat)}>
                          Delete
                        </button>
                      </div>
                    </article>

                    {/* Subcategories (expanded) */}
                    {expanded && (
                      <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {subs.length === 0 ? (
                          <p style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 14px' }}>
                            No subcategories yet. Switch to Subcategory mode and pick this category.
                          </p>
                        ) : (
                          subs.map(sub => (
                            <article
                              key={sub.id}
                              className={`category-card${sub.is_active === false ? ' category-card-hidden' : ''}`}
                              style={{ background: 'var(--input-bg)' }}
                            >
                              <div className="category-card-top">
                                <span className="category-card-icon" style={{ fontSize: 14, width: 34, height: 34 }}>
                                  {sub.icon || '📂'}
                                </span>
                                <div>
                                  <h4 style={{ fontSize: 14 }}>{sub.name}</h4>
                                  <p>Subcategory</p>
                                </div>
                              </div>
                              <div className="category-card-meta">
                                <span className={`category-status${sub.is_active === false ? ' category-status-off' : ''}`}>
                                  {sub.is_active === false ? 'Hidden' : 'Active'}
                                </span>
                              </div>
                              <div className="category-card-actions">
                                <button type="button" className="btn-edit" onClick={() => startEdit('subcategory', sub)}>✏️</button>
                                <button type="button" className="btn-cancel" onClick={() => onToggleSubcategory(sub.id, sub.is_active !== false)}>
                                  {sub.is_active === false ? '↺' : 'Hide'}
                                </button>
                                <button type="button" className="category-delete-btn" onClick={() => handleDelete('subcategory', sub)}>
                                  Delete
                                </button>
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoryStudio
