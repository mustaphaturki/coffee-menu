const CategoryStrip = ({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
  itemCountBySubcategory,
}) => {
  const activeCategory = categories.find(c => c.id === selectedCategoryId)
  const subcategories  = activeCategory?.subcategories?.filter(s => s.is_active !== false) || []

  return (
    <div className="mn-strip-wrap">
      {/* Row 1 — Categories */}
      <div className="mn-strip-row mn-strip-divider">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`mn-pill${selectedCategoryId === cat.id ? ' mn-pill-on' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span className="mn-pill-label">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Row 2 — Subcategories (dynamic) */}
      {subcategories.length > 0 && (
        <div className="mn-subcat-row" key={selectedCategoryId}>
          {subcategories.map(sub => {
            const count = itemCountBySubcategory[sub.id] || 0
            return (
              <button
                key={sub.id}
                className={`mn-pill mn-pill-sm${selectedSubcategoryId === sub.id ? ' mn-pill-sub-on' : ''}`}
                onClick={() => onSelectSubcategory(sub.id)}
              >
                {sub.icon && <span>{sub.icon}</span>}
                <span>{sub.name}</span>
                {count > 0 && <span className="mn-pill-badge">{count}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CategoryStrip
