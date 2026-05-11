import { useState, useEffect } from 'react'
import { PACK_CATEGORIES } from '../../shared/lib/constants'

const PackForm = ({ items, editingPack, onSubmit, onCancel, showToast }) => {
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [price, setPrice]       = useState('')
  const [packCat, setPackCat]   = useState(PACK_CATEGORIES[0].name)
  const [packQty, setPackQty]   = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (editingPack) {
      setName(editingPack.name)
      setDesc(editingPack.description || '')
      setPrice(editingPack.price)
      setPackCat(editingPack.pack_category || PACK_CATEGORIES[0].name)
      setPreview(editingPack.image_url)
      // Build packQty from pack_items
      const qty = {}
      ;(editingPack.pack_items || []).forEach(pi => {
        if (pi.items) qty[pi.items.id] = pi.quantity
      })
      setPackQty(qty)
      setImageFile(null)
    } else {
      setName(''); setDesc(''); setPrice('')
      setPackCat(PACK_CATEGORIES[0].name)
      setPackQty({}); setImageFile(null); setPreview(null)
    }
  }, [editingPack])

  const setQty = (itemId, qty) => {
    if (qty <= 0) {
      setPackQty(prev => { const n = { ...prev }; delete n[itemId]; return n })
    } else {
      setPackQty(prev => ({ ...prev, [itemId]: qty }))
    }
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('⚠️ Select an image file.'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !price || (!imageFile && !editingPack) || Object.keys(packQty).length === 0) {
      showToast('⚠️ Fill all fields & add at least one item.')
      return
    }
    setLoading(true)
    try {
      await onSubmit({
        name, description: desc, price, imageFile,
        image_url: editingPack?.image_url,
        packCategory: packCat, packQty,
      })
    } catch (err) {
      showToast('❌ ' + (err.message || 'Error.'))
    }
    setLoading(false)
  }

  return (
    <form className="sticky-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3 className="form-title">
          {editingPack ? <>Edit <span>Pack</span></> : <>Create a <span>Pack</span></>}
        </h3>
        {editingPack && (
          <button type="button" className="btn-cancel" onClick={onCancel}>✕ Cancel</button>
        )}
      </div>

      <label className="dropzone">
        {preview
          ? <img src={preview} alt="pack" className="preview-img" />
          : <>
              <span className="dropzone-icon">🖼️</span>
              <span className="dropzone-text">Upload pack photo</span>
              <span className="dropzone-sub">JPG · PNG · WEBP</span>
            </>
        }
        <input type="file" accept="image/*" onChange={handleImage} hidden />
      </label>

      <div className="field">
        <label className="field-label">Pack Name</label>
        <input type="text" placeholder="e.g. Petit Déjeuner" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Description</label>
        <textarea className="field-textarea" rows={2} placeholder="What's included?" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Price (DT)</label>
        <input type="number" step="0.001" placeholder="0.000" value={price} onChange={e => setPrice(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Pack Category</label>
        <div className="category-tags">
          {PACK_CATEGORIES.map(pc => (
            <button
              key={pc.name}
              type="button"
              className={`cat-tag${packCat === pc.name ? ' active-tag' : ''}`}
              onClick={() => setPackCat(pc.name)}
            >
              {pc.icon} {pc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">
          Items &amp; Quantities
          {Object.keys(packQty).length > 0 && (
            <span className="field-count"> · {Object.keys(packQty).length} selected</span>
          )}
        </label>
        <div className="item-picker">
          {items.length === 0 ? (
            <p className="picker-empty">Add menu items first.</p>
          ) : (
            items.map(item => {
              const qty = packQty[item.id] || 0
              return (
                <div
                  key={item.id}
                  className={`picker-item${qty > 0 ? ' picker-selected' : ''}${item.available === false ? ' picker-unavailable' : ''}`}
                >
                  <img src={item.image_url} alt={item.name} className="picker-thumb" />
                  <span className="picker-name">{item.name}</span>
                  {item.available === false && <span className="picker-tag-unavail">Out</span>}
                  <div className="qty-ctrl" onClick={e => e.stopPropagation()}>
                    <button type="button" className="qty-btn" onClick={() => setQty(item.id, qty - 1)}>−</button>
                    <span className="qty-num">{qty}</span>
                    <button type="button" className="qty-btn" onClick={() => setQty(item.id, qty + 1)}>+</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <button type="submit" className="btn-add" disabled={loading}>
        {loading
          ? <span className="dots"><span /><span /><span /></span>
          : editingPack ? '💾 Save Changes' : '🎁 Create Pack'
        }
      </button>
    </form>
  )
}

export default PackForm
