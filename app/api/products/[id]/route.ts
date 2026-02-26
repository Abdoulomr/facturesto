import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, price, unit } = body;

  if (!name || price == null || !unit) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { name, price: parseFloat(price), unit },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
