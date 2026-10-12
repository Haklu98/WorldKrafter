import React, { useEffect, useState } from 'react';
import OnboardingPage from './pages/Onboarding';
import DashboardPage from './pages/Dashboard';
import type { World } from './types';

type AppState = 'loading' | 'onboarding' | 'dashboard';

export default function App() {
  const [state, setState] = useState<AppState>('loading');
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);

  useEffect(() => {
    window.api.worlds.getAll().then(worlds => {
      setState(worlds.length === 0 ? 'onboarding' : 'dashboard');
    });
  }, []);

  if (state === 'loading') return null;

  if (state === 'onboarding') {
    return <OnboardingPage onComplete={() => setState('dashboard')} />;
  }

  return (
    <DashboardPage
      onSelectWorld={world => setSelectedWorld(world)}
    />
  );
}
