export type AnalyticsEventPayload = Record<string, unknown> | undefined;
export type AnalyticsListener = (event: string, payload: AnalyticsEventPayload) => void;

const listeners = new Set<AnalyticsListener>();

export function trackAnalyticsEvent(event: string, payload?: AnalyticsEventPayload): void {
  for (const listener of listeners) {
    try {
      listener(event, payload);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[analytics] listener error', error);
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event, payload ?? {});
  }
}

export function subscribeToAnalytics(listener: AnalyticsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
