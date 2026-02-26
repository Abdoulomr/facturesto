'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatFCFA } from '../../../lib/store';
import { Product, InvoiceItem } from '../../../lib/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { Skeleton } from '@/app/components/ui/skeleton';
import Link from 'next/link';
import AjustementsSection, { Ajustement } from '@/app/components/AjustementsSection';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [ajustements, setAjustements] = useState<Ajustement[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ]).then(([invoice, prods]) => {
      setInvoiceNumber(invoice.number);
      setTableNumber(invoice.tableNumber ?? '');
      setNotes(invoice.notes ?? '');
      setItems(invoice.items.map((item: InvoiceItem & { id?: string }) => ({
        productId: item.productId, productName: item.productName,
        unitPrice: item.unitPrice, quantity: item.quantity, total: item.total,
      })));
      setAjustements(
        (invoice.deductions ?? []).map((d: { label: string; amount: number; type?: string }) => ({
          label: d.label,
          amount: d.amount,
          type: (d.type === 'credit' ? 'credit' : 'deduction') as 'credit' | 'deduction',
        }))
      );
      setProducts(prods);
      setLoading(false);
    });
  }, [id]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function getQty(productId: string) {
    return items.find((i) => i.productId === productId)?.quantity ?? 0;
  }

  function addProduct(product: Product) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      updateQty(product.id, existing.quantity + 1);
    } else {
      setItems((prev) => [...prev, {
        productId: product.id, productName: product.name,
        unitPrice: product.price, quantity: 1, total: product.price,
      }]);
    }
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { setItems((prev) => prev.filter((i) => i.productId !== productId)); return; }
    setItems((prev) => prev.map((i) =>
      i.productId === productId ? { ...i, quantity: qty, total: i.unitPrice * qty } : i
    ));
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const creditTotal = ajustements.filter((a) => a.type === 'credit').reduce((s, a) => s + a.amount, 0);
  const deductTotal = ajustements.filter((a) => a.type === 'deduction').reduce((s, a) => s + a.amount, 0);
  const total = Math.max(0, subtotal + creditTotal - deductTotal);

  async function handleSave() {
    if (items.length === 0) return;
    setSaving(true);
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total, tableNumber, notes, deductions: ajustements }),
      });
      router.push(`/invoices/${id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="col-span-2"><Skeleton className="h-96 rounded-xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" className="text-stone-500 hover:text-stone-700 px-0">
          <Link href={`/invoices/${id}`}>← Retour</Link>
        </Button>
        <h1 className="text-2xl font-bold text-stone-800">Modifier {invoiceNumber}</h1>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: product selector */}
        <div className="col-span-3">
          <div className="mb-4">
            <Input type="text" placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const qty = getQty(product.id);
              return (
                <button key={product.id} onClick={() => addProduct(product)}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${qty > 0 ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50'}`}>
                  <div className="font-semibold text-stone-800 text-sm">{product.name}</div>
                  <div className="text-stone-500 text-xs mt-1">{formatFCFA(product.price)} / {product.unit}</div>
                  {qty > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">× {qty}</span>
                      <span className="text-xs text-amber-600 font-medium">dans la commande</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground"><p>Aucun produit trouvé.</p></div>
          )}
        </div>

        {/* Right: summary */}
        <div className="col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-stone-700">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="space-y-1.5">
                  <Label htmlFor="table-num">N° Table</Label>
                  <Input id="table-num" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="ex: 5" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ex: sans gluten..." />
                </div>
              </div>

              {items.length === 0 ? (
                <div className="border-2 border-dashed border-stone-200 rounded-xl py-10 text-center text-muted-foreground text-sm mb-4">
                  Cliquez sur un produit<br />pour l&apos;ajouter
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 py-2 border-b border-stone-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-700 truncate">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">{formatFCFA(item.unitPrice)} / unité</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-sm font-bold leading-none transition-colors">−</button>
                        <span className="w-6 text-center text-sm font-semibold text-stone-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-sm font-bold leading-none transition-colors">+</button>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold text-stone-800 shrink-0">{formatFCFA(item.total)}</div>
                      <button onClick={() => removeItem(item.productId)} className="text-stone-300 hover:text-red-400 text-lg leading-none transition-colors ml-1">×</button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <AjustementsSection ajustements={ajustements} onChange={setAjustements} />
              )}

              {items.length > 0 && (
                <>
                  <Separator className="mb-3" />
                  {(creditTotal > 0 || deductTotal > 0) && (
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-sm text-stone-500">
                        <span>Sous-total</span><span>{formatFCFA(subtotal)}</span>
                      </div>
                      {creditTotal > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Il me doit</span><span>+ {formatFCFA(creditTotal)}</span>
                        </div>
                      )}
                      {deductTotal > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Je lui dois</span><span>− {formatFCFA(deductTotal)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-stone-800 mb-4">
                    <span>Total</span><span>{formatFCFA(total)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/invoices/${id}`}>Annuler</Link>
                    </Button>
                    <Button onClick={handleSave} disabled={saving || items.length === 0} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white">
                      {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
