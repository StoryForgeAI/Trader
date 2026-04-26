'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Finishing your sign-in...');

  useEffect(() => {
    async function finishAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          window.location.replace('/dashboard');
          return;
        }

        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) throw refreshError;

        if (refreshedSession?.user) {
          window.location.replace('/dashboard');
          return;
        }

        throw new Error('Could not complete Google sign-in. Please try again.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
      }
    }

    void finishAuth();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4fbff] px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-sky-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(117,149,176,0.12)]">
        <LoaderCircle className="mx-auto animate-spin text-sky-500" size={34} />
        <div className="mt-5 text-lg font-black text-slate-900">Google sign-in</div>
        <div className="mt-2 text-sm leading-7 text-slate-600">{message}</div>
      </div>
    </main>
  );
}
