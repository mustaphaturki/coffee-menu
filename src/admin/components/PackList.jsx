import { useState, useMemo } from 'react'
import { PACK_CATEGORIES } from '../../shared/lib/constants'

const BATCH = 8

const PackList = ({ packs, loading, editingPack, onEdit, onDelete }) => {
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [availFilter, setAvailFilter] = useState('all')
  const [visible, setVisible]   = useState(BATCH)

  const filtered = useMemo(() => packs.filter(pack => {
    const matchSearch = pack.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = catFilter === 'all' || pack.pack_category === catFilter
    const matchAvail  = availFilter === 'all'
      || (availFilter === 'in'  && pack.available !== false)
      || (availFilter === 'out' && pack.available === false)
    return matchSearch && matchCat && matchAvail
  }), [packs, search, catFilter, availFilter])

  const shown = filtered.slice(0, visible)

  return (
    <section className="management-zone">
      <div className="browser-toolbar">
        <div className="search-area search-area-compact">
          <input
            className="search-bar"
            placeholder="🔍 Search packs…"
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(BATCH) }}
          />
        </div>
        <div className="filter-row">
          <select className="filter-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setVisible(BATCH) }}>
            <option value="all">All categories</option>
            {PACK_CATEGORIES.map(pc => (
              <option key={pc.name} value={pc.name}>{pc.icon} {pc.name}</option>
            ))}
          </select>
          <select className="filter-select" value={availFilter} onChange={e => { setAvailFilter(e.target.value); setVisible(BATCH) }}>
            <option value="all">Any status</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      <div className="results-meta">
        <span>{filtered.length} pack{filtered.length !== 1 ? 's' : ''} found</span>
        <span>{shown.length} shown</span>
      </div>

      <div className="inventory-list">
        {loading ? (
          <div className="empty-state"><span className="empty-icon">⏳</span>Loading…</div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎁</span>
            {search ? 'No packs match.' : 'No packs yet.'}
          </div>
        ) : (
          shown.map(pack => {
            const included = (pack.pack_items || [])
              .filter(pi => pi.items)
              .map(pi => ({ item: pi.items, qty: pi.quantity }))

            return (
              <div
                key={pack.id}
                className={`inventory-card${pack.available === false ? ' out-of-stock' : ''}${editingPack?.id === pack.id ? ' card-editing' : ''}`}
              >
                <div className="card-info">
                  <img src={pack.image_url} className="item-thumb" alt={pack.name} />
                  <div className="item-details">
                    <span className="category-badge pack-badge">
                      {PACK_CATEGORIES.find(pc => pc.name === pack.pack_category)?.icon || '🎁'} {pack.pack_category || 'Other'}
                    </span>
                    <h3>{pack.name}</h3>
                    {pack.description && <p className="pack-desc">{pack.description}</p>}
                    {included.length > 0 && (
                      <div className="pack-chips">
                        {included.map(({ item, qty }) => (
                          <span key={item.id} className="pack-chip">
                            {item.name}{qty > 1 ? ` ×${qty}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="price-bold">{Number(pack.price).toFixed(3)} DT</p>
                  </div>
                </div>
                <div className="card-actions">
                  <button type="button" className="btn-edit" onClick={() => onEdit(pack)}>✏️</button>
                  <button type="button" className="btn-delete" onClick={() => onDelete(pack.id)}>✕</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {filtered.length > shown.length && (
        <button type="button" className="load-more-btn" onClick={() => setVisible(v => v + BATCH)}>
          Show more packs
        </button>
      )}
    </section>
  )
}

export default PackList
