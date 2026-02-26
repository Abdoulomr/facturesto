import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

const DEFAULT_PRODUCTS = [
  { name: 'Mayonnaise',     price: 7000,  unit: 'pot' },
  { name: 'Ketchup',        price: 4000,  unit: 'bouteille' },
  { name: 'Moutarde',       price: 1300,  unit: 'pot' },
  { name: 'Sauce tomate',   price: 6500,  unit: 'boîte' },
  { name: 'Vinaigre',       price: 700,   unit: 'bouteille' },
  { name: 'Olive noire',    price: 1000,  unit: 'boîte' },
  { name: 'Poivre',         price: 2000,  unit: 'sachet' },
  { name: 'Sel',            price: 900,   unit: 'paquet' },
  { name: 'Piment',         price: 500,   unit: 'sachet' },
  { name: 'Laurier',        price: 200,   unit: 'sachet' },
  { name: 'Adja',           price: 150,   unit: 'tablette' },
  { name: 'Épices Adja',    price: 250,   unit: 'lot de 5' },
  { name: 'Magi',           price: 1600,  unit: 'paquet' },
  { name: 'Farine',         price: 8500,  unit: 'sac' },
  { name: 'Pomme de terre', price: 10000, unit: 'sac' },
  { name: 'Tortilla',       price: 2500,  unit: 'paquet' },
  { name: 'Fromage',        price: 7500,  unit: 'portion' },
  { name: 'Œuf',            price: 2800,  unit: 'plateau' },
  { name: 'Chocolat',       price: 1200,  unit: 'tablette' },
  { name: 'Viande hachée',  price: 4000,  unit: 'portion' },
  { name: 'Kani',           price: 500,   unit: 'pièce' },
  { name: 'Huile',          price: 17000, unit: 'bidon' },
  { name: 'Ail',            price: 1000,  unit: 'sachet' },
  { name: 'Soja',           price: 1500,  unit: 'sachet' },
  { name: 'Levure',         price: 1500,  unit: 'sachet' },
  { name: 'Barquette',      price: 2500,  unit: 'paquet' },
  { name: 'Gants',          price: 3000,  unit: 'boîte' },
  { name: 'Papier alu',     price: 2000,  unit: 'rouleau' },
];

export async function GET() {
  let products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });

  if (products.length === 0) {
    await prisma.product.createMany({ data: DEFAULT_PRODUCTS });
    products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  }

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, price, unit } = body;

  if (!name || price == null || !unit) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { name, price: parseFloat(price), unit },
  });

  return NextResponse.json(product, { status: 201 });
}
