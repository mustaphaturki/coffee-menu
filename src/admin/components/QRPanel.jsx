import { useState, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const QRPanel = ({ showToast }) => {
  const [customUrl, setCustomUrl] = useState(() => {
    try { return localStorage.getItem('bb-custom-menu-url') || '' } catch { return '' }
  })

  const menuUrl = useMemo(() => {
    if (customUrl) return customUrl
    return typeof window !== 'undefined' ? `${window.location.origin}/` : '/'
  }, [customUrl])

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 780,
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 28, padding: '40px 48px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', gap: 48, alignItems: 'center',
      }}>

        {/* ── LEFT ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: 'var(--espresso)', marginBottom: 6 }}>
              Menu QR Code
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              Print this card or save as PDF for your tables, posters, or takeaway menus.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="field-label">Menu URL</label>
            <input
              type="url"
              placeholder="https://your-menu-url.com"
              value={customUrl}
              onChange={e => {
                setCustomUrl(e.target.value)
                try { localStorage.setItem('bb-custom-menu-url', e.target.value) } catch {}
              }}
              style={{
                padding: '12px 16px',
                border: '1px solid var(--input-border)',
                borderRadius: 12, fontSize: 14,
                background: 'var(--input-bg)', color: 'var(--ink)',
                fontFamily: 'Sora, sans-serif', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
        <div style={{
          flexShrink: 0,
          background: 'var(--input-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 24, padding: '28px 24px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10,
          minWidth: 260,
        }}>
          <img src="/logo.png" alt="Eryx Coffee" style={{
            width: 52, height: 52, borderRadius: 14,
            objectFit: 'contain',
          }} />
          <p style={{
            fontFamily: 'Fraunces, serif', fontSize: 18,
            color: 'var(--espresso)', fontWeight: 700,
          }}>Eryx Coffee</p>
          <div style={{ color: 'var(--espresso)' }}>
            <QRCodeSVG value={menuUrl} size={180} bgColor="transparent" fgColor="currentColor" level="M" includeMargin />
          </div>
          <p style={{ fontSize: 10, color: 'var(--muted)', wordBreak: 'break-all', textAlign: 'center' }}>
            {menuUrl}
          </p>
        </div>

      </div>
    </div>
  )
}

export default QRPanel
