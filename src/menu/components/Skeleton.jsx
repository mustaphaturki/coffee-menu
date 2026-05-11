const Skeleton = () => (
  <div className="mn-grid">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="mn-skeleton" style={{ animationDelay: `${i * 0.09}s` }}>
        <div className="mn-sk-img shimmer" />
        <div className="mn-sk-body">
          <div className="mn-sk-line shimmer" style={{ width: '72%' }} />
          <div className="mn-sk-line shimmer" style={{ width: '42%', marginTop: 6 }} />
        </div>
      </div>
    ))}
  </div>
)

export default Skeleton
