import { prisma } from '@/services/prisma.service';
import bcrypt from 'bcryptjs';

async function setDefaultPasswords() {
  const defaultPassword = 'ChangeMe123!';
  const hashed = await bcrypt.hash(defaultPassword, 10);
  const users = await prisma.user.findMany({
    where: { password: null }
  });
  console.log(`Found ${users.length} users without password.`);
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });
    console.log(`Set default password for ${user.email}`);
  }
  console.log('Done.');
}

setDefaultPasswords().catch(err => console.error(err));
