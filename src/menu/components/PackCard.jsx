const PackCard = ({ pack, idx }) => {
  const avail    = pack.available !== false
  const included = (pack.pack_items || []).filter(pi => pi.items)

  return (
    <div
      className={`mn-pack${!avail ? ' mn-card-off' : ''}`}
      style={{ animationDelay: `${Math.min(idx * 0.07, 0.49)}s` }}
    >
      <div className="mn-pack-img-wrap">
        <img src={pack.image_url} alt={pack.name} className="mn-pack-img" loading="lazy" />
        {!avail && (
          <div className="mn-card-veil">
            <span className="mn-card-soldout">Sold Out</span>
          </div>
        )}
      </div>
      <div className="mn-pack-body">
        <span className="mn-pack-badge">🎁 Pack</span>
        <h3 className="mn-pack-name">{pack.name}</h3>
        {pack.description && <p className="mn-pack-desc">{pack.description}</p>}
        {included.length > 0 && (
          <div className="mn-pack-chips">
            {included.map(pi => (
              <span key={pi.items.id} className="mn-chip">
                {pi.items.name}{pi.quantity > 1 ? ` ×${pi.quantity}` : ''}
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
  )
}

export default PackCard
