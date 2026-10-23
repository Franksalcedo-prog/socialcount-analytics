import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken, maskToken } from '../src/services/encryption.service.js';

describe('Encryption Service (AES-256-GCM)', () => {
  it('debe cifrar y descifrar correctamente un token de Meta', () => {
    const rawToken = 'EAAG_test_user_token_meta_1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encryptToken(rawToken);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(rawToken);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:cipher

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toEqual(rawToken);
  });

  it('debe generar diferentes vectores de inicialización (IV) para el mismo texto en llamadas consecutivas', () => {
    const rawToken = 'EAAG_same_token_multiple_times';
    const encrypted1 = encryptToken(rawToken);
    const encrypted2 = encryptToken(rawToken);

    expect(encrypted1).not.toEqual(encrypted2);
    expect(decryptToken(encrypted1)).toEqual(rawToken);
    expect(decryptToken(encrypted2)).toEqual(rawToken);
  });

  it('debe fallar al intentar descifrar una cadena manipulada o con tag inválido', () => {
    const rawToken = 'secret_token';
    const encrypted = encryptToken(rawToken);
    const parts = encrypted.split(':');

    // Alterar el tag de autenticación de forma garantizada
    const tamperedTag = (parts[1][0] === 'a' ? 'b' : 'a') + parts[1].slice(1);
    const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`;

    expect(() => decryptToken(tampered)).toThrow();
  });

  it('debe enmascarar tokens correctamente para logs seguros', () => {
    const token = 'EAAG1234567890abcdefXYZ';
    const masked = maskToken(token);
    expect(masked).toEqual('EAAG...fXYZ');
  });
});
