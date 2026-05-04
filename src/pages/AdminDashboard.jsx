import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import '../App.css';

const supabase = createClient(
  'https://cngjgwtnaoecuwgakrpj.supabase.co',
  'sb_publishable_4AchmnqFGUX3epT2torLPw_u-ij7hkP'
);

const BUCKET_NAME = 'menu-images';
const CATEGORY_TABLE = 'categories';
const CATEGORY_STORAGE_KEY = 'bb-admin-categories';
const ITEM_BATCH_SIZE = 8;
const PACK_BATCH_SIZE = 8;

const DEFAULT_ITEM_CATEGORIES = [
  { name: 'Coffee', icon: '☕' },
  { name: 'Drinks', icon: '🧃' },
  { name: 'Pastry', icon: '🥐' },
  { name: 'Dessert', icon: '🍮' },
  { name: 'Sweets', icon: '🍬' },
  { name: 'Chicha', icon: '💨' },
];

const DEFAULT_PACK_CATEGORIES = [
  { name: 'Petit Déj', icon: '🌅' },
  { name: 'Lunch', icon: '🌞' },
  { name: 'Dinner', icon: '🌙' },
  { name: 'Other', icon: '🎁' },
];

const DEFAULT_CATEGORY_ICONS = {
  Coffee: '☕',
  Drinks: '🧃',
  Pastry: '🥐',
  Dessert: '🍮',
  Sweets: '🍬',
  Chicha: '💨',
  'Petit Déj': '🌅',
  Lunch: '🌞',
  Dinner: '🌙',
  Other: '🎁',
};

const ICON_CHOICES = ['☕', '🧃', '🥐', '🍮', '🍬', '💨', '🌅', '🌞', '🌙', '🎁', '🥤', '🍰', '🍩', '🍪', '🥪', '🥗', '🫖', '🍵', '🍦', '🍫'];

let toastTimer;

const sortByName = (a, b) => a.name.localeCompare(b.name);

const normalizeCategory = (entry, fallbackKind) => ({
  id: entry.id,
  name: entry.name,
  kind: entry.kind || fallbackKind,
  icon: entry.icon || DEFAULT_CATEGORY_ICONS[entry.name] || '•',
  is_active: entry.is_active !== false,
  sort_order: entry.sort_order ?? 0,
  created_at: entry.created_at,
});

const getStarterCategories = (kind) => (
  (kind === 'item' ? DEFAULT_ITEM_CATEGORIES : DEFAULT_PACK_CATEGORIES).map((entry, index) => ({
    id: `starter-${kind}-${index}`,
    name: entry.name,
    kind,
    icon: entry.icon,
    is_active: true,
    sort_order: index,
  }))
);

const readLocalCategories = () => {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalCategories = (entries) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(entries));
};

const getCategoryLabelIcon = (categoryName, fallbackKind) => {
  if (DEFAULT_CATEGORY_ICONS[categoryName]) return DEFAULT_CATEGORY_ICONS[categoryName];
  if (fallbackKind === 'item') return '•';
  if (fallbackKind === 'pack') return '🎁';
  return '•';
};

const mergeSelectedCategory = (categories, selectedName, kind) => {
  if (!selectedName) return categories;
  if (categories.some((category) => category.name === selectedName)) return categories;
  return [
    {
      id: `selected-${kind}-${selectedName}`,
      name: selectedName,
      kind,
      icon: getCategoryLabelIcon(selectedName, kind),
      is_active: true,
      sort_order: -1,
      temporary: true,
    },
    ...categories,
  ];
};

