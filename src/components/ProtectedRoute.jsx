import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cngjgwtnaoecuwgakrpj.supabase.co',
  'sb_publishable_4AchmnqFGUX3epT2torLPw_u-ij7hkP'
);

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed,   setAuthed]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) return null; // or a spinner
  return authed ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
