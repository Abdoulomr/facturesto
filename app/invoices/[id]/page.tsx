'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatFCFA } from '../../lib/store';
import { Invoice } from '../../lib/types';
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
import { Skeleton } from '@/app/components/ui/skeleton';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [dLabel, setDLabel] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [savingDeduction, setSavingDeduction] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    fetch(`/api/invoices/${id}`)
      .then((r) => {
        if (!r.ok) { router.push('/'); return null; }
        return r.json();
      })
      .then((data) => { if (data) setInvoice(data); })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function addDeduction() {
    if (!invoice) return;
    const amount = parseFloat(dAmount.replace(',', '.'));
    if (!dLabel.trim() || isNaN(amount) || amount <= 0) return;
    setSavingDeduction(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: dLabel.trim(), amount }),
      });
      const updated = await res.json();
      setInvoice(updated);
      setDLabel('');
      setDAmount('');
    } finally {
      setSavingDeduction(false);
    }
  }

  async function removeDeduction(deductionId: string) {
    if (!invoice) return;
    setDeletingId(deductionId);
    try {
      const res = await fetch(
        `/api/invoices/${invoice.id}/deductions?deductionId=${deductionId}`,
        { method: 'DELETE' }
      );
      const updated = await res.json();
      setInvoice(updated);
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleStatus() {
    if (!invoice) return;
    const next = invoice.status === 'paid' ? 'pending' : 'paid';
    await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setInvoice({ ...invoice, status: next });
  }

  async function captureCanvas() {
    const { toCanvas } = await import('html-to-image');
    const el = invoiceRef.current!;

    const overrides: { el: HTMLElement; overflow: string }[] = [];
    [el, ...el.querySelectorAll<HTMLElement>('*')].forEach((node) => {
      const ov = window.getComputedStyle(node).overflow;
      if (ov === 'hidden' || ov === 'scroll' || ov === 'auto') {
        overrides.push({ el: node, overflow: node.style.overflow });
        node.style.overflow = 'visible';
      }
    });

    try {
      return await toCanvas(el, { pixelRatio: 2, backgroundColor: '#ffffff' });
    } finally {
      overrides.forEach(({ el: node, overflow }) => { node.style.overflow = overflow; });
    }
  }

  async function exportAsPng() {
    setExporting(true);
    try {
      const canvas = await captureCanvas();
      const link = document.createElement('a');
      link.download = `${invoice!.number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  }

  async function exportAsPdf() {
    setExporting(true);
    try {
      const canvas = await captureCanvas();
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pxToMm = 0.2646;
      const w = (canvas.width / 2) * pxToMm;
      const h = (canvas.height / 2) * pxToMm;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [w, h] });
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
      pdf.save(`${invoice!.number}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  async function shareWhatsApp() {
    setExporting(true);
    try {
      const canvas = await captureCanvas();
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const file = new File([blob], `${invoice!.number}.png`, { type: 'image/png' });
        if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: `Facture ${invoice!.number}`, files: [file] });
          return;
        }
      }
      const lines = [
        `🍽 FactuResto — Facture *${invoice!.number}*`,
        `Date : ${new Date(invoice!.date).toLocaleDateString('fr-FR')}`,
        invoice!.tableNumber ? `Table N° ${invoice!.tableNumber}` : '',
        '',
        ...invoice!.items.map((i) => `• ${i.productName} × ${i.quantity} = ${formatFCFA(i.total)}`),
        '',
        `*Total : ${formatFCFA(invoice!.total)}*`,
      ].filter(Boolean).join('\n');
      window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 items-center justify-between mb-6 print:hidden">
          <Skeleton className="h-5 w-36" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-8 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 pt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const trueDeductions = invoice.deductions.filter((d) => d.type !== 'credit');
  const credits = invoice.deductions.filter((d) => d.type === 'credit');
  const hasDeductions = invoice.deductions.length > 0;

  const formattedDate = new Date(invoice.date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(invoice.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between mb-4 print:hidden">
        <Button asChild variant="ghost" className="text-stone-500 hover:text-stone-700 px-0">
          <Link href="/">← Retour aux factures</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/invoices/${invoice.id}/edit`}>✏️ Modifier</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsPng} disabled={exporting}>
            ↓ PNG
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsPdf} disabled={exporting}>
            ↓ PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareWhatsApp}
            disabled={exporting}
            className="text-green-700 border-green-200 hover:bg-green-50"
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeductionForm((v) => !v)}
            className="text-red-700 border-red-200 hover:bg-red-50"
          >
            − Déduire
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
      </div>

      {/* Deduction form */}
      {showDeductionForm && (
        <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50 print:hidden">
          <p className="text-sm font-semibold text-red-800 mb-3">Ajouter une déduction</p>

          {/* Existing deductions list */}
          {hasDeductions && (
            <div className="mb-3 space-y-1">
              {invoice.deductions.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm bg-white border border-red-100 rounded px-3 py-1.5">
                  <span className="text-stone-700">
                    <span className="font-medium">{d.label}</span>
                    <span className={`ml-2 ${d.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {d.type === 'credit' ? '+' : '−'} {formatFCFA(d.amount)}
                    </span>
                  </span>
                  <button
                    onClick={() => removeDeduction(d.id)}
                    disabled={deletingId === d.id}
                    className="text-red-400 hover:text-red-600 font-bold text-base leading-none disabled:opacity-40 ml-2"
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new deduction */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-40">
              <label className="text-xs text-red-700 mb-1 block">Libellé</label>
              <input
                type="text"
                value={dLabel}
                onChange={(e) => setDLabel(e.target.value)}
                placeholder="ex: Commande à emporter"
                className="border border-red-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div>
              <label className="text-xs text-red-700 mb-1 block">Montant (FCFA)</label>
              <input
                type="number"
                min="0"
                value={dAmount}
                onChange={(e) => setDAmount(e.target.value)}
                placeholder="ex: 5000"
                className="border border-red-200 rounded px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <Button
              size="sm"
              onClick={addDeduction}
              disabled={savingDeduction || !dLabel.trim() || !dAmount}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {savingDeduction ? 'Ajout…' : '+ Ajouter'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowDeductionForm(false)}>
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* Invoice document */}
      <Card>
        <CardContent className="p-4 sm:p-8" ref={invoiceRef}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🍽</span>
                <span className="text-xl font-bold text-stone-800">FactuResto</span>
              </div>
              <h1 className="text-3xl font-bold text-stone-800 mt-4">FACTURE</h1>
              <p className="text-muted-foreground font-mono mt-1">{invoice.number}</p>
            </div>
            <div className="text-right">
              <Badge
                onClick={toggleStatus}
                className={
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 text-sm px-3 py-1 cursor-pointer select-none'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm px-3 py-1 cursor-pointer select-none'
                }
                title={invoice.status === 'paid' ? 'Cliquer pour marquer en attente' : 'Cliquer pour marquer payée'}
              >
                {invoice.status === 'paid' ? '✓ Payée' : '⏳ En attente'}
              </Badge>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 pb-6 border-b border-stone-100 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Date</p>
              <p className="font-medium text-stone-800">
                {formattedDate} à {formattedTime}
              </p>
            </div>
            {invoice.tableNumber && (
              <div>
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Table</p>
                <p className="font-medium text-stone-800">N° {invoice.tableNumber}</p>
              </div>
            )}
            {invoice.notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Notes</p>
                <p className="font-medium text-stone-800">{invoice.notes}</p>
              </div>
            )}
            {invoice.createdBy && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Créé par</p>
                <p className="font-medium text-stone-800">{invoice.createdBy.name}</p>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-stone-200">
                  <TableHead className="pl-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Article
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                    Qté
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                    Prix unit.
                  </TableHead>
                  <TableHead className="pr-0 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, i) => (
                  <TableRow key={i} className="border-stone-100">
                    <TableCell className="pl-0 text-stone-800 font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center text-stone-600">{item.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatFCFA(item.unitPrice)}</TableCell>
                    <TableCell className="pr-0 text-right font-semibold text-stone-800">
                      {formatFCFA(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="border-t-2 border-stone-800 pt-4 space-y-2">
            {hasDeductions && (
              <>
                <div className="flex justify-between items-center text-sm text-stone-500">
                  <span>Sous-total</span>
                  <span>{formatFCFA(subtotal)}</span>
                </div>
                {credits.map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-sm text-green-600">
                    <span>{d.label}</span>
                    <span>+ {formatFCFA(d.amount)}</span>
                  </div>
                ))}
                {trueDeductions.map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-sm text-red-600">
                    <span>{d.label}</span>
                    <span>− {formatFCFA(d.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-stone-200" />
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-stone-800">TOTAL</span>
              <span className="text-2xl font-bold text-stone-800">{formatFCFA(invoice.total)}</span>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