const AdminDashboard = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('bb-theme') || 'light');
  const [tab, setTab] = useState('menu');
  const [workspaceView, setWorkspaceView] = useState('management');
  const [toast, setToast] = useState(null);

  const [items, setItems] = useState([]);
  const [packs, setPacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesReady, setCategoriesReady] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [categoryKind, setCategoryKind] = useState('item');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');
  const [itemAvailabilityFilter, setItemAvailabilityFilter] = useState('all');
  const [itemVisibleCount, setItemVisibleCount] = useState(ITEM_BATCH_SIZE);

  const [editingPack, setEditingPack] = useState(null);
  const [packName, setPackName] = useState('');
  const [packDesc, setPackDesc] = useState('');
  const [packPrice, setPackPrice] = useState('');
  const [packImage, setPackImage] = useState(null);
  const [packPreview, setPackPreview] = useState(null);
  const [packQty, setPackQty] = useState({});
  const [packCat, setPackCat] = useState('Petit Déj');
  const [loadingPack, setLoadingPack] = useState(false);
  const [packSearch, setPackSearch] = useState('');
  const [packCategoryFilter, setPackCategoryFilter] = useState('all');
  const [packAvailabilityFilter, setPackAvailabilityFilter] = useState('all');
  const [packVisibleCount, setPackVisibleCount] = useState(PACK_BATCH_SIZE);

  const [customMenuUrl, setCustomMenuUrl] = useState(() => {
    try {
      return localStorage.getItem('bb-custom-menu-url') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bb-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setItemVisibleCount(ITEM_BATCH_SIZE);
  }, [itemSearch, itemCategoryFilter, itemAvailabilityFilter, tab]);

  useEffect(() => {
    setPackVisibleCount(PACK_BATCH_SIZE);
  }, [packSearch, packCategoryFilter, packAvailabilityFilter, tab]);

  const showToast = (msg) => {
    clearTimeout(toastTimer);
    setToast(msg);
    toastTimer = setTimeout(() => setToast(null), 3400);
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('id, name, price, category, image_url, available, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
      return data || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchPacks = async () => {
    try {
      const { data, error } = await supabase
        .from('packs')
        .select('id, name, description, price, image_url, item_quantities, item_ids, available, pack_category, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPacks(data || []);
      return data || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from(CATEGORY_TABLE)
        .select('id, name, kind, icon, is_active, sort_order, created_at');
      if (error) throw error;
      setCategories((data || []).map((entry) => normalizeCategory(entry, entry.kind)));
      setCategoriesReady(true);
      return data || [];
    } catch (err) {
      console.error(err);
      const localCategories = readLocalCategories().map((entry) => normalizeCategory(entry, entry.kind));
      const fallbackCategories = localCategories.length > 0
        ? localCategories
        : [
            ...getStarterCategories('item'),
            ...getStarterCategories('pack'),
          ];
      if (localCategories.length === 0) {
        writeLocalCategories(fallbackCategories.map((entry, index) => ({
          id: entry.id,
          name: entry.name,
          kind: entry.kind,
          icon: entry.icon,
          is_active: true,
          sort_order: index,
          created_at: new Date().toISOString(),
        })));
      }
      setCategories(fallbackCategories);
      setCategoriesReady(false);
      return [];
    }
  };

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    await Promise.all([fetchCategories(), fetchItems(), fetchPacks()]);
    setLoadingDashboard(false);
  };

  const menuUrl = useMemo(() => {
    if (customMenuUrl) return customMenuUrl;
    if (typeof window === 'undefined') return '/';
    return `${window.location.origin}/`;
  }, [customMenuUrl]);

  const handlePrintQr = () => {
    window.print();
  };

  const syncPackAvailability = async (latestItems) => {
    try {
      const { data: allPacks } = await supabase.from('packs').select('id, item_quantities');
      if (!allPacks) return;

      await Promise.all(allPacks.map((pack) => {
        const ids = Object.keys(pack.item_quantities || {});
        const available = ids.length === 0 ? true : ids.every((id) => {
          const item = latestItems.find((entry) => String(entry.id) === String(id));
          return item?.available !== false;
        });
        return supabase.from('packs').update({ available }).eq('id', pack.id);
      }));

      fetchPacks();
    } catch (err) {
      console.error(err);
    }
  };

  const makeImageHandler = (setFile, setThumb) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Please select an image file.');
      return;
    }
    setFile(file);
    setThumb(URL.createObjectURL(file));
    e.target.value = '';
  };

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET_NAME)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    if (!pub?.publicUrl) throw new Error('Could not get public URL.');
    return pub.publicUrl;
  };

  const activeCategoryKind = editingCategory?.kind || categoryKind;

  const itemCategories = useMemo(() => {
    const remote = categories
      .filter((entry) => entry.kind === 'item' && entry.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || sortByName(a, b));
    return remote.length > 0 ? remote : getStarterCategories('item');
  }, [categories]);

  const packCategories = useMemo(() => {
    const remote = categories
      .filter((entry) => entry.kind === 'pack' && entry.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || sortByName(a, b));
    return remote.length > 0 ? remote : getStarterCategories('pack');
  }, [categories]);

  const managedCategories = useMemo(() => {
    return categories
      .filter((entry) => entry.kind === activeCategoryKind)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || sortByName(a, b));
  }, [categories, activeCategoryKind]);

  const selectedItemCategories = useMemo(
    () => mergeSelectedCategory(itemCategories, category, 'item'),
    [itemCategories, category]
  );

  const selectedPackCategories = useMemo(
    () => mergeSelectedCategory(packCategories, packCat, 'pack'),
    [packCategories, packCat]
  );

  const itemCategoryMap = useMemo(() => {
    return new Map(itemCategories.map((entry) => [entry.name, entry]));
  }, [itemCategories]);

  const packCategoryMap = useMemo(() => {
    return new Map(packCategories.map((entry) => [entry.name, entry]));
  }, [packCategories]);

  const filteredItems = useMemo(() => {
    return items.filter((entry) => {
      const matchesSearch = entry.name.toLowerCase().includes(itemSearch.toLowerCase());
      const matchesCategory = itemCategoryFilter === 'all' || entry.category === itemCategoryFilter;
      const matchesAvailability = itemAvailabilityFilter === 'all'
        || (itemAvailabilityFilter === 'in' && entry.available !== false)
        || (itemAvailabilityFilter === 'out' && entry.available === false);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [items, itemSearch, itemCategoryFilter, itemAvailabilityFilter]);

  const filteredPacks = useMemo(() => {
    return packs.filter((entry) => {
      const matchesSearch = entry.name.toLowerCase().includes(packSearch.toLowerCase());
      const matchesCategory = packCategoryFilter === 'all' || (entry.pack_category || 'Other') === packCategoryFilter;
      const matchesAvailability = packAvailabilityFilter === 'all'
        || (packAvailabilityFilter === 'in' && entry.available !== false)
        || (packAvailabilityFilter === 'out' && entry.available === false);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [packs, packSearch, packCategoryFilter, packAvailabilityFilter]);

  const visibleItems = filteredItems.slice(0, itemVisibleCount);
  const visiblePacks = filteredPacks.slice(0, packVisibleCount);

  const counts = {
    totalItems: items.length,
    inStock: items.filter((entry) => entry.available !== false).length,
    packs: packs.length,
    itemCategories: itemCategories.length,
    packCategories: packCategories.length,
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
    setPreview(item.image_url);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditItem = () => {
    setEditingItem(null);
    setName('');
    setPrice('');
    setCategory(itemCategories[0]?.name || 'Coffee');
    setPreview(null);
    setImageFile(null);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!name || !price || (!imageFile && !editingItem)) {
      showToast('⚠️ Fill all fields.');
      return;
    }
    setLoadingItem(true);
    try {
      let image_url = editingItem?.image_url || null;
      if (imageFile) image_url = await uploadImage(imageFile);
      const payload = {
        name,
        price: parseFloat(price),
        category,
        image_url,
      };
      if (editingItem) {
        const { error } = await supabase.from('menu').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        showToast('✏️ Item updated!');
      } else {
        const { error } = await supabase.from('menu').insert([payload]).select();
        if (error) throw error;
        showToast('☕ Item added!');
      }
      cancelEditItem();
      const latest = await fetchItems();
      await syncPackAvailability(latest);
    } catch (err) {
      showToast('❌ ' + (err.message || 'Error.'));
    }
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
    } catch {
      showToast('❌ Error deleting item.');
    }
  };

  const toggleAvail = async (id, cur) => {
    try {
      const { error } = await supabase.from('menu').update({ available: !cur }).eq('id', id);
      if (error) throw error;
      const latest = await fetchItems();
      await syncPackAvailability(latest);
    } catch {
      showToast('❌ Error updating status.');
    }
  };

  const setQty = (itemId, qty) => {
    if (qty <= 0) {
      setPackQty((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }
    setPackQty((prev) => ({ ...prev, [itemId]: qty }));
  };

  const startEditPack = (pack) => {
    setEditingPack(pack);
    setPackName(pack.name);
    setPackDesc(pack.description || '');
    setPackPrice(pack.price);
    setPackPreview(pack.image_url);
    setPackQty(pack.item_quantities || {});
    setPackImage(null);
    setPackCat(pack.pack_category || 'Other');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditPack = () => {
    setEditingPack(null);
    setPackName('');
    setPackDesc('');
    setPackPrice('');
    setPackImage(null);
    setPackPreview(null);
    setPackQty({});
    setPackCat(packCategories[0]?.name || 'Petit Déj');
  };

  const handleSubmitPack = async (e) => {
    e.preventDefault();
    const hasItems = Object.keys(packQty).length > 0;
    if (!packName || !packPrice || (!packImage && !editingPack) || !hasItems) {
      showToast('⚠️ Fill all fields & add at least one item.');
      return;
    }
    setLoadingPack(true);
    try {
      let image_url = editingPack?.image_url || null;
      if (packImage) image_url = await uploadImage(packImage);
      const item_ids = Object.keys(packQty);
      const available = item_ids.every((id) => items.find((entry) => String(entry.id) === String(id))?.available !== false);
      const payload = {
        name: packName,
        description: packDesc,
        price: parseFloat(packPrice),
        image_url,
        item_quantities: packQty,
        item_ids,
        available,
        pack_category: packCat,
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
      cancelEditPack();
      fetchPacks();
    } catch (err) {
      showToast('❌ ' + (err.message || 'Error.'));
    }
    setLoadingPack(false);
  };

  const handleDeletePack = async (id) => {
    if (!window.confirm('Delete this pack?')) return;
    try {
      const { error } = await supabase.from('packs').delete().eq('id', id);
      if (error) throw error;
      fetchPacks();
      showToast('Pack removed.');
    } catch {
      showToast('❌ Error deleting pack.');
    }
  };

  const startEditCategory = (entry) => {
    setEditingCategory(entry);
    setCategoryKind(entry.kind || 'item');
    setCategoryName(entry.name);
    setCategoryIcon(entry.icon || getCategoryLabelIcon(entry.name, entry.kind));
    setIconPickerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('');
    setCategoryKind('item');
    setIconPickerOpen(false);
  };

  const linkedCategoryCount = (entry) => {
    if (entry.kind === 'item') {
      return items.filter((item) => item.category === entry.name).length;
    }
    return packs.filter((pack) => (pack.pack_category || 'Other') === entry.name).length;
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const trimmedName = categoryName.trim();
    const trimmedIcon = categoryIcon.trim();
    if (!trimmedName) {
      showToast('⚠️ Name your category.');
      return;
    }

    setCategoryBusy(true);
    try {
      if (editingCategory) {
        const oldName = editingCategory.name;
        if (categoriesReady) {
          const payload = {
            name: trimmedName,
            kind: editingCategory.kind,
            icon: trimmedIcon || null,
            is_active: editingCategory.is_active !== false,
          };
          const { error } = await supabase.from(CATEGORY_TABLE).update(payload).eq('id', editingCategory.id);
          if (error) throw error;
          if (oldName !== trimmedName) {
            if (editingCategory.kind === 'item') {
              await supabase.from('menu').update({ category: trimmedName }).eq('category', oldName);
            }
            if (editingCategory.kind === 'pack') {
              await supabase.from('packs').update({ pack_category: trimmedName }).eq('pack_category', oldName);
            }
          }
        } else {
          const nextLocal = readLocalCategories().map((entry) => {
            if (entry.id !== editingCategory.id) return entry;
            return {
              ...entry,
              name: trimmedName,
              icon: trimmedIcon || entry.icon || null,
              kind: entry.kind,
            };
          });
          writeLocalCategories(nextLocal);
          setCategories(nextLocal.map((entry) => normalizeCategory(entry, entry.kind)));
        }
        showToast('Category updated.');
      } else {
        if (categoriesReady) {
          const payload = {
            name: trimmedName,
            kind: categoryKind,
            icon: trimmedIcon || null,
            is_active: true,
          };
          const { error } = await supabase.from(CATEGORY_TABLE).insert([payload]).select();
          if (error) throw error;
        } else {
          const nextLocal = [
            ...readLocalCategories(),
            {
              id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: trimmedName,
              kind: categoryKind,
              icon: trimmedIcon || getCategoryLabelIcon(trimmedName, categoryKind),
              is_active: true,
              sort_order: readLocalCategories().length,
              created_at: new Date().toISOString(),
            },
          ];
          writeLocalCategories(nextLocal);
          setCategories(nextLocal.map((entry) => normalizeCategory(entry, entry.kind)));
        }
        showToast('Category created.');
      }
      cancelEditCategory();
      await loadDashboard();
    } catch (err) {
      showToast('❌ ' + (err.message || 'Could not save category.'));
    }
    setCategoryBusy(false);
  };

  const toggleCategoryVisibility = async (entry) => {
    try {
      const nextActive = entry.is_active === false;
      if (categoriesReady) {
        const { error } = await supabase.from(CATEGORY_TABLE).update({ is_active: nextActive }).eq('id', entry.id);
        if (error) throw error;
      } else {
        const nextLocal = readLocalCategories().map((categoryEntry) => (
          categoryEntry.id === entry.id ? { ...categoryEntry, is_active: nextActive } : categoryEntry
        ));
        writeLocalCategories(nextLocal);
        setCategories(nextLocal.map((categoryEntry) => normalizeCategory(categoryEntry, categoryEntry.kind)));
      }
      showToast(nextActive ? 'Category restored.' : 'Category hidden.');
      await loadDashboard();
    } catch (err) {
      showToast('❌ ' + (err.message || 'Could not update category.'));
    }
  };

  const handleDeleteCategory = async (entry) => {
    const linkedCount = linkedCategoryCount(entry);
    if (linkedCount > 0) {
      showToast('⚠️ Move or update linked items/packs before deleting this category.');
      return;
    }

    if (!window.confirm(`Delete "${entry.name}"?`)) return;

    try {
      if (categoriesReady) {
        const { error } = await supabase.from(CATEGORY_TABLE).delete().eq('id', entry.id);
        if (error) throw error;
      } else {
        const nextLocal = readLocalCategories().filter((categoryEntry) => categoryEntry.id !== entry.id);
        writeLocalCategories(nextLocal);
        setCategories(nextLocal.map((categoryEntry) => normalizeCategory(categoryEntry, categoryEntry.kind)));
      }
      showToast('Category deleted.');
      await loadDashboard();
    } catch (err) {
      showToast('❌ ' + (err.message || 'Could not delete category.'));
    }
  };

  const categoryCards = managedCategories.length > 0 ? managedCategories : [];

  const browserNotice = categoriesReady
    ? 'Categories are fully managed from the studio above.'
    : 'Starter categories are used in the forms until the categories table is available.';

  return (
    <div className="app-root" data-theme={theme}>
      <div className="admin-container admin-shell">
        <header className="admin-header">
          <div className="logo-area">
            <h1 className="admin-logo">Eryx Coffee ☕</h1>
            <p className="admin-subtitle">A cleaner dashboard for items, packs, and custom categories.</p>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <span className="status-dot" /> Live Dashboard
            </div>
            <button
              className="theme-btn"
              type="button"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              className="btn-cancel"
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="stat-bar">
          {[
            { label: 'Total Items', value: counts.totalItems },
            { label: 'In Stock', value: counts.inStock },
            { label: 'Item Categories', value: counts.itemCategories },
            { label: 'Pack Categories', value: counts.packCategories },
          ].map((stat, index) => (
            <div className="stat-card" key={stat.label} style={{ animationDelay: `${index * 0.08}s` }}>
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="workspace-shell">
          <div className="tabs workspace-tabs">
            <button
              type="button"
              className={`tab-btn${workspaceView === 'categories' ? ' tab-active' : ''}`}
              onClick={() => setWorkspaceView('categories')}
            >
              🗂️ Category Studio
            </button>
            <button
              type="button"
              className={`tab-btn${workspaceView === 'management' ? ' tab-active' : ''}`}
              onClick={() => setWorkspaceView('management')}
            >
              ☕ Item / Packs
            </button>
            <button
              type="button"
              className={`tab-btn${workspaceView === 'qr' ? ' tab-active' : ''}`}
              onClick={() => setWorkspaceView('qr')}
            >
              📎 QR Code
            </button>
          </div>

          {workspaceView === 'qr' && (
            <section className="qr-panel qr-print-only">
              <div className="qr-panel-copy">
                <h3 className="panel-title">Menu URL</h3>
                <div className="qr-url-input-box">
                  <input
                    type="url"
                    placeholder="https://animated-treacle-08d991.netlify.app/"
                    value={customMenuUrl}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setCustomMenuUrl(newUrl);
                      try {
                        localStorage.setItem('bb-custom-menu-url', newUrl);
                      } catch {}
                    }}
                    className="field"
                  />
                </div>
              </div>

              <div className="qr-panel-copy">
                <p className="panel-kicker">Public Menu</p>
                <h2 className="panel-title">QR code for the menu app</h2>
                <p className="panel-subtitle">
                  Print this card or save it as PDF for tables, posters, or takeaway menus.
                </p>
                <div className="qr-actions">
                  <button type="button" className="btn-add qr-open-btn" onClick={() => window.open(menuUrl, '_blank', 'noopener,noreferrer')}>
                    🔗 Open menu
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(menuUrl);
                        showToast('✅ Menu link copied');
                      } catch {
                        showToast('⚠️ Copy failed');
                      }
                    }}
                  >
                    Copy link
                  </button>
                  <button type="button" className="btn-cancel" onClick={handlePrintQr}>
                    🖨️ Save as PDF
                  </button>
                </div>
                <p className="qr-url">{menuUrl}</p>
              </div>

              <div className="qr-code-card" aria-label="Menu QR code">
                <QRCodeSVG
                  value={menuUrl}
                  size={168}
                  bgColor="transparent"
                  fgColor="currentColor"
                  level="M"
                  includeMargin
                />
              </div>
            </section>
          )}

          {workspaceView === 'categories' && (
            <section className="studio-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Category Studio</h2>
                  <p className="panel-subtitle">
                    Create and manage item categories and pack categories from one place.
                  </p>
                </div>
                <div className="panel-badge">{categoriesReady ? 'Saved in Supabase' : 'Starter mode'}</div>
              </div>

              <form className="studio-form" onSubmit={handleSubmitCategory}>
                <div className="form-header">
                  <h3 className="form-title">
                    {editingCategory ? <>Edit <span>Category</span></> : <>New <span>Category</span></>}
                  </h3>
                  {editingCategory && (
                    <button type="button" className="btn-cancel" onClick={cancelEditCategory}>
                      ✕ Cancel
                    </button>
                  )}
                </div>

                <div className="segment-tabs">
                  <button
                    type="button"
                    className={`segment-btn${activeCategoryKind === 'item' ? ' segment-active' : ''}`}
                    onClick={() => {
                      if (!editingCategory) setCategoryKind('item');
                    }}
                    disabled={!!editingCategory && editingCategory.kind !== 'item'}
                  >
                    ☕ Item categories
                  </button>
                  <button
                    type="button"
                    className={`segment-btn${activeCategoryKind === 'pack' ? ' segment-active' : ''}`}
                    onClick={() => {
                      if (!editingCategory) setCategoryKind('pack');
                    }}
                    disabled={!!editingCategory && editingCategory.kind !== 'pack'}
                  >
                    🎁 Pack categories
                  </button>
                </div>

                <div className="field">
                  <label className="field-label">Category Name</label>
                  <input
                    type="text"
                    placeholder={activeCategoryKind === 'item' ? 'e.g. Tea' : 'e.g. Breakfast Combo'}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Icon</label>
                  <div className="icon-picker-wrap">
                    <button
                      type="button"
                      className="icon-launch-btn"
                      onClick={() => setIconPickerOpen((open) => !open)}
                      aria-expanded={iconPickerOpen}
                    >
                      {categoryIcon || '🙂'}
                      <span>{iconPickerOpen ? 'Hide icons' : 'Pick icon'}</span>
                    </button>

                    {iconPickerOpen && (
                      <div className="icon-picker-popover">
                        <div className="icon-picker">
                          {ICON_CHOICES.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              className={`icon-chip${categoryIcon === icon ? ' icon-chip-active' : ''}`}
                              onClick={() => {
                                setCategoryIcon(icon);
                                setIconPickerOpen(false);
                              }}
                              aria-label={`Pick ${icon}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="icon-clear-btn"
                          onClick={() => {
                            setCategoryIcon('');
                            setIconPickerOpen(false);
                          }}
                        >
                          Clear icon
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn-add" disabled={categoryBusy}>
                  {categoryBusy ? <span className="dots"><span /><span /><span /></span> : editingCategory ? '💾 Save Category' : '＋ Create Category'}
                </button>

                <p className="studio-note">
                  {browserNotice}
                </p>
              </form>

              <div className="studio-browser">
                <div className="studio-browser-head">
                  <div>
                    <h3>{activeCategoryKind === 'item' ? 'Item categories' : 'Pack categories'}</h3>
                    <p>
                      {activeCategoryKind === 'item'
                        ? 'These feed the item form and the public menu filters.'
                        : 'These feed the pack form and pack filters.'}
                    </p>
                  </div>
                  <div className="studio-count">{categoryCards.length}</div>
                </div>

                <div className="category-list">
                  {categoryCards.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🗂️</span>
                      No custom categories yet.
                    </div>
                  ) : (
                    categoryCards.map((entry) => {
                      const count = linkedCategoryCount(entry);

                      return (
                        <article key={entry.id} className={`category-card${entry.is_active === false ? ' category-card-hidden' : ''}`}>
                          <div className="category-card-top">
                            <span className="category-card-icon">{entry.icon || getCategoryLabelIcon(entry.name, entry.kind)}</span>
                            <div>
                              <h4>{entry.name}</h4>
                              <p>{entry.kind === 'item' ? 'Menu item category' : 'Pack category'}</p>
                            </div>
                          </div>
                          <div className="category-card-meta">
                            <span className="category-count">{count} linked</span>
                            <span className={`category-status${entry.is_active === false ? ' category-status-off' : ''}`}>
                              {entry.is_active === false ? 'Hidden' : 'Active'}
                            </span>
                          </div>
                          <div className="category-card-actions">
                            <button type="button" className="btn-edit" onClick={() => startEditCategory(entry)}>
                              ✏️
                            </button>
                            <button type="button" className="btn-delete" onClick={() => toggleCategoryVisibility(entry)}>
                              {entry.is_active === false ? '↺' : 'Hide'}
                            </button>
                            <button type="button" className="category-delete-btn" onClick={() => handleDeleteCategory(entry)}>
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          )}

          {workspaceView === 'management' && (
            <>
              <div className="tabs">
                <button className={`tab-btn${tab === 'menu' ? ' tab-active' : ''}`} type="button" onClick={() => setTab('menu')}>
                  ☕ Menu Items
                </button>
                <button className={`tab-btn${tab === 'packs' ? ' tab-active' : ''}`} type="button" onClick={() => setTab('packs')}>
                  🎁 Packs &amp; Combos
                </button>
              </div>

              {tab === 'menu' && (
                <div className="admin-main">
            <form className="sticky-form" onSubmit={handleSubmitItem}>
              <div className="form-header">
                <h3 className="form-title">
                  {editingItem ? <>Edit <span>Item</span></> : <>Add New <span>Item</span></>}
                </h3>
                {editingItem && (
                  <button type="button" className="btn-cancel" onClick={cancelEditItem}>
                    ✕ Cancel
                  </button>
                )}
              </div>

              <label className="dropzone">
                {preview ? (
                  <img src={preview} alt="preview" className="preview-img" />
                ) : (
                  <>
                    <span className="dropzone-icon">📸</span>
                    <span className="dropzone-text">Click to upload photo</span>
                    <span className="dropzone-sub">JPG · PNG · WEBP</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={makeImageHandler(setImageFile, setPreview)} hidden />
              </label>

              <div className="field">
                <label className="field-label">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Caramel Macchiato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Price (DT)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Category</label>
                <div className="category-tags">
                  {selectedItemCategories.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`cat-tag${category === entry.name ? ' active-tag' : ''}`}
                      onClick={() => setCategory(entry.name)}
                    >
                      {entry.icon || getCategoryLabelIcon(entry.name, 'item')} {entry.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-add" disabled={loadingItem}>
                {loadingItem ? <span className="dots"><span /><span /><span /></span> : editingItem ? '💾 Save Changes' : '＋ Add to Menu'}
              </button>
            </form>

            <section className="management-zone">
              <div className="browser-toolbar">
                <div className="search-area search-area-compact">
                  <input
                    className="search-bar"
                    placeholder="🔍 Search by name…"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />
                </div>
                <div className="filter-row">
                  <select className="filter-select" value={itemCategoryFilter} onChange={(e) => setItemCategoryFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    {itemCategories.map((entry) => (
                      <option key={entry.id} value={entry.name}>{entry.name}</option>
                    ))}
                  </select>
                  <select className="filter-select" value={itemAvailabilityFilter} onChange={(e) => setItemAvailabilityFilter(e.target.value)}>
                    <option value="all">Any status</option>
                    <option value="in">In stock</option>
                    <option value="out">Out of stock</option>
                  </select>
                </div>
              </div>

              <div className="results-meta">
                <span>{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} found</span>
                <span>{visibleItems.length} shown</span>
              </div>

              <div className="inventory-list">
                {loadingDashboard ? (
                  <div className="empty-state">
                    <span className="empty-icon">⏳</span>
                    Loading items…
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">{itemSearch ? '🔍' : '☕'}</span>
                    {itemSearch ? 'No items match.' : 'No items yet.'}
                  </div>
                ) : (
                  visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className={`inventory-card${item.available === false ? ' out-of-stock' : ''}${editingItem?.id === item.id ? ' card-editing' : ''}`}
                    >
                      <div className="card-info">
                        <img src={item.image_url} className="item-thumb" alt={item.name} />
                        <div className="item-details">
                          <span className="category-badge">
                            {itemCategoryMap.get(item.category)?.icon || getCategoryLabelIcon(item.category, 'item')} {item.category}
                          </span>
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
                        <button type="button" className="btn-edit" onClick={() => startEditItem(item)}>✏️</button>
                        <button type="button" className="btn-delete" onClick={() => handleDeleteItem(item.id)}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredItems.length > visibleItems.length && (
                <button type="button" className="load-more-btn" onClick={() => setItemVisibleCount((count) => count + ITEM_BATCH_SIZE)}>
                  Show more items
                </button>
              )}
            </section>
                </div>
              )}

              {tab === 'packs' && (
                <div className="admin-main">
            <form className="sticky-form" onSubmit={handleSubmitPack}>
              <div className="form-header">
                <h3 className="form-title">
                  {editingPack ? <>Edit <span>Pack</span></> : <>Create a <span>Pack</span></>}
                </h3>
                {editingPack && (
                  <button type="button" className="btn-cancel" onClick={cancelEditPack}>
                    ✕ Cancel
                  </button>
                )}
              </div>

              <label className="dropzone">
                {packPreview ? (
                  <img src={packPreview} alt="pack" className="preview-img" />
                ) : (
                  <>
                    <span className="dropzone-icon">🖼️</span>
                    <span className="dropzone-text">Upload pack photo</span>
                    <span className="dropzone-sub">JPG · PNG · WEBP</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={makeImageHandler(setPackImage, setPackPreview)} hidden />
              </label>

              <div className="field">
                <label className="field-label">Pack Name</label>
                <input
                  type="text"
                  placeholder="e.g. Petit Déjeuner"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <textarea
                  className="field-textarea"
                  rows={3}
                  placeholder="What's included? Any special notes…"
                  value={packDesc}
                  onChange={(e) => setPackDesc(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Pack Price (DT)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={packPrice}
                  onChange={(e) => setPackPrice(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Pack Category</label>
                <div className="category-tags">
                  {selectedPackCategories.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`cat-tag${packCat === entry.name ? ' active-tag' : ''}`}
                      onClick={() => setPackCat(entry.name)}
                    >
                      {entry.icon || getCategoryLabelIcon(entry.name, 'pack')} {entry.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  Items &amp; Quantities
                  {Object.keys(packQty).length > 0 && (
                    <span className="field-count"> · {Object.keys(packQty).length} item{Object.keys(packQty).length > 1 ? 's' : ''}</span>
                  )}
                </label>
                <div className="item-picker">
                  {items.length === 0 ? (
                    <p className="picker-empty">Add menu items first.</p>
                  ) : (
                    items.map((item) => {
                      const qty = packQty[item.id] || 0;
                      const selected = qty > 0;
                      return (
                        <div
                          key={item.id}
                          className={`picker-item${selected ? ' picker-selected' : ''}${item.available === false ? ' picker-unavailable' : ''}`}
                        >
                          <img src={item.image_url} alt={item.name} className="picker-thumb" />
                          <span className="picker-name">{item.name}</span>
                          {item.available === false && <span className="picker-tag-unavail">Out</span>}
                          <div className="qty-ctrl" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="qty-btn" onClick={() => setQty(item.id, qty - 1)}>−</button>
                            <span className="qty-num">{qty}</span>
                            <button type="button" className="qty-btn" onClick={() => setQty(item.id, qty + 1)}>+</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <button type="submit" className="btn-add" disabled={loadingPack}>
                {loadingPack ? <span className="dots"><span /><span /><span /></span> : editingPack ? '💾 Save Changes' : '🎁 Create Pack'}
              </button>
            </form>

            <section className="management-zone">
              <div className="browser-toolbar">
                <div className="search-area search-area-compact">
                  <input
                    className="search-bar"
                    placeholder="🔍 Search packs…"
                    value={packSearch}
                    onChange={(e) => setPackSearch(e.target.value)}
                  />
                </div>
                <div className="filter-row">
                  <select className="filter-select" value={packCategoryFilter} onChange={(e) => setPackCategoryFilter(e.target.value)}>
                    <option value="all">All categories</option>
                    {packCategories.map((entry) => (
                      <option key={entry.id} value={entry.name}>{entry.name}</option>
                    ))}
                  </select>
                  <select className="filter-select" value={packAvailabilityFilter} onChange={(e) => setPackAvailabilityFilter(e.target.value)}>
                    <option value="all">Any status</option>
                    <option value="in">In stock</option>
                    <option value="out">Out of stock</option>
                  </select>
                </div>
              </div>

              <div className="results-meta">
                <span>{filteredPacks.length} pack{filteredPacks.length === 1 ? '' : 's'} found</span>
                <span>{visiblePacks.length} shown</span>
              </div>

              <div className="inventory-list">
                {loadingDashboard ? (
                  <div className="empty-state">
                    <span className="empty-icon">⏳</span>
                    Loading packs…
                  </div>
                ) : visiblePacks.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🎁</span>
                    {packSearch ? 'No packs match.' : 'No packs yet.'}
                  </div>
                ) : (
                  visiblePacks.map((pack) => {
                    const qty = pack.item_quantities || {};
                    const included = Object.entries(qty)
                      .map(([id, q]) => ({ item: items.find((entry) => String(entry.id) === String(id)), q }))
                      .filter(({ item }) => item);

                    return (
                      <div
                        key={pack.id}
                        className={`inventory-card${pack.available === false ? ' out-of-stock' : ''}${editingPack?.id === pack.id ? ' card-editing' : ''}`}
                      >
                        <div className="card-info">
                          <img src={pack.image_url} className="item-thumb" alt={pack.name} />
                          <div className="item-details">
                            <span className="category-badge pack-badge">
                              {packCategoryMap.get(pack.pack_category || 'Other')?.icon || getCategoryLabelIcon(pack.pack_category || 'Other', 'pack')} Pack
                            </span>
                            <h3>{pack.name}</h3>
                            {pack.description && <p className="pack-desc">{pack.description}</p>}
                            {included.length > 0 && (
                              <div className="pack-chips">
                                {included.map(({ item, q }) => (
                                  <span key={item.id} className="pack-chip">
                                    {itemCategoryMap.get(item.category)?.icon || getCategoryLabelIcon(item.category, 'item')} {item.name}{q > 1 ? ` ×${q}` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="price-bold">{Number(pack.price).toFixed(3)} DT</p>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button type="button" className="btn-edit" onClick={() => startEditPack(pack)}>✏️</button>
                          <button type="button" className="btn-delete" onClick={() => handleDeletePack(pack.id)}>✕</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {filteredPacks.length > visiblePacks.length && (
                <button type="button" className="load-more-btn" onClick={() => setPackVisibleCount((count) => count + PACK_BATCH_SIZE)}>
                  Show more packs
                </button>
              )}
            </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default AdminDashboard;
