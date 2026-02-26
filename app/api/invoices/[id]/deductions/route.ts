import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

async function recalcTotal(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, deductions: true },
  });
  if (!invoice) return;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const credited = invoice.deductions.filter((d) => d.type === 'credit').reduce((s, d) => s + d.amount, 0);
  const deducted = invoice.deductions.filter((d) => d.type !== 'credit').reduce((s, d) => s + d.amount, 0);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { total: Math.max(0, subtotal + credited - deducted) },
  });
}

// POST /api/invoices/[id]/deductions — ajouter une déduction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { label, amount } = await request.json();

  if (!label || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'label et amount requis' }, { status: 400 });
  }

  await prisma.deduction.create({ data: { label, amount, invoiceId: id } });
  await recalcTotal(id);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, deductions: true },
  });
  return NextResponse.json(invoice);
}

// DELETE /api/invoices/[id]/deductions?deductionId=xxx — supprimer une déduction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const deductionId = searchParams.get('deductionId');

  if (!deductionId) {
    return NextResponse.json({ error: 'deductionId requis' }, { status: 400 });
  }

  await prisma.deduction.delete({ where: { id: deductionId } });
  await recalcTotal(id);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, deductions: true },
  });
  return NextResponse.json(invoice);
}
