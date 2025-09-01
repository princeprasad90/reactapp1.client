import React, { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import styles from './MainLayout.module.css';
import { authEndpoints } from '../services/api';

interface Props {
  children: ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const { loggedIn, user, logout } = useAuth();

  const handleLogout = () => {
    fetch(authEndpoints.LOGOUT_URL, { method: 'POST', credentials: 'include' }).finally(() => {
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
              <NavLink to="/examples" className={({isActive}) => isActive ? styles.active : ''}>Examples</NavLink>
              <NavLink to="/promocodes" className={({isActive}) => isActive ? styles.active : ''}>Promo Codes</NavLink>
              <NavLink to="/change-password" className={({isActive}) => isActive ? styles.active : ''}>Change Password</NavLink>
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
