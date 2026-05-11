import { useState, useEffect } from 'react'

const ItemForm = ({ categories, editingItem, onSubmit, onCancel, showToast }) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [subcategoryId, setSubcategoryId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setPrice(editingItem.price)
      setPreview(editingItem.image_url)
      setSubcategoryId(editingItem.subcategory_id)
      // Find parent category
      const parentCat = categories.find(c =>
        c.subcategories?.some(s => s.id === editingItem.subcategory_id)
      )
      setSelectedCategoryId(parentCat?.id || null)
    } else {
      setName('')
      setPrice('')
      setPreview(null)
      setImageFile(null)
      setSubcategoryId(null)
      setSelectedCategoryId(null)
    }
  }, [editingItem, categories])

  const activeSubcategories = categories.find(c => c.id === selectedCategoryId)?.subcategories || []

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
    if (!name || !price || !subcategoryId || (!imageFile && !editingItem)) {
      showToast('⚠️ Fill all fields and pick a subcategory.')
      return
    }
    setLoading(true)
    try {
      await onSubmit({
        subcategory_id: subcategoryId,
        name,
        price,
        imageFile,
        image_url: editingItem?.image_url,
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
          {editingItem ? <>Edit <span>Item</span></> : <>Add New <span>Item</span></>}
        </h3>
        {editingItem && (
          <button type="button" className="btn-cancel" onClick={onCancel}>✕ Cancel</button>
        )}
      </div>

      <label className="dropzone">
        {preview
          ? <img src={preview} alt="preview" className="preview-img" />
          : <>
              <span className="dropzone-icon">📸</span>
              <span className="dropzone-text">Click to upload photo</span>
              <span className="dropzone-sub">JPG · PNG · WEBP</span>
            </>
        }
        <input type="file" accept="image/*" onChange={handleImage} hidden />
      </label>

      <div className="field">
        <label className="field-label">Product Name</label>
        <input
          type="text"
          placeholder="e.g. Caramel Macchiato"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Price (DT)</label>
        <input
          type="number"
          step="0.001"
          placeholder="0.000"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>

      {/* Step 1: Category */}
      <div className="field">
        <label className="field-label">Category</label>
        <div className="category-tags">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`cat-tag${selectedCategoryId === cat.id ? ' active-tag' : ''}`}
              onClick={() => {
                setSelectedCategoryId(cat.id)
                setSubcategoryId(null)
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Subcategory (appears after category picked) */}
      {selectedCategoryId && (
        <div className="field">
          <label className="field-label">Subcategory</label>
          {activeSubcategories.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              No subcategories yet. Add them in Category Studio.
            </p>
          ) : (
            <div className="category-tags">
              {activeSubcategories.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`cat-tag${subcategoryId === sub.id ? ' active-tag' : ''}`}
                  onClick={() => setSubcategoryId(sub.id)}
                >
                  {sub.icon} {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn-add" disabled={loading}>
        {loading
          ? <span className="dots"><span /><span /><span /></span>
          : editingItem ? '💾 Save Changes' : '＋ Add to Menu'
        }
      </button>
    </form>
  )
}

export default ItemForm
