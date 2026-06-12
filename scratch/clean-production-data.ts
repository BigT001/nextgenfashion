import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚨 PRODUCTION DATA CLEANUP TOOL 🚨\n');
  console.log('This script will DELETE all transaction and sales history.\n');

  // Show current counts
  const saleCount = await prisma.sale.count();
  const saleItemCount = await prisma.saleItem.count();
  const customerCount = await prisma.customer.count();

  console.log('📊 Current Data Summary:');
  console.log(`   • Sales Records: ${saleCount}`);
  console.log(`   • Sale Items: ${saleItemCount}`);
  console.log(`   • Customers: ${customerCount}\n`);

  // Confirmation
  const confirm1 = await question('⚠️  This action is PERMANENT and CANNOT be undone. Continue? (type "yes" to proceed): ');
  if (confirm1.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }

  const confirm2 = await question('⚠️  Are you absolutely sure? (type "DELETE ALL" to confirm): ');
  if (confirm2 !== 'DELETE ALL') {
    console.log('❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('\n⏳ Deleting data...\n');

    // Delete in order of dependencies
    console.log('1️⃣  Deleting SaleItems...');
    const deletedSaleItems = await prisma.saleItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSaleItems.count} sale items\n`);

    console.log('2️⃣  Deleting Sales...');
    const deletedSales = await prisma.sale.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSales.count} sales\n`);

    // Ask about customers
    const archiveCustomers = await question('3️⃣  Archive customers instead of deleting? (yes/no): ');
    
    if (archiveCustomers.toLowerCase() === 'yes') {
      console.log('   Archiving customers...');
      const updatedCustomers = await prisma.customer.updateMany({
        data: { isArchived: true },
      });
      console.log(`   ✅ Archived ${updatedCustomers.count} customers\n`);
    } else {
      const deleteCustomers = await question('   Delete all customers? (type "DELETE CUSTOMERS" to confirm): ');
      if (deleteCustomers === 'DELETE CUSTOMERS') {
        console.log('   Deleting customers...');
        const deletedCustomers = await prisma.customer.deleteMany({});
        console.log(`   ✅ Deleted ${deletedCustomers.count} customers\n`);
      } else {
        console.log('   ⏭️  Skipping customer deletion\n');
      }
    }

    console.log('✨ CLEANUP COMPLETE!\n');
    console.log('📊 New Data Summary:');
    console.log(`   • Sales Records: ${await prisma.sale.count()}`);
    console.log(`   • Sale Items: ${await prisma.saleItem.count()}`);
    console.log(`   • Customers: ${await prisma.customer.count()}\n`);
    console.log('✅ Your production database is now clean and ready for launch!\n');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
