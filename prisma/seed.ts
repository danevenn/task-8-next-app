import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Idempotente: limpiamos antes de sembrar (Restrict obliga a borrar productos primero).
  await db.product.deleteMany();
  await db.category.deleteMany();

  const [electronica, hogar, oficina] = await Promise.all([
    db.category.create({
      data: { name: "Electrónica", description: "Dispositivos y accesorios electrónicos." },
    }),
    db.category.create({
      data: { name: "Hogar", description: "Artículos para el hogar y la cocina." },
    }),
    db.category.create({
      data: { name: "Oficina", description: "Material y mobiliario de oficina." },
    }),
  ]);

  const productos: Prisma.ProductCreateManyInput[] = [
    { name: "Teclado mecánico RGB", description: "Switches rojos, retroiluminado.", price: new Prisma.Decimal("79.90"), stock: 35, categoryId: electronica.id },
    { name: "Ratón inalámbrico", description: "Ergonómico, 2.4GHz + Bluetooth.", price: new Prisma.Decimal("29.95"), stock: 60, categoryId: electronica.id },
    { name: "Monitor 27\" QHD", description: "IPS 144Hz, 1ms.", price: new Prisma.Decimal("249.00"), stock: 12, categoryId: electronica.id },
    { name: "Auriculares Bluetooth", description: "Cancelación de ruido activa.", price: new Prisma.Decimal("119.99"), stock: 0, categoryId: electronica.id },
    { name: "Cafetera espresso", description: "19 bares, depósito 1.5L.", price: new Prisma.Decimal("159.50"), stock: 8, categoryId: hogar.id },
    { name: "Juego de sartenes", description: "Antiadherente, 3 piezas.", price: new Prisma.Decimal("44.90"), stock: 25, categoryId: hogar.id },
    { name: "Lámpara de escritorio LED", description: "Regulable, 3 temperaturas.", price: new Prisma.Decimal("22.99"), stock: 40, categoryId: hogar.id },
    { name: "Silla ergonómica", description: "Soporte lumbar, reposabrazos 3D.", price: new Prisma.Decimal("189.00"), stock: 6, categoryId: oficina.id },
    { name: "Escritorio elevable", description: "Eléctrico, 120x60cm.", price: new Prisma.Decimal("329.00"), stock: 4, categoryId: oficina.id },
    { name: "Organizador de cables", description: "Pack 10 unidades, autoadhesivo.", price: new Prisma.Decimal("9.99"), stock: 120, categoryId: oficina.id },
  ];

  await db.product.createMany({ data: productos });

  console.log(`Seed completado: 3 categorías y ${productos.length} productos.`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
