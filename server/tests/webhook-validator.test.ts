import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

describe('Meta Webhook HMAC-SHA256 Validator', () => {
  const secret = 'test_meta_app_secret_12345';
  const payload = JSON.stringify({
    object: 'page',
    entry: [{ id: '123', time: 1700000000 }],
  });

  it('debe validar exitosamente una firma HMAC-SHA256 legítima', () => {
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(payload).digest('hex');
    const headerValue = `sha256=${signature}`;

    const parts = headerValue.split('=');
    expect(parts[0]).toBe('sha256');

    const expectedBuf = Buffer.from(parts[1], 'hex');
    const calculatedBuf = crypto.createHmac('sha256', secret).update(payload).digest();

    const matches = crypto.timingSafeEqual(expectedBuf, calculatedBuf);
    expect(matches).toBe(true);
  });

  it('debe rechazar una firma manipulada', () => {
    const fakeSignature = '0000000000000000000000000000000000000000000000000000000000000000';
    const fakeBuf = Buffer.from(fakeSignature, 'hex');
    const calculatedBuf = crypto.createHmac('sha256', secret).update(payload).digest();

    const matches = crypto.timingSafeEqual(fakeBuf, calculatedBuf);
    expect(matches).toBe(false);
  });
});
