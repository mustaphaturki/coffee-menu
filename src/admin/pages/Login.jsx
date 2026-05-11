import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import '../../styles/App.css';



// username → supabase email mapping
const USER_MAP = {
  'adminADMIN': 'admin@brewblend.com',
};

let toastTimer;

const Login = () => {
  const navigate  = useNavigate();
  const [theme,    setTheme]   = useState(() => localStorage.getItem('bb-theme') || 'light');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null);
  const [showPass, setShowPass] = useState(false);

  const showToast = (msg) => {
    clearTimeout(toastTimer);
    setToast(msg);
    toastTimer = setTimeout(() => setToast(null), 3400);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = USER_MAP[username.trim()];
    if (!email) { showToast('❌ Unknown username.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/admin');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Invalid credentials.'));
    }
    setLoading(false);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('bb-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="app-root" data-theme={theme}>
      <div className="login-page">

        {/* theme toggle */}
        <button className="theme-btn login-theme-btn" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="login-card">
          <div className="login-brand">
            <span className="login-icon">☕</span>
            <h1 className="admin-logo login-logo">Eryx Coffee</h1>
            <p className="login-sub">Admin Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field">
              <label className="field-label">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-add login-btn" disabled={loading}>
              {loading ? <span className="dots"><span/><span/><span/></span> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Login;
