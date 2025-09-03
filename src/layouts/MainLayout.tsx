import React from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import styles from './MainLayout.module.css';
import { authEndpoints, apiFetch } from '../services/api';
import axios from 'axios';

interface Props {
  children: ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const { loggedIn, user, logout } = useAuth();
  const [menus, setMenus] = React.useState<{ id: string; label: string; path: string }[]>([]);

  React.useEffect(() => {
    if (!loggedIn) { setMenus([]); return; }
    const pid = user?.profileId ? `?profileId=${encodeURIComponent(user.profileId)}` : '';
    apiFetch(`/api/menus${pid}`)
      .then(res => setMenus(res.data.items || []))
      .catch(() => setMenus([]));
  }, [loggedIn, user?.profileId]);

  const handleLogout = () => {
    axios.post(authEndpoints.LOGOUT_URL, undefined, { withCredentials: true }).finally(() => {
      logout();
      navigate('/login');
    });
  };

  const initials = (user?.name || '').trim().slice(0, 1).toUpperCase();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}><Link to={loggedIn ? '/examples' : '/login'}>Sample App</Link></div>
        <nav className={styles.nav}>
          {loggedIn ? (
            <>
              {menus.map(m => (
                <NavLink key={m.id} to={m.path} className={({isActive}) => isActive ? styles.active : ''}>{m.label}</NavLink>
              ))}
            </>
          ) : (
            <NavLink to="/login" className={({isActive}) => isActive ? styles.active : ''}>Login</NavLink>
          )}
        </nav>
        <div className={styles.profile}>
          {loggedIn && (
            <>
              <div className={styles.avatar} aria-hidden>{initials || 'U'}</div>
              <span className={styles.username}>{user?.name}</span>
              <button className={styles.logout} onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>© {new Date().getFullYear()} Sample App</footer>
    </div>
  );
};

export default MainLayout;
