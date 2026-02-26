'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/app/lib/auth-client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent } from '@/app/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'signin') {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          const code = result.error.code;
          if (code === 'INVALID_EMAIL_OR_PASSWORD') setError('Email ou mot de passe incorrect.');
          else if (code === 'USER_NOT_FOUND') setError('Aucun compte trouvé avec cet email.');
          else if (code === 'TOO_MANY_REQUESTS') setError('Trop de tentatives. Réessayez dans quelques minutes.');
          else setError(result.error.message ?? 'Erreur de connexion. Vérifiez vos identifiants.');
          return;
        }
      } else {
        if (password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères.');
          return;
        }
        const result = await authClient.signUp.email({ email, password, name });
        if (result.error) {
          const code = result.error.code;
          if (code === 'USER_ALREADY_EXISTS') setError('Un compte existe déjà avec cet email.');
          else if (code === 'WEAK_PASSWORD') setError('Mot de passe trop faible.');
          else setError(result.error.message ?? "Erreur lors de l'inscription.");
          return;
        }
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <span className="text-4xl">🍽</span>
          <span className="text-2xl font-bold text-amber-600 tracking-tight">FactuResto</span>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex border-b border-stone-200 mb-6">
              <button
                onClick={() => { setTab('signin'); setError(''); }}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  tab === 'signin'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => { setTab('signup'); setError(''); }}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  tab === 'signup'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                S&apos;inscrire
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'signup' && (
                <div className="space-y-1">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                {loading
                  ? 'Chargement…'
                  : tab === 'signin'
                  ? 'Se connecter'
                  : 'Créer un compte'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
