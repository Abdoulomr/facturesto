import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { Card, CardContent } from '@/app/components/ui/card';
import UserTable from './UserTable';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Dashboard Admin</h1>
        <p className="text-stone-500 text-sm mt-1">Gestion des utilisateurs</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <UserTable initialUsers={serialized} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
