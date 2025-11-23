import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Full system access',
      isActive: true,
    },
  });

  const financeRole = await prisma.role.upsert({
    where: { name: 'finance' },
    update: {},
    create: {
      name: 'finance',
      description: 'Finance team access',
      isActive: true,
    },
  });

  const internRole = await prisma.role.upsert({
    where: { name: 'intern' },
    update: {},
    create: {
      name: 'intern',
      description: 'Limited access for interns',
      isActive: true,
    },
  });

  console.log('✅ Roles created');

  // Create policies
  const fullAccessPolicy = await prisma.policy.upsert({
    where: { name: 'FullAccess' },
    update: {},
    create: {
      name: 'FullAccess',
      description: 'Complete system access',
      isActive: true,
    },
  });

  const viewAllOrdersPolicy = await prisma.policy.upsert({
    where: { name: 'ViewAllOrders' },
    update: {},
    create: {
      name: 'ViewAllOrders',
      description: 'Can view all orders in the system',
      isActive: true,
    },
  });

  const manageOwnOrdersPolicy = await prisma.policy.upsert({
    where: { name: 'ManageOwnOrders' },
    update: {},
    create: {
      name: 'ManageOwnOrders',
      description: 'Can manage own orders only',
      isActive: true,
    },
  });

  const viewProductsPolicy = await prisma.policy.upsert({
    where: { name: 'ViewProducts' },
    update: {},
    create: {
      name: 'ViewProducts',
      description: 'Can view products',
      isActive: true,
    },
  });

  console.log('✅ Policies created');

  // Create permissions for FullAccess policy
  await prisma.permission.upsert({
    where: { id: 'full-access-perm' },
    update: {},
    create: {
      id: 'full-access-perm',
      policyId: fullAccessPolicy.id,
      action: 'manage',
      subject: 'all',
      fields: [],
      conditions: null,
      inverted: false,
      reason: 'Admin has full access to all resources',
    },
  });

  // Create permissions for ViewAllOrders policy
  await prisma.permission.upsert({
    where: { id: 'view-all-orders-perm' },
    update: {},
    create: {
      id: 'view-all-orders-perm',
      policyId: viewAllOrdersPolicy.id,
      action: 'read',
      subject: 'Order',
      fields: [],
      conditions: null,
      inverted: false,
      reason: 'Finance can view all orders',
    },
  });

  // Create permissions for ManageOwnOrders policy
  await prisma.permission.createMany({
    data: [
      {
        policyId: manageOwnOrdersPolicy.id,
        action: 'create',
        subject: 'Order',
        fields: [],
        conditions: null,
        inverted: false,
        reason: 'Interns can create orders',
      },
      {
        policyId: manageOwnOrdersPolicy.id,
        action: 'read',
        subject: 'Order',
        fields: [],
        conditions: { userId: '{{currentUser.id}}' },
        inverted: false,
        reason: 'Interns can read their own orders',
      },
      {
        policyId: manageOwnOrdersPolicy.id,
        action: 'update',
        subject: 'Order',
        fields: ['notes'],
        conditions: { userId: '{{currentUser.id}}' },
        inverted: false,
        reason: 'Interns can update notes on their own orders',
      },
    ],
    skipDuplicates: true,
  });

  // Create permissions for ViewProducts policy
  await prisma.permission.upsert({
    where: { id: 'view-products-perm' },
    update: {},
    create: {
      id: 'view-products-perm',
      policyId: viewProductsPolicy.id,
      action: 'read',
      subject: 'Product',
      fields: [],
      conditions: null,
      inverted: false,
      reason: 'Can view product catalog',
    },
  });

  console.log('✅ Permissions created');

  // Assign policies to roles
  await prisma.rolePolicy.createMany({
    data: [
      { roleId: adminRole.id, policyId: fullAccessPolicy.id },
      { roleId: financeRole.id, policyId: viewAllOrdersPolicy.id },
      { roleId: financeRole.id, policyId: viewProductsPolicy.id },
      { roleId: internRole.id, policyId: manageOwnOrdersPolicy.id },
      { roleId: internRole.id, policyId: viewProductsPolicy.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Policies assigned to roles');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@example.com' },
    update: {},
    create: {
      email: 'finance@example.com',
      password: hashedPassword,
      firstName: 'Finance',
      lastName: 'User',
      isActive: true,
    },
  });

  const internUser = await prisma.user.upsert({
    where: { email: 'intern@example.com' },
    update: {},
    create: {
      email: 'intern@example.com',
      password: hashedPassword,
      firstName: 'Intern',
      lastName: 'User',
      isActive: true,
    },
  });

  console.log('✅ Users created');

  // Assign roles to users
  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: financeUser.id, roleId: financeRole.id },
      { userId: internUser.id, roleId: internRole.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Roles assigned to users');

  // Create sample products
  await prisma.product.createMany({
    data: [
      {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 1299.99,
        stock: 50,
        sku: 'LAP-001',
        isActive: true,
      },
      {
        name: 'Mouse',
        description: 'Wireless mouse',
        price: 29.99,
        stock: 200,
        sku: 'MOU-001',
        isActive: true,
      },
      {
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        price: 89.99,
        stock: 100,
        sku: 'KEY-001',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Products created');

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Demo accounts:');
  console.log('- Admin: admin@example.com / password123');
  console.log('- Finance: finance@example.com / password123');
  console.log('- Intern: intern@example.com / password123');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
