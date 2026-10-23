import crypto from 'node:crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Deriva una clave de 32 bytes a partir de la clave configurada
 */
function getKey(): Buffer {
  const masterKey = config.encryptionMasterKey;
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY no está configurada.');
  }

  // Si es un string hex de 64 caracteres (32 bytes)
  if (masterKey.length === 64 && /^[0-9a-fA-F]+$/.test(masterKey)) {
    return Buffer.from(masterKey, 'hex');
  }

  // Si no, derivar mediante SHA-256 para garantizar 32 bytes exactos
  return crypto.createHash('sha256').update(masterKey).digest();
}

/**
 * Cifra un texto en plano (ej. access token) usando AES-256-GCM
 * Formato retornado: `${ivHex}:${authTagHex}:${encryptedHex}`
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Descifra una cadena previamente cifrada con encryptToken
 */
export function decryptToken(encryptedPayload: string): string {
  if (!encryptedPayload) return '';

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de carga cifrada inválido (se esperaba iv:tag:cipher).');
  }

  const [ivHex, tagHex, cipherHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mascara tokens para auditoría segura sin revelar contenido
 * Ejemplo: "EAAG...1234"
 */
export function maskToken(token: string): string {
  if (!token || token.length < 10) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}
