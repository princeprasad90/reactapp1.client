import React from 'react';
import styles from './Login.module.css';
import { authEndpoints } from '../../services/api';

const Login: React.FC = () => {
  const callbackUrl = React.useMemo(() => `${window.location.origin}/auth/callback`, []);

  const beginLogin = React.useCallback(() => {
    const url = new URL(authEndpoints.LOGIN_URL, window.location.origin);
    url.searchParams.set('returnUrl', callbackUrl);
    window.location.href = url.toString();
  }, [callbackUrl]);

  React.useEffect(() => {
    // Optionally auto-redirect
    // beginLogin();
  }, [beginLogin]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome</h2>
        <p style={{marginBottom: '0.75rem'}}>Sign in via your organization’s access portal.</p>
        <button className={styles.button} onClick={beginLogin}>Continue to Sign In</button>
      </div>
    </div>
  );
};

export default Login;
