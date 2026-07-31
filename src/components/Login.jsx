import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { Loader2, Shirt } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMsg({ type: 'ok', text: 'Account aangemaakt. Bevestig eventueel je e-mail en log daarna in.' });
          setMode('login');
        }
        // Bij directe sessie pikt AuthContext (onAuthStateChange) het automatisch op.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
            <Shirt className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-3xl text-foreground">Outfit AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Je persoonlijke stylist</p>
        </div>

        <button
          type="button"
          onClick={() => base44.auth.signInWithGoogle(window.location.origin)}
          className="w-full bg-card border border-border rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 hover:bg-accent transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          Inloggen met Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">of met e-mail</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mailadres"
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wachtwoord (min. 6 tekens)"
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition"
          />

          {msg && (
            <p className={`text-sm ${msg.type === 'err' ? 'text-red-500' : 'text-foreground'}`}>{msg.text}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null); }}
          className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground transition"
        >
          {mode === 'login' ? 'Nog geen account? Maak er een aan' : 'Al een account? Inloggen'}
        </button>
      </div>
    </div>
  );
}
