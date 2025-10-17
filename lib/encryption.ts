import crypto from 'crypto';
import { Encryptable } from '@/app/types/encryption';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

export function encryptJSON(plain: Encryptable, secret: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  const text = JSON.stringify(plain);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptJSON(token: string, secret: string) {
  const b = Buffer.from(token, 'base64');
  const iv = b.slice(0, IV_LENGTH);
  const tag = b.slice(IV_LENGTH, IV_LENGTH + 16);
  const data = b.slice(IV_LENGTH + 16);
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}
