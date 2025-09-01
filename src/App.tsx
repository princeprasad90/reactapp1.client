import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './store/auth';
import MainLayout from './layouts/MainLayout';
import { useWireTokens } from './services/api';

const AppContent: React.FC = () => {
  useWireTokens();
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
