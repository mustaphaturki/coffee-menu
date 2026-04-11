import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../App.css';

const supabase = createClient(
  'https://cngjgwtnaoecuwgakrpj.supabase.co',
  'sb_publishable_4AchmnqFGUX3epT2torLPw_u-ij7hkP'
);

const BUCKET_NAME = 'menu-images';
const CATEGORIES  = ['Coffee', 'Pastry', 'Dessert'];
const CAT_ICONS   = { Coffee: '☕', Pastry: '🥐', Dessert: '🍮' };
let toastTimer;

const Admin = () => {

  /* ── global ── */
  const [theme, setTheme] = useState(() => localStorage.getItem('bb-theme') || 'light');
  const [tab,   setTab]   = useState('menu');
  const [toast, setToast] = useState(null);

  /* ── menu items ── */
  const [editingItem, setEditingItem] = useState(null);
  const [name,        setName]        = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('Coffee');
  const [preview,     setPreview]     = useState(null);
  const [imageFile,   setImageFile]   = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [items,       setItems]       = useState([]);
  const [searchTerm,  setSearch]      = useState('');

  /* ── packs ── */
  const [editingPack,   setEditingPack]   = useState(null);
  const [packName,      setPackName]      = useState('');
  const [packDesc,      setPackDesc]      = useState('');
  const [packPrice,     setPackPrice]     = useState('');
  const [packImage,     setPackImage]     = useState(null);
  const [packPreview,   setPackPreview]   = useState(null);
  const [packQty,       setPackQty]       = useState({}); // { itemId: qty }
  const [loadingPack,   setLoadingPack]   = useState(false);
  const [packs,         setPacks]         = useState([]);
  const [packSearch,    setPackSearch]    = useState('');

  /* ── lifecycle ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bb-theme', theme);
  }, [theme]);

  useEffect(() => { fetchItems(); fetchPacks(); }, []);

  /* ── toast ── */
  const showToast = (msg) => {
    clearTimeout(toastTimer);
    setToast(msg);
    toastTimer = setTimeout(() => setToast(null), 3400);
  };

  /* ── fetch ── */
  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from('menu').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
      return data || [];
    } catch (err) { console.error(err); return []; }
  };

  const fetchPacks = async () => {
    try {
      const { data, error } = await supabase.from('packs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPacks(data || []);
    } catch (err) { console.error(err); }
  };

  /* ── sync pack availability ── */
  const syncPackAvailability = async (latestItems) => {
    try {
      const { data: allPacks } = await supabase.from('packs').select('*');
      if (!allPacks) return;
      await Promise.all(allPacks.map(pack => {
        const ids = Object.keys(pack.item_quantities || {});
        const available = ids.length === 0 ? true : ids.every(id => {
          const item = latestItems.find(i => i.id === id);
          return item?.available !== false;
        });
        return supabase.from('packs').update({ available }).eq('id', pack.id);
      }));
      fetchPacks();
    } catch (err) { console.error(err); }
  };

  /* ── image ── */
  const makeImageHandler = (setFile, setThumb) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('⚠️ Please select an image file.'); return; }
    setFile(file);
    setThumb(URL.createObjectURL(file));
    e.target.value = '';
  };

  const uploadImage = async (file) => {
    const ext  = file.name.split('.').pop();
    const path = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET_NAME)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    if (!pub?.publicUrl) throw new Error('Could not get public URL.');
    return pub.publicUrl;
  };

  /* ── item CRUD ── */
  const startEditItem = (item) => {
    setEditingItem(item);
    setName(item.name); setPrice(item.price);
    setCategory(item.category); setPreview(item.image_url); setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditItem = () => {
    setEditingItem(null); setName(''); setPrice('');
    setCategory('Coffee'); setPreview(null); setImageFile(null);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!name || !price || (!imageFile && !editingItem)) { showToast('⚠️ Fill all fields.'); return; }
    setLoadingItem(true);
    try {
      let image_url = editingItem?.image_url || null;
      if (imageFile) image_url = await uploadImage(imageFile);
      if (editingItem) {
        const { error } = await supabase.from('menu')
          .update({ name, price: parseFloat(price), category, image_url }).eq('id', editingItem.id);
        if (error) throw error;
        showToast('✏️ Item updated!');
      } else {
        const { error } = await supabase.from('menu')
          .insert([{ name, price: parseFloat(price), category, image_url }]).select();
        if (error) throw error;
        showToast('☕ Item added!');
      }
      cancelEditItem();
      const latest = await fetchItems();
      await syncPackAvailability(latest);
    } catch (err) { showToast('❌ ' + (err.message || 'Error.')); }
    setLoadingItem(false);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Remove this item?')) return;
    try {
      const { error } = await supabase.from('menu').delete().eq('id', id);
      if (error) throw error;
      showToast('Item removed.');
      const latest = await fetchItems();
      await syncPackAvailability(latest);
    } catch { showToast('❌ Error deleting item.'); }
  };

  const toggleAvail = async (id, cur) => {
    try {
      const { error } = await supabase.from('menu').update({ available: !cur }).eq('id', id);
      if (error) throw error;
      const latest = await fetchItems();
      await syncPackAvailability(latest);
    } catch { showToast('❌ Error updating status.'); }
  };

  /* ── pack qty helpers ── */
  const setQty = (itemId, qty) => {
    if (qty <= 0) {
      setPackQty(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    } else {
      setPackQty(prev => ({ ...prev, [itemId]: qty }));
    }
  };

  /* ── pack CRUD ── */
  const startEditPack = (pack) => {
    setEditingPack(pack);
    setPackName(pack.name); setPackDesc(pack.description || '');
    setPackPrice(pack.price); setPackPreview(pack.image_url);
    setPackQty(pack.item_quantities || {}); setPackImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditPack = () => {
    setEditingPack(null); setPackName(''); setPackDesc(''); setPackPrice('');
    setPackImage(null); setPackPreview(null); setPackQty({});
  };

  const handleSubmitPack = async (e) => {
    e.preventDefault();
    const hasItems = Object.keys(packQty).length > 0;
    if (!packName || !packPrice || (!packImage && !editingPack) || !hasItems) {
      showToast('⚠️ Fill all fields & add at least one item.'); return;
    }
    setLoadingPack(true);
    try {
      let image_url = editingPack?.image_url || null;
      if (packImage) image_url = await uploadImage(packImage);

      const item_ids = Object.keys(packQty);
      const available = item_ids.every(id => items.find(i => i.id === id)?.available !== false);

      const payload = {
        name: packName, description: packDesc,
        price: parseFloat(packPrice), image_url,
        item_quantities: packQty, item_ids, available,
      };

      if (editingPack) {
        const { error } = await supabase.from('packs').update(payload).eq('id', editingPack.id);
        if (error) throw error;
        showToast('✏️ Pack updated!');
      } else {
        const { error } = await supabase.from('packs').insert([payload]).select();
        if (error) throw error;
        showToast('🎁 Pack created!');
      }
      cancelEditPack(); fetchPacks();
    } catch (err) { showToast('❌ ' + (err.message || 'Error.')); }
    setLoadingPack(false);
  };

  const handleDeletePack = async (id) => {
    if (!window.confirm('Delete this pack?')) return;
    try {
      const { error } = await supabase.from('packs').delete().eq('id', id);
      if (error) throw error;
      fetchPacks(); showToast('Pack removed.');
    } catch { showToast('❌ Error deleting pack.'); }
  };

  /* ── derived ── */
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPacks = packs.filter(p => p.name.toLowerCase().includes(packSearch.toLowerCase()));
  const counts = {
    total:   items.length,
    cats:    new Set(items.map(i => i.category)).size,
    inStock: items.filter(i => i.available !== false).length,
    packs:   packs.length,
  };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="app-root" data-theme={theme}>
      <div className="admin-container">

        {/* HEADER */}
        <header className="admin-header">
          <div className="logo-area">
            <h1 className="admin-logo">Eryx Coffee ☕</h1>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <span className="status-dot" /> Live Dashboard
            </div>
            <button className="theme-btn"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="btn-cancel" onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}>Sign Out</button>
          </div>
        </header>

        {/* STATS */}
        <div className="stat-bar">
          {[
            { label: 'Total Items', value: counts.total   },
            { label: 'Categories',  value: counts.cats    },
            { label: 'In Stock',    value: counts.inStock },
            { label: 'Packs',       value: counts.packs   },
          ].map((s, i) => (
            <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 0.08}s` }}>
              <h4>{s.label}</h4><p>{s.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab-btn${tab === 'menu'  ? ' tab-active' : ''}`} onClick={() => setTab('menu')}>☕ Menu Items</button>
          <button className={`tab-btn${tab === 'packs' ? ' tab-active' : ''}`} onClick={() => setTab('packs')}>🎁 Packs &amp; Combos</button>
        </div>

        {/* ══ MENU ITEMS ══ */}
        {tab === 'menu' && (
          <div className="admin-main">
            <form className="sticky-form" onSubmit={handleSubmitItem}>
              <div className="form-header">
                <h3 className="form-title">
                  {editingItem ? <>Edit <span>Item</span></> : <>Add New <span>Item</span></>}
                </h3>
                {editingItem && <button type="button" className="btn-cancel" onClick={cancelEditItem}>✕ Cancel</button>}
              </div>

              <label className="dropzone">
                {preview ? <img src={preview} alt="preview" className="preview-img" /> :
                  <><span className="dropzone-icon">📸</span>
                  <span className="dropzone-text">Click to upload photo</span>
                  <span className="dropzone-sub">JPG · PNG · WEBP</span></>}
                <input type="file" accept="image/*" onChange={makeImageHandler(setImageFile, setPreview)} hidden />
              </label>

              <div className="field">
                <label className="field-label">Product Name</label>
                <input type="text" placeholder="e.g. Caramel Macchiato" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Price (DT)</label>
                <input type="number" step="0.001" placeholder="0.000" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Category</label>
                <div className="category-tags">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button"
                      className={`cat-tag${category === cat ? ' active-tag' : ''}`}
                      onClick={() => setCategory(cat)}>
                      {CAT_ICONS[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-add" disabled={loadingItem}>
                {loadingItem ? <span className="dots"><span/><span/><span/></span>
                  : editingItem ? '💾 Save Changes' : '＋ Add to Menu'}
              </button>
            </form>

            <section className="management-zone">
              <div className="search-area">
                <input className="search-bar" placeholder="🔍  Search by name…"
                  value={searchTerm} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="inventory-list">
                {filteredItems.length === 0
                  ? <div className="empty-state">
                      <span className="empty-icon">{searchTerm ? '🔍' : '☕'}</span>
                      {searchTerm ? 'No items match.' : 'No items yet.'}
                    </div>
                  : filteredItems.map(item => (
                      <div key={item.id}
                        className={`inventory-card${item.available === false ? ' out-of-stock' : ''}${editingItem?.id === item.id ? ' card-editing' : ''}`}>
                        <div className="card-info">
                          <img src={item.image_url} className="item-thumb" alt={item.name} />
                          <div className="item-details">
                            <span className="category-badge">{item.category}</span>
                            <h3>{item.name}</h3>
                            <p className="price-bold">{Number(item.price).toFixed(3)} DT</p>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button
                            className={`avail-pill${item.available === false ? ' avail-off' : ' avail-on'}`}
                            onClick={() => toggleAvail(item.id, item.available !== false)}
                            type="button"
                          >
                            {item.available === false ? '✕ Off' : '● On'}
                          </button>
                          <button className="btn-edit" onClick={() => startEditItem(item)}>✏️</button>
                          <button className="btn-delete" onClick={() => handleDeleteItem(item.id)}>✕</button>
                        </div>
                      </div>
                    ))
                }
              </div>
            </section>
          </div>
        )}

        {/* ══ PACKS ══ */}
        {tab === 'packs' && (
          <div className="admin-main">
            <form className="sticky-form" onSubmit={handleSubmitPack}>
              <div className="form-header">
                <h3 className="form-title">
                  {editingPack ? <>Edit <span>Pack</span></> : <>Create a <span>Pack</span></>}
                </h3>
                {editingPack && <button type="button" className="btn-cancel" onClick={cancelEditPack}>✕ Cancel</button>}
              </div>

              <label className="dropzone">
                {packPreview ? <img src={packPreview} alt="pack" className="preview-img" /> :
                  <><span className="dropzone-icon">🖼️</span>
                  <span className="dropzone-text">Upload pack photo</span>
                  <span className="dropzone-sub">JPG · PNG · WEBP</span></>}
                <input type="file" accept="image/*" onChange={makeImageHandler(setPackImage, setPackPreview)} hidden />
              </label>

              <div className="field">
                <label className="field-label">Pack Name</label>
                <input type="text" placeholder="e.g. Petit Déjeuner" value={packName} onChange={e => setPackName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <textarea className="field-textarea" rows={3}
                  placeholder="What's included? Any special notes…"
                  value={packDesc} onChange={e => setPackDesc(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Pack Price (DT)</label>
                <input type="number" step="0.001" placeholder="0.000" value={packPrice} onChange={e => setPackPrice(e.target.value)} />
              </div>

              <div className="field">
                <label className="field-label">
                  Items &amp; Quantities
                  {Object.keys(packQty).length > 0 &&
                    <span className="field-count"> · {Object.keys(packQty).length} item{Object.keys(packQty).length > 1 ? 's' : ''}</span>}
                </label>
                <div className="item-picker">
                  {items.length === 0
                    ? <p className="picker-empty">Add menu items first.</p>
                    : items.map(item => {
                        const qty = packQty[item.id] || 0;
                        const selected = qty > 0;
                        return (
                          <div key={item.id}
                            className={`picker-item${selected ? ' picker-selected' : ''}${item.available === false ? ' picker-unavailable' : ''}`}>
                            <img src={item.image_url} alt={item.name} className="picker-thumb" />
                            <span className="picker-name">{item.name}</span>
                            {item.available === false && <span className="picker-tag-unavail">Out</span>}
                            <div className="qty-ctrl" onClick={e => e.stopPropagation()}>
                              <button type="button" className="qty-btn"
                                onClick={() => setQty(item.id, qty - 1)}>−</button>
                              <span className="qty-num">{qty}</span>
                              <button type="button" className="qty-btn"
                                onClick={() => setQty(item.id, qty + 1)}>+</button>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              </div>

              <button type="submit" className="btn-add" disabled={loadingPack}>
                {loadingPack ? <span className="dots"><span/><span/><span/></span>
                  : editingPack ? '💾 Save Changes' : '🎁 Create Pack'}
              </button>
            </form>

            <section className="management-zone">
              <div className="search-area">
                <input className="search-bar" placeholder="🔍  Search packs…"
                  value={packSearch} onChange={e => setPackSearch(e.target.value)} />
              </div>
              <div className="inventory-list">
                {filteredPacks.length === 0
                  ? <div className="empty-state">
                      <span className="empty-icon">🎁</span>
                      {packSearch ? 'No packs match.' : 'No packs yet.'}
                    </div>
                  : filteredPacks.map(pack => {
                      const qty = pack.item_quantities || {};
                      const included = Object.entries(qty)
                        .map(([id, q]) => ({ item: items.find(i => i.id === id), q }))
                        .filter(({ item }) => item);
                      return (
                        <div key={pack.id}
                          className={`inventory-card${pack.available === false ? ' out-of-stock' : ''}${editingPack?.id === pack.id ? ' card-editing' : ''}`}>
                          <div className="card-info">
                            <img src={pack.image_url} className="item-thumb" alt={pack.name} />
                            <div className="item-details">
                              <span className="category-badge pack-badge">🎁 Pack</span>
                              <h3>{pack.name}</h3>
                              {pack.description && <p className="pack-desc">{pack.description}</p>}
                              {included.length > 0 && (
                                <div className="pack-chips">
                                  {included.map(({ item, q }) => (
                                    <span key={item.id} className="pack-chip">
                                      {CAT_ICONS[item.category] || '·'} {item.name}{q > 1 ? ` ×${q}` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="price-bold">{Number(pack.price).toFixed(3)} DT</p>
                            </div>
                          </div>
                          <div className="card-actions">
                            <button className="btn-edit" onClick={() => startEditPack(pack)}>✏️</button>
                            <button className="btn-delete" onClick={() => handleDeletePack(pack.id)}>✕</button>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </section>
          </div>
        )}

      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Admin;
