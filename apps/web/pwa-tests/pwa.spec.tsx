import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let useEffectImpl: ((fn: () => void) => void) | undefined;
let useStateImpl: (<T>(initial: T) => [T, (next: T) => void]) | undefined;

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useEffect: (callback: () => void) => {
      if (useEffectImpl) {
        useEffectImpl(callback);
      } else {
        callback();
      }
    },
    useState: <T,>(initial: T): [T, (next: T) => void] => {
      if (useStateImpl) {
        return useStateImpl(initial) as [T, (next: T) => void];
      }
      return actual.useState(initial);
    },
  };
});

const React = await vi.importActual<typeof import('react')>('react');

import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import OfflinePage from '@/app/offline/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

const specDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(specDir, '..', '..', '..');
const expectedFixtures = [
  join(repoRoot, 'fixtures', 'audio', 'sample.mp3'),
  join(repoRoot, 'fixtures', 'audio', 'sample.wav'),
  join(repoRoot, 'fixtures', 'audio', 'sample.flac'),
  join(repoRoot, 'fixtures', 'images', 'cover.png'),
  join(repoRoot, 'fixtures', 'images', 'cover.jpg'),
  join(repoRoot, 'fixtures', 'images', 'barcode.svg'),
];

describe('PWA web experience flows', () => {
  let originalWindow: typeof window | undefined;
  let originalDocument: Document | undefined;
  let originalNavigator: Navigator | undefined;
  let eventListeners: Record<string, Array<(event: Event) => void>>;

  beforeAll(() => {
    execSync('pnpm generate:fixtures', { cwd: repoRoot, stdio: 'pipe' });
    const missing = expectedFixtures.filter((fixturePath) => !existsSync(fixturePath));
    if (missing.length > 0) {
      throw new Error(`Missing generated fixtures: ${missing.join(', ')}`);
    }
  });

  beforeEach(() => {
    eventListeners = {};
    originalWindow = global.window;
    originalDocument = global.document;
    originalNavigator = global.navigator;

    const navigatorStub = {
      userAgent: 'Mozilla/5.0',
      standalone: false,
      onLine: true,
      serviceWorker: {
        controller: {},
        register: vi.fn(),
        addEventListener: vi.fn(),
      },
    } as unknown as Navigator & { serviceWorker: ServiceWorkerContainer };

    const windowStub = {
      addEventListener: vi.fn((type: string, listener: (event: Event) => void) => {
        eventListeners[type] = eventListeners[type] ?? [];
        eventListeners[type]!.push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: (event: Event) => void) => {
        eventListeners[type] = (eventListeners[type] ?? []).filter((fn) => fn !== listener);
      }),
      dispatchEvent: vi.fn((event: Event) => {
        eventListeners[event.type]?.forEach((listener) => listener(event));
        return true;
      }),
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      confirm: vi.fn(),
      location: {
        reload: vi.fn(),
      },
      navigator: navigatorStub,
    } as unknown as typeof window;

    const documentStub = {
      body: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
    } as unknown as Document;

    global.window = windowStub;
    global.document = documentStub;
    global.navigator = navigatorStub;
  });

  afterEach(() => {
    global.window = originalWindow as Window & typeof globalThis.window;
    global.document = originalDocument as Document;
    global.navigator = originalNavigator as Navigator;
    vi.restoreAllMocks();
    useEffectImpl = undefined;
    useStateImpl = undefined;
    delete process.env.NEXT_PUBLIC_ENABLE_SW_TESTS;
  });

  it('reveals the install prompt after the beforeinstallprompt event', () => {
    vi.useFakeTimers();

    const deferredPromptSetter = vi.fn();
    const showInstallSetter = vi.fn();
    const isIOSSetter = vi.fn();
    const isStandaloneSetter = vi.fn();

    let stateCallIndex = 0;
    useStateImpl = <T,>(initial: T): [T, (next: T) => void] => {
      const setter = vi.fn((value: T) => undefined);
      switch (stateCallIndex) {
        case 0:
          setter.mockImplementation((value: T) => {
            deferredPromptSetter(value as unknown as Event);
          });
          break;
        case 1:
          setter.mockImplementation((value: T) => {
            showInstallSetter(value as unknown as boolean);
          });
          break;
        case 2:
          setter.mockImplementation((value: T) => {
            isIOSSetter(value as unknown as boolean);
          });
          break;
        case 3:
          setter.mockImplementation((value: T) => {
            isStandaloneSetter(value as unknown as boolean);
          });
          break;
      }
      stateCallIndex += 1;
      return [initial, setter];
    };

    const effectSpy = vi.fn((fn: () => void) => fn());
    useEffectImpl = (fn) => {
      effectSpy(fn);
    };

    renderToStaticMarkup(<InstallPrompt />);

    expect(effectSpy).toHaveBeenCalled();

    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      preventDefault: () => undefined,
    });

    global.window.dispatchEvent(event);
    vi.runAllTimers();

    expect(deferredPromptSetter).toHaveBeenCalledWith(event);
    expect(showInstallSetter).toHaveBeenCalledWith(true);

    vi.useRealTimers();
  });

  it('renders offline messaging when navigator reports offline', () => {
    Object.defineProperty(global.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    useEffectImpl = () => undefined;

    const markup = renderToStaticMarkup(<OfflinePage />);

    expect(markup).toContain('You&#x27;re Offline');
  });

  it('asks for a refresh when a new service worker version is installed', async () => {
    const confirmSpy = vi.spyOn(global.window, 'confirm').mockReturnValue(true);
    const reloadSpy = vi.spyOn(global.window.location, 'reload');

    process.env.NEXT_PUBLIC_ENABLE_SW_TESTS = 'true';

    const workerListeners: Record<string, Array<() => void>> = {};
    const worker = {
      state: 'installing',
      addEventListener: vi.fn((type: string, listener: () => void) => {
        workerListeners[type] = workerListeners[type] ?? [];
        workerListeners[type]!.push(listener);
      }),
    } as unknown as ServiceWorker;

    const registrationListeners: Record<string, Array<() => void>> = {};
    const registration = {
      installing: worker,
      addEventListener: vi.fn((type: string, listener: () => void) => {
        registrationListeners[type] = registrationListeners[type] ?? [];
        registrationListeners[type]!.push(listener);
      }),
    } as unknown as ServiceWorkerRegistration & { triggerUpdate: () => void };

    (registration as unknown as { triggerUpdate: () => void }).triggerUpdate = () => {
      registrationListeners['updatefound']?.forEach((listener) => listener());
      worker.state = 'installed';
      workerListeners['statechange']?.forEach((listener) => listener());
    };

    Object.assign(global.navigator, {
      serviceWorker: {
        controller: {},
        register: vi.fn().mockResolvedValue(registration),
        addEventListener: vi.fn(),
      },
    });

    useEffectImpl = (fn) => {
      fn();
    };

    renderToStaticMarkup(
      <PWAProvider>
        <div>shellff</div>
      </PWAProvider>,
    );

    const loadPromises = eventListeners['load']?.map((listener) => listener(new Event('load')));
    if (loadPromises && loadPromises.length > 0) {
      await Promise.all(loadPromises);
    }

    const registerMock = global.navigator.serviceWorker
      .register as unknown as vi.Mock;
    expect(registerMock).toHaveBeenCalled();

    const resolvedRegistration = await registerMock.mock.results[0].value;
    (resolvedRegistration as { triggerUpdate: () => void }).triggerUpdate();

    expect(confirmSpy).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });
});
