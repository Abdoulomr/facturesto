'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';
import { authClient } from '@/app/lib/auth-client';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/', label: 'Factures' },
    { href: '/products', label: 'Produits' },
  ];

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="bg-stone-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽</span>
          <span className="text-xl font-bold text-amber-400 tracking-tight">FactuResto</span>
        </div>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-stone-700 text-white'
                  : 'text-stone-300 hover:bg-stone-700 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
          {session?.user?.role === 'admin' && (
            <Link
              href="/dashboard"
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === '/dashboard'
                  ? 'bg-stone-700 text-white'
                  : 'text-stone-300 hover:bg-stone-700 hover:text-white'
              )}
            >
              Dashboard
            </Link>
          )}
          <Button asChild className="ml-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold">
            <Link href="/invoices/new">+ Nouvelle Facture</Link>
          </Button>
          {session?.user && (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-stone-700">
              <span className="text-xs text-stone-400 hidden sm:block">{session.user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-stone-300 hover:text-white hover:bg-stone-700"
              >
                Déconnexion
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
