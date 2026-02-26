'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatFCFA } from '../../lib/store';
import { Product } from '../../lib/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import AjustementsSection, { Ajustement } from '@/app/components/AjustementsSection';

type CartItem = {
  itemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

type ModalState = {
  open: boolean;
  isCustom: boolean;
  productId: string;
  productName: string;
  price: string;
  qty: string;
};

const MODAL_CLOSED: ModalState = {
  open: false, isCustom: false, productId: '', productName: '', price: '', qty: '1',
};

export default function NewInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [emptyCartDialog, setEmptyCartDialog] = useState(false);
  const [ajustements, setAjustements] = useState<Ajustement[]>([]);
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts);
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function getQty(productId: string) {
    return items.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0);
  }

  function openModal(product: Product) {
    setModal({
      open: true, isCustom: false,
      productId: product.id, productName: product.name,
      price: String(product.price), qty: '1',
    });
  }

  function openCustomModal() {
    setModal({ open: true, isCustom: true, productId: '', productName: '', price: '', qty: '1' });
  }

  function confirmAdd() {
    const price = parseFloat(modal.price.replace(',', '.'));
    const qty = parseInt(modal.qty);
    if (!modal.productName.trim() || isNaN(price) || price < 0 || isNaN(qty) || qty <= 0) return;
    setItems((prev) => [...prev, {
      itemId: crypto.randomUUID(),
      productId: modal.productId,
      productName: modal.productName.trim(),
      unitPrice: price,
      quantity: qty,
      total: price * qty,
    }]);
    setModal(MODAL_CLOSED);
  }

  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) { setItems((prev) => prev.filter((i) => i.itemId !== itemId)); return; }
    setItems((prev) => prev.map((i) =>
      i.itemId === itemId ? { ...i, quantity: qty, total: i.unitPrice * qty } : i
    ));
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const creditTotal = ajustements.filter((a) => a.type === 'credit').reduce((s, a) => s + a.amount, 0);
  const deductTotal = ajustements.filter((a) => a.type === 'deduction').reduce((s, a) => s + a.amount, 0);
  // credit (il me doit) soustrait ; deduction (je lui dois) ajoute
  const total = Math.max(0, subtotal - creditTotal + deductTotal);

  const modalPriceNum = parseFloat(modal.price.replace(',', '.'));
  const modalQtyNum = parseInt(modal.qty);
  const modalTotal = !isNaN(modalPriceNum) && !isNaN(modalQtyNum) && modalQtyNum > 0
    ? modalPriceNum * modalQtyNum
    : null;

  async function handleSubmit() {
    if (items.length === 0) { setEmptyCartDialog(true); return; }
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, total, tableNumber, notes, deductions: ajustements }),
    });
    const invoice = await res.json();
    router.push(`/invoices/${invoice.id}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Nouvelle Facture</h1>

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
                <button key={product.id} onClick={() => openModal(product)}
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
            <div className="text-center py-8 text-muted-foreground"><p>Aucun produit trouvé.</p></div>
          )}
          {/* Produit libre */}
          <div className="mt-4">
            <button
              onClick={openCustomModal}
              className="w-full p-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50 transition-all text-stone-500 hover:text-amber-700 text-sm font-medium"
            >
              + Produit libre (nom &amp; prix personnalisés)
            </button>
          </div>
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
                    <div key={item.itemId} className="flex items-center gap-2 py-2 border-b border-stone-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-700 truncate">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">{formatFCFA(item.unitPrice)} / unité</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.itemId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-sm font-bold leading-none transition-colors">−</button>
                        <span className="w-6 text-center text-sm font-semibold text-stone-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.itemId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-sm font-bold leading-none transition-colors">+</button>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold text-stone-800 shrink-0">{formatFCFA(item.total)}</div>
                      <button onClick={() => removeItem(item.itemId)} className="text-stone-300 hover:text-red-400 text-lg leading-none transition-colors ml-1" title="Retirer">×</button>
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
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Il me doit</span><span>− {formatFCFA(creditTotal)}</span>
                        </div>
                      )}
                      {deductTotal > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Je lui dois</span><span>+ {formatFCFA(deductTotal)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-stone-800 mb-1">
                    <span>Total</span><span>{formatFCFA(total)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    {items.reduce((s, i) => s + i.quantity, 0)} article{items.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''}
                  </div>
                  <Button onClick={handleSubmit} className="w-full">Créer la facture</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal ajout produit */}
      <AlertDialog open={modal.open} onOpenChange={(open) => !open && setModal(MODAL_CLOSED)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{modal.isCustom ? 'Produit libre' : modal.productName}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            {modal.isCustom && (
              <div className="space-y-1">
                <Label>Nom du produit</Label>
                <Input
                  value={modal.productName}
                  onChange={(e) => setModal((m) => ({ ...m, productName: e.target.value }))}
                  placeholder="ex: Café spécial"
                  autoFocus
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prix (FCFA)</Label>
                <Input
                  type="number"
                  min="0"
                  value={modal.price}
                  onChange={(e) => setModal((m) => ({ ...m, price: e.target.value }))}
                  placeholder="0"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={!modal.isCustom}
                />
              </div>
              <div className="space-y-1">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={modal.qty}
                  onChange={(e) => setModal((m) => ({ ...m, qty: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>
            {modalTotal !== null && (
              <p className="text-sm font-semibold text-stone-700 text-right">
                = {formatFCFA(modalTotal)}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button
              onClick={confirmAdd}
              disabled={
                !modal.productName.trim() ||
                !modal.price ||
                isNaN(parseFloat(modal.price)) ||
                !modal.qty ||
                isNaN(parseInt(modal.qty)) ||
                parseInt(modal.qty) <= 0
              }
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              Ajouter
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={emptyCartDialog} onOpenChange={setEmptyCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Panier vide</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setEmptyCartDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
