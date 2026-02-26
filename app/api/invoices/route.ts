import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '../../lib/prisma';
import { auth } from '../../lib/auth';

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: {
      items: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, total, tableNumber, notes, deductions } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Aucun article' }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  const number = `FAC-${year}-${(count + 1).toString().padStart(4, '0')}`;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      total,
      tableNumber: tableNumber ?? '',
      notes: notes ?? '',
      createdById: session?.user?.id ?? null,
      deductions: deductions && deductions.length > 0 ? {
        create: (deductions as { label: string; amount: number; type?: string }[]).map((d) => ({
          label: d.label,
          amount: d.amount,
          type: d.type ?? 'deduction',
        })),
      } : undefined,
      items: {
        create: items.map((item: {
          productId: string;
          productName: string;
          unitPrice: number;
          quantity: number;
          total: number;
        }) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
        })),
      },
    },
    include: {
      items: true,
      deductions: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
