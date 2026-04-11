import { PrismaClient, UserRole, Platform, OrderStatus, PaymentType, PaymentStatus, BillingTransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function requireSeedPassword(varName: 'SEED_SUPERADMIN_PASSWORD' | 'SEED_SELLER_PASSWORD', fallback: string) {
  const value = process.env[varName];
  if (process.env.NODE_ENV === 'production' && (!value || value.trim().length === 0)) {
    throw new Error(`${varName} must be set in production when running seed`);
  }
  return value && value.trim().length > 0 ? value : fallback;
}

function secureSeedFallback(prefix: string) {
  return `${prefix}-${randomBytes(12).toString('hex')}`;
}

async function main() {
  const starter = await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      orderCount: 1000,
      priceInr: 1000,
      pricePerOrder: 1,
      graceOrders: 50,
      graceRatePaise: 150,
      features: { video_evidence: false, ai_listing: 'off' },
      displayOrder: 1,
    },
  });

  const growth = await prisma.plan.upsert({
    where: { name: 'Growth' },
    update: {},
    create: {
      name: 'Growth',
      orderCount: 5000,
      priceInr: 4000,
      pricePerOrder: 0.8,
      graceOrders: 100,
      graceRatePaise: 150,
      features: { video_evidence: true, ai_listing: 'on_request' },
      displayOrder: 2,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      orderCount: 10000,
      priceInr: 7500,
      pricePerOrder: 0.75,
      graceOrders: 200,
      graceRatePaise: 150,
      features: { video_evidence: true, ai_listing: 'unlimited' },
      displayOrder: 3,
    },
  });

  const adminPass = await bcrypt.hash(
    requireSeedPassword('SEED_SUPERADMIN_PASSWORD', secureSeedFallback('SeedAdmin')),
    12,
  );
  const sellerPass = await bcrypt.hash(
    requireSeedPassword('SEED_SELLER_PASSWORD', secureSeedFallback('SeedSeller')),
    12,
  );

  const admin = await prisma.user.upsert({
    where: { email: 'superadmin@agencyfic.com' },
    update: {},
    create: {
      email: 'superadmin@agencyfic.com',
      passwordHash: adminPass,
      name: 'Agencyfic Superadmin',
      role: UserRole.admin,
      isVerified: true,
      isActive: true,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller1@example.com' },
    update: {},
    create: {
      email: 'seller1@example.com',
      passwordHash: sellerPass,
      name: 'Sample Seller',
      role: UserRole.seller,
      businessName: 'Sample Store LLP',
      city: 'Jaipur',
      state: 'Rajasthan',
      planId: growth.id,
      creditsPurchased: 5000,
      isVerified: true,
    },
  });

  const linked = await prisma.linkedAccount.upsert({
    where: { id: '00000000-0000-0000-0000-000000000111' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000111',
      userId: seller.id,
      platform: Platform.meesho,
      accountNickname: 'Main Meesho',
      sessionStatus: 'active',
    },
  });

  const order = await prisma.order.upsert({
    where: {
      platform_platformOrderId_userId: {
        platform: Platform.meesho,
        platformOrderId: 'MSH-ORDER-1001',
        userId: seller.id,
      },
    },
    update: {},
    create: {
      userId: seller.id,
      linkedAccountId: linked.id,
      platform: Platform.meesho,
      platformOrderId: 'MSH-ORDER-1001',
      status: OrderStatus.pending,
      customerName: 'Ravi Kumar',
      customerAddress: 'Malviya Nagar',
      customerCity: 'Jaipur',
      customerState: 'Rajasthan',
      customerPincode: '302017',
      orderAmount: 899,
      paymentType: PaymentType.cod,
      codAmount: 899,
      products: [{ name: 'Cotton Kurti', sku: 'KRT-001', qty: 1, price: 899 }],
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      name: 'Cotton Kurti',
      sku: 'KRT-001',
      quantity: 1,
      price: 899,
    },
  });

  await prisma.billingTransaction.create({
    data: {
      userId: seller.id,
      transactionType: BillingTransactionType.purchase,
      planId: growth.id,
      ordersPurchased: 5000,
      amountInr: 4000,
      paymentStatus: PaymentStatus.paid,
      invoiceNumber: 'AF-INV-1001',
      paidAt: new Date(),
    },
  });

  await prisma.platformIntegration.upsert({
    where: { platform: Platform.amazon },
    update: {},
    create: {
      platform: Platform.amazon,
      clientId: 'sample-amazon-client-id',
      isActive: true,
      updatedByAdminId: admin.id,
    },
  });

  await prisma.platformIntegration.upsert({
    where: { platform: Platform.flipkart },
    update: {},
    create: {
      platform: Platform.flipkart,
      clientId: 'sample-flipkart-client-id',
      isActive: true,
      updatedByAdminId: admin.id,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
