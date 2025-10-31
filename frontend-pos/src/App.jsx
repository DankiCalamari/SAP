import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store';
import LoginScreen from './screens/LoginScreen';
import POSScreen from './screens/POSScreen';
import './App.css';

export default function App() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <POSScreen /> : <LoginScreen />;
}
