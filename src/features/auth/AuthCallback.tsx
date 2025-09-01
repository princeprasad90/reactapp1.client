import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';

function parseTokensFromLocation() {
  const out: { accessToken?: string; refreshToken?: string } = {};
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  out.accessToken = q.get('access_token') || h.get('access_token') || undefined;
  out.refreshToken = q.get('refresh_token') || h.get('refresh_token') || undefined;
  return out;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  React.useEffect(() => {
    const { accessToken, refreshToken } = parseTokensFromLocation();
    if (accessToken) {
      loginWithTokens({ accessToken, refreshToken: refreshToken ?? null });
      // cleanup the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/examples');
    } else {
      // No tokens: send user to login route
      navigate('/login');
    }
  }, [navigate, loginWithTokens]);

  return <div>Signing you in…</div>;
};

export default AuthCallback;

