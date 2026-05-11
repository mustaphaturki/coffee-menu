const StatBar = ({ counts }) => {
  const stats = [
    { label: 'Total Items', value: counts.totalItems, icon: '☕' },
    { label: 'In Stock',    value: counts.inStock,    icon: '✅' },
    { label: 'Total Packs', value: counts.packs,      icon: '🎁' },
    { label: 'Categories',  value: counts.categories, icon: '🗂️' },
  ]

  return (
    <div className="stat-bar">
      {stats.map((stat, i) => (
        <div className="stat-card" key={stat.label} style={{ animationDelay: `${i * 0.08}s` }}>
          <h4>{stat.label}</h4>
          <p>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

export default StatBar
