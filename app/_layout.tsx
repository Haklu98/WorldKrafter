import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Still loading — don't redirect yet
    if (session === undefined) return;

    const inAuthGroup = ['', 'index', 'sign-in', 'register'].includes(segments[0] ?? '');

    if (session && inAuthGroup) {
      // Logged in but on a public screen → go to worlds
      router.replace('/worlds');
    } else if (!session && !inAuthGroup) {
      // Not logged in but on a protected screen → go to sign-in
      router.replace('/sign-in');
    }
  }, [session, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0f1a' },
        animation: 'slide_from_right',
      }}
    />
  );
}
