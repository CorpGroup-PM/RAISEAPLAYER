/**
 * One-off migration: encrypt any plain-text account numbers and PAN numbers
 * that were saved before AES-256-GCM field encryption was introduced.
 *
 * Safe to run multiple times — already-encrypted values are left untouched.
 *
 * Run from the Server directory:
 *   npm run migrate:encrypt
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

// ---------------------------------------------------------------------------
// Inline crypto helpers (no NestJS DI needed)
// ---------------------------------------------------------------------------

function getKey(): Buffer {
  const hex = process.env.ACCOUNT_NUMBER_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ACCOUNT_NUMBER_ENCRYPTION_KEY must be a 64-char hex string. ' +
      'Make sure your .env is loaded.',
    );
  }
  return Buffer.from(hex, 'hex');
}

function isAlreadyEncrypted(value: string): boolean {
  // Encrypted format: "<ivHex>:<authTagHex>:<ciphertextHex>"
  // All three parts are hex strings; iv is 24 chars (12 bytes), authTag is 32 chars (16 bytes)
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[0-9a-fA-F]+$/.test(p));
}

function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function tryDecrypt(value: string): string | null {
  try {
    const key = getKey();
    const parts = value.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const pool = new Pool({
    connectionString,
    ...(!isLocal ? { ssl: { rejectUnauthorized: true } } : {}),
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // ── 1. RecipientAccount.accountNumber ──────────────────────────────────
    const accounts = await prisma.recipientAccount.findMany({
      select: { id: true, accountNumber: true },
    });

    let accountFixed = 0;
    let accountAlreadyOk = 0;
    let accountSkipped = 0;

    for (const acc of accounts) {
      if (!acc.accountNumber) { accountSkipped++; continue; }

      if (isAlreadyEncrypted(acc.accountNumber)) {
        // Verify current key can actually decrypt it
        const decrypted = tryDecrypt(acc.accountNumber);
        if (decrypted !== null) {
          accountAlreadyOk++;
          continue;
        }
        // Encrypted with a DIFFERENT key — cannot recover
        console.warn(
          `  ⚠  RecipientAccount ${acc.id}: encrypted with a different key — SKIPPED (manual action needed)`,
        );
        accountSkipped++;
        continue;
      }

      // Plain-text value — encrypt it now
      const encrypted = encryptField(acc.accountNumber);
      await prisma.recipientAccount.update({
        where: { id: acc.id },
        data: { accountNumber: encrypted },
      });
      accountFixed++;
    }

    // ── 2. PanDetails.panNumber ────────────────────────────────────────────
    const pans = await prisma.panDetails.findMany({
      select: { id: true, panNumber: true, userId: true },
    });

    let panFixed = 0;
    let panAlreadyOk = 0;
    let panSkipped = 0;

    for (const pan of pans) {
      if (!pan.panNumber) { panSkipped++; continue; }

      if (isAlreadyEncrypted(pan.panNumber)) {
        const decrypted = tryDecrypt(pan.panNumber);
        if (decrypted !== null) {
          panAlreadyOk++;
          continue;
        }
        console.warn(
          `  ⚠  PanDetails ${pan.id} (user ${pan.userId}): encrypted with a different key — SKIPPED`,
        );
        panSkipped++;
        continue;
      }

      // Plain-text PAN — encrypt it now
      const encrypted = encryptField(pan.panNumber);
      await prisma.panDetails.update({
        where: { id: pan.id },
        data: { panNumber: encrypted },
      });
      panFixed++;
    }

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
