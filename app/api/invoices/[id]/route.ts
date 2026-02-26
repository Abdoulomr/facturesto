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
  const { status } = await request.json();

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status },
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
