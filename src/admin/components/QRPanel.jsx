import { QRCodeSVG } from 'qrcode.react'

const QRPanel = ({ showToast }) => {
  const menuUrl = 'https://animated-treacle-08d991.netlify.app/'

  return (
    <div className="qr-panel" style={{
      display: 'flex', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div className="qr-panel-card" style={{
        width: '100%', maxWidth: 780,
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 28, padding: '40px 48px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', gap: 48, alignItems: 'center',
      }}>

        {/* ── LEFT ── */}
        <div className="qr-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: 'var(--espresso)', marginBottom: 6 }}>
              Menu QR Code
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              Print this card or save as PDF for your tables, posters, or takeaway menus.
            </p>
          </div>

          <div className="qr-actions" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="btn-add"
              onClick={() => window.open(menuUrl, '_blank', 'noopener,noreferrer')}>
              🔗 Open Menu
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-cancel" style={{ flex: 1 }}
                onClick={async () => {
                  try { await navigator.clipboard.writeText(menuUrl); showToast('✅ Link copied') }
                  catch { showToast('⚠️ Copy failed') }
                }}>
                Copy Link
              </button>
              <button type="button" className="btn-cancel" style={{ flex: 1 }}
                onClick={() => window.print()}>
                🖨️ Save as PDF
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: QR Card ── */}
        <div className="qr-code-card" style={{
          flexShrink: 0,
          background: 'var(--input-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 24, padding: '28px 24px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10,
          minWidth: 260,
        }}>
          <p style={{
            fontFamily: 'Fraunces, serif', fontSize: 18,
            color: 'var(--espresso)', fontWeight: 700,
          }}>Eryx Coffee</p>
          <div style={{ color: 'var(--espresso)' }}>
            <QRCodeSVG value={menuUrl} size={180} bgColor="transparent" fgColor="currentColor" level="M" includeMargin />
          </div>
        </div>

      </div>
    </div>
  )
}

export default QRPanel
