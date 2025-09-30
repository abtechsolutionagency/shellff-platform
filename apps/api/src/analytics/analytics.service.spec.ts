import { describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from './analytics.service';
import type { AuditService } from '../audit/audit.service';

describe('AnalyticsService', () => {
  it('delegates analytics events to the audit service with analytics actor type', async () => {
    const audit: AuditService = {
      recordEvent: vi.fn(),
      latest: vi.fn(),
    } as unknown as AuditService;

    const service = new AnalyticsService(audit);

    await service.track('downloads.bundle.requested', { foo: 'bar' }, {
      userId: 'user-1',
      target: 'bundle-1',
      requestId: 'req-1',
    });

    expect(audit.recordEvent).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      actorType: 'analytics',
      event: 'analytics.downloads.bundle.requested',
      target: 'bundle-1',
      metadata: { foo: 'bar' },
      requestId: 'req-1',
    });
  });
});
