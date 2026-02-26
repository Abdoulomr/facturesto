'use client';

import { useState } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UserTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleRole(user: User) {
    if (user.id === currentUserId) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/dashboard/users/${user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Inscrit le</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-stone-600">{user.email}</TableCell>
              <TableCell>
                <Badge
                  className={
                    user.role === 'admin'
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-100'
                  }
                >
                  {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                </Badge>
              </TableCell>
              <TableCell className="text-stone-500 text-sm">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell className="text-right">
                {user.id === currentUserId ? (
                  <span className="text-xs text-stone-400">Vous</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === user.id}
                    onClick={() => toggleRole(user)}
                    className={
                      user.role === 'admin'
                        ? 'text-stone-600 border-stone-200 hover:bg-stone-50'
                        : 'text-amber-600 border-amber-200 hover:bg-amber-50'
                    }
                  >
                    {loadingId === user.id
                      ? '…'
                      : user.role === 'admin'
                      ? 'Rétrograder'
                      : 'Promouvoir'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
