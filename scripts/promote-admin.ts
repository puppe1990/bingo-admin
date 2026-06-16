import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDbReady, resetDbForTests } from '../src/lib/db/index';
import { user } from '../src/lib/db/schema';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error('ADMIN_EMAIL is required');
    process.exit(1);
  }

  const db = await getDbReady();
  const result = await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));

  if (result.rowsAffected === 0) {
    resetDbForTests();
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  resetDbForTests();
  console.log(`Promoted ${email} to admin`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
