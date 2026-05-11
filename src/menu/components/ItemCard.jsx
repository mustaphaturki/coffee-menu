const ItemCard = ({ item, idx }) => {
  const avail = item.available !== false
  const sub   = item.subcategories

  return (
    <div
      className={`mn-card${!avail ? ' mn-card-off' : ''}`}
      style={{ animationDelay: `${Math.min(idx * 0.07, 0.49)}s` }}
    >
      <div className="mn-card-img-wrap">
        <img src={item.image_url} alt={item.name} className="mn-card-img" loading="lazy" />
        {sub?.icon && (
          <span className="mn-card-badge">{sub.icon}</span>
        )}
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
  )
}

export default ItemCard
