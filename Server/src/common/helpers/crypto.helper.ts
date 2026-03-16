import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes, randomInt } from 'crypto';
import { AppConstants } from '../constants/time.constants';

export class CryptoHelper {
  /** Internal shared hashing function */
  private static async hashValue(value: string): Promise<string> {
    const salt = await bcrypt.genSalt(AppConstants.BCRYPT_SALT_ROUNDS);
    return bcrypt.hash(value, salt);
  }

  /** Internal shared compare function */
  private static async compareValue(
    raw: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }

  // ============================
  // PASSWORD METHODS
  // ============================

  /** Hash plain text password */
  static hashPassword(password: string): Promise<string> {
    return this.hashValue(password);
  }

  /** Compare plain password with hashed password */
  static comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return this.compareValue(plainPassword, hashedPassword);
  }

  // ============================
  // OTP METHODS
  // ============================

  /** Generate numeric OTP */
  static generateOtp(): string {
    let otp = '';
    for (let i = 0; i < AppConstants.OTP_LENGTH; i++) {
      otp += randomInt(0, 10).toString(); // random digit 0-9
    }
    return otp;
  }

  /** Hash OTP */
  static hashOtp(otp: string): Promise<string> {
    return this.hashValue(otp);
  }

  /** Compare OTP with hashed OTP */
  static compareOtp(
    plainOtp: string,
    hashedOtp: string,
  ): Promise<boolean> {
    return this.compareValue(plainOtp, hashedOtp);
  }

  // ============================
  // FIELD ENCRYPTION (AES-256-GCM)
  // ============================
  // Key must be a 64-char hex string (32 bytes) stored in ACCOUNT_NUMBER_ENCRYPTION_KEY.
  // Storage format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"

  private static getFieldEncryptionKey(): Buffer {
    const hex = process.env.ACCOUNT_NUMBER_ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
      throw new Error('ACCOUNT_NUMBER_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
    return Buffer.from(hex, 'hex');
  }

  /**
   * Encrypts a plaintext string with AES-256-GCM.
   * Returns "<iv_hex>:<authTag_hex>:<ciphertext_hex>".
   */
  static encryptField(plaintext: string): string {
    const key = CryptoHelper.getFieldEncryptionKey();
    const iv = randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts a value produced by encryptField().
   * Throws if the value is tampered (authTag mismatch).
   */
  static decryptField(stored: string): string {
    const key = CryptoHelper.getFieldEncryptionKey();
    const parts = stored.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted field format');
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
