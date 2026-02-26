import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      deductions: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Full edit: items + deductions + metadata
  if (body.items) {
    const { items, deductions, total, tableNumber, notes } = body;

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.deduction.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        total,
        tableNumber: tableNumber ?? '',
        notes: notes ?? '',
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
        ...(deductions?.length > 0 && {
          deductions: {
            create: (deductions as { label: string; amount: number }[]).map((d) => ({
              label: d.label,
              amount: d.amount,
            })),
          },
        }),
      },
      include: {
        items: true,
        deductions: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(invoice);
  }

  // Status-only update
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: body.status },
    include: {
      items: true,
      deductions: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
