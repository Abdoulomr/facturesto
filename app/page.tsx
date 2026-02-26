'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatFCFA } from './lib/store';
import { Invoice } from './lib/types';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Skeleton } from '@/app/components/ui/skeleton';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((data) => setInvoices(data))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(id: string, current: 'pending' | 'paid') {
    const next = current === 'paid' ? 'pending' : 'paid';
    await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: next as 'pending' | 'paid' } : inv))
    );
  }

  async function confirmDelete() {
    if (!deleteDialog.id) return;
    await fetch(`/api/invoices/${deleteDialog.id}`, { method: 'DELETE' });
    setInvoices((prev) => prev.filter((inv) => inv.id !== deleteDialog.id));
    setDeleteDialog({ open: false, id: null });
  }

  const sorted = [...invoices].reverse();

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const pending = invoices.filter((i) => i.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Total factures</p>
                <p className="text-3xl font-bold text-stone-800">{invoices.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Revenu encaissé</p>
                <p className="text-3xl font-bold text-green-600">{formatFCFA(totalRevenue)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-stone-800">Factures</h1>
        <Button asChild>
          <Link href="/invoices/new">+ Nouvelle Facture</Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-3">Aucune facture pour l&apos;instant.</p>
            <Link href="/invoices/new" className="text-amber-600 hover:text-amber-500 font-medium text-sm">
              Créer la première facture →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium text-stone-800">
                      {invoice.number}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {new Date(invoice.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {invoice.tableNumber ? `Table ${invoice.tableNumber}` : '—'}
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {invoice.items.length} article{invoice.items.length > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-stone-800">
                      {formatFCFA(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        onClick={() => toggleStatus(invoice.id, invoice.status)}
                        title={invoice.status === 'paid' ? 'Cliquer pour marquer en attente' : 'Cliquer pour marquer payée'}
                        className={
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer select-none'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer select-none'
                        }
                      >
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" asChild className="text-amber-600 hover:text-amber-500">
                          <Link href={`/invoices/${invoice.id}`}>Voir</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, id: invoice.id })}
                          className="text-red-400 hover:text-red-500"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
