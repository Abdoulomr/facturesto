'use client';

import { useState, useEffect } from 'react';
import { formatFCFA } from '../lib/store';
import { Product } from '../lib/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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

const UNIT_SUGGESTIONS = ['kg', 'litre', 'pot', 'bouteille', 'sachet', 'boîte', 'pièce', 'gramme', 'cl'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', price: '', unit: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', unit: '' });
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.unit.trim()) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), price: parseFloat(form.price), unit: form.unit.trim() }),
    });
    const newProduct = await res.json();
    setProducts((prev) => [...prev, newProduct]);
    setForm({ name: '', price: '', unit: '' });
  }

  function startEdit(product: Product) {
    setEditId(product.id);
    setEditForm({ name: product.name, price: product.price.toString(), unit: product.unit });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.price || !editForm.unit.trim()) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name.trim(), price: parseFloat(editForm.price), unit: editForm.unit.trim() }),
    });
    const updated = await res.json();
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setEditId(null);
  }

  async function confirmDelete() {
    if (!deleteDialog.id) return;
    await fetch(`/api/products/${deleteDialog.id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== deleteDialog.id));
    setDeleteDialog({ open: false, id: null });
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Produits</h1>

      {/* Add form */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-stone-700">Ajouter un produit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prod-name">Nom du produit</Label>
                <Input
                  id="prod-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ex: Pizza Margherita"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-price">Prix (FCFA)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="1"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="ex: 1500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-unit">Unité</Label>
                <Input
                  id="prod-unit"
                  type="text"
                  list="unit-suggestions"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="ex: kg, litre, pot"
                  required
                />
                <datalist id="unit-suggestions">
                  {UNIT_SUGGESTIONS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>
            <Button type="submit" className="mt-4">
              Ajouter le produit
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  {editId === product.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="h-8 py-1"
                          autoFocus
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          value={editForm.price}
                          onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                          className="h-8 py-1 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm.unit}
                          onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                          className="h-8 py-1 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveEdit(product.id)}
                            className="text-green-600 hover:text-green-500"
                          >
                            Sauvegarder
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditId(null)}
                            className="text-stone-400 hover:text-stone-600"
                          >
                            Annuler
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium text-stone-800">{product.name}</TableCell>
                      <TableCell className="text-stone-700 font-semibold">
                        {formatFCFA(product.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.unit}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(product)}
                            className="text-amber-600 hover:text-amber-500"
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, id: product.id })}
                            className="text-red-400 hover:text-red-500"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    {search ? 'Aucun produit trouvé.' : 'Aucun produit. Ajoutez-en ci-dessus.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 0 && (
            <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 text-xs text-muted-foreground">
              {filtered.length} produit{filtered.length > 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement supprimé.
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
