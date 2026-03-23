/**
 * One-off admin seed script.
 *
 * Run once after first deploy (or whenever you need to create the admin user):
 *   npm run seed:admin
 *
 * Required env vars:
 *   ADMIN_EMAIL    — the admin's login email
 *   ADMIN_PASSWORD — a strong, randomly-generated password (min 16 chars, must include uppercase,
 *                    lowercase, digit, and special character)
 *   DATABASE_URL   — Postgres connection string
 */

import 'dotenv/config';
import { PrismaClient, UserRole, AuthProvider } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function seedAdmin(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[seed-admin] ERROR: DATABASE_URL is not set.');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      '[seed-admin] ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must both be set in environment variables.',
    );
    process.exit(1);
  }

  const pwStrong =
    adminPassword.length >= 16 &&
    /[A-Z]/.test(adminPassword) &&
    /[a-z]/.test(adminPassword) &&
    /[0-9]/.test(adminPassword) &&
    /[^A-Za-z0-9]/.test(adminPassword);

  if (!pwStrong) {
    console.error(
      '[seed-admin] ERROR: ADMIN_PASSWORD is too weak.\n' +
        '  Requirements: at least 16 characters, one uppercase, one lowercase, one digit, one special character.\n' +
        '  Generate one with: node -e "console.log(require(\'crypto\').randomBytes(18).toString(\'base64\'))"',
    );
    process.exit(1);
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const pool = new Pool({
    connectionString,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    await prisma.$connect();

    const existing = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existing) {
      console.log(
        `[seed-admin] Admin already exists (${adminEmail}). Nothing to do.`,
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        phoneNumber: '0000000003',
        firstName: 'System',
        lastName: 'Admin',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        provider: AuthProvider.LOCAL,
        isEmailVerified: true,
      },
    });

    console.log(`[seed-admin] Admin user created successfully (${adminEmail})`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedAdmin().catch((err) => {
  console.error('[seed-admin] Fatal error:', err);
  process.exit(1);
});
