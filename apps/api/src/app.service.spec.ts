import { describe, expect, it } from 'vitest';

import { AppService } from './app.service';

describe('AppService', () => {
  it('returns health payload', () => {
    const service = new AppService();
    const payload = service.getHealth();
    expect(payload.status).toBe('ok');
  });
});
