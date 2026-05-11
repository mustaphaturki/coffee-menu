import { useState, useMemo } from 'react'

const BATCH = 8

const ItemList = ({ items, categories, loading, editingItem, onEdit, onDelete, onToggle }) => {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availFilter, setAvailFilter] = useState('all')
  const [visible, setVisible] = useState(BATCH)

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all'
      || item.subcategories?.categories?.id === parseInt(categoryFilter)
    const matchAvail = availFilter === 'all'
      || (availFilter === 'in'  && item.available !== false)
      || (availFilter === 'out' && item.available === false)
    return matchSearch && matchCat && matchAvail
  }), [items, search, categoryFilter, availFilter])

  const shown = filtered.slice(0, visible)

  const handleFilter = (setter) => (e) => {
    setter(e.target.value)
    setVisible(BATCH)
  }

  return (
    <section className="management-zone">
      <div className="browser-toolbar">
        <div className="search-area search-area-compact">
          <input
            className="search-bar"
            placeholder="🔍 Search by name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(BATCH) }}
          />
        </div>
        <div className="filter-row">
          <select className="filter-select" value={categoryFilter} onChange={handleFilter(setCategoryFilter)}>
            <option value="all">All categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <select className="filter-select" value={availFilter} onChange={handleFilter(setAvailFilter)}>
            <option value="all">Any status</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </div>

      <div className="results-meta">
        <span>{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</span>
        <span>{shown.length} shown</span>
      </div>

      <div className="inventory-list">
        {loading ? (
          <div className="empty-state"><span className="empty-icon">⏳</span>Loading…</div>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">{search ? '🔍' : '☕'}</span>
            {search ? 'No items match.' : 'No items yet.'}
          </div>
        ) : (
          shown.map(item => {
            const sub  = item.subcategories
            const cat  = sub?.categories

            return (
              <div
                key={item.id}
                className={`inventory-card${item.available === false ? ' out-of-stock' : ''}${editingItem?.id === item.id ? ' card-editing' : ''}`}
              >
                <div className="card-info">
                  <img src={item.image_url} className="item-thumb" alt={item.name} />
                  <div className="item-details">
                    {cat && (
                      <span className="category-badge">
                        {cat.icon} {cat.name} › {sub.name}
                      </span>
                    )}
                    <h3>{item.name}</h3>
                    <p className="price-bold">{Number(item.price).toFixed(3)} DT</p>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    type="button"
                    className={`avail-pill${item.available === false ? ' avail-off' : ' avail-on'}`}
                    onClick={() => onToggle(item.id, item.available !== false)}
                  >
                    {item.available === false ? '✕ Off' : '● On'}
                  </button>
                  <button type="button" className="btn-edit" onClick={() => onEdit(item)}>✏️</button>
                  <button type="button" className="btn-delete" onClick={() => onDelete(item.id)}>✕</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {filtered.length > shown.length && (
        <button type="button" className="load-more-btn" onClick={() => setVisible(v => v + BATCH)}>
          Show more items
        </button>
      )}
    </section>
  )
}

export default ItemList
