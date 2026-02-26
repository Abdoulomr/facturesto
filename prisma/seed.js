const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCTS = [
  // Condiments / sauces
  { name: 'Mayonnaise',     price: 7000,  unit: 'pot' },
  { name: 'Ketchup',        price: 4000,  unit: 'bouteille' },
  { name: 'Moutarde',       price: 1300,  unit: 'pot' },
  { name: 'Sauce tomate',   price: 6500,  unit: 'boîte' },
  { name: 'Vinaigre',       price: 700,   unit: 'bouteille' },
  { name: 'Olive noire',    price: 1000,  unit: 'boîte' },

  // Épices / aromates
  { name: 'Poivre',         price: 2000,  unit: 'sachet' },
  { name: 'Sel',            price: 900,   unit: 'paquet' },
  { name: 'Piment',         price: 500,   unit: 'sachet' },
  { name: 'Laurier',        price: 200,   unit: 'sachet' },
  { name: 'Adja',           price: 150,   unit: 'tablette' },
  { name: 'Épices Adja',    price: 250,   unit: 'lot de 5' },
  { name: 'Magi',           price: 1600,  unit: 'paquet' },

  // Féculents / bases
  { name: 'Farine',         price: 8500,  unit: 'sac' },
  { name: 'Pomme de terre', price: 10000, unit: 'sac' },
  { name: 'Tortilla',       price: 2500,  unit: 'paquet' },

  // Produits laitiers / œufs
  { name: 'Fromage',        price: 7500,  unit: 'portion' },
  { name: 'Œuf',            price: 2800,  unit: 'plateau' },
  { name: 'Chocolat',       price: 1200,  unit: 'tablette' },

  // Viandes / protéines
  { name: 'Viande hachée',  price: 4000,  unit: 'portion' },
  { name: 'Kani',           price: 500,   unit: 'pièce' },

  // Matières grasses
  { name: 'Huile',          price: 17000, unit: 'bidon' },

  // Divers alimentaires
  { name: 'Ail',            price: 1000,  unit: 'sachet' },
  { name: 'Soja',           price: 1500,  unit: 'sachet' },
  { name: 'Levure',         price: 1500,  unit: 'sachet' },

  // Consommables cuisine
  { name: 'Barquette',      price: 2500,  unit: 'paquet' },
  { name: 'Gants',          price: 3000,  unit: 'boîte' },
  { name: 'Papier alu',     price: 2000,  unit: 'rouleau' },
];

async function main() {
  console.log('Suppression des produits existants...');
  await prisma.product.deleteMany();

  console.log(`Insertion de ${PRODUCTS.length} produits...`);
  await prisma.product.createMany({ data: PRODUCTS });

  console.log('✓ Seed terminé.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
