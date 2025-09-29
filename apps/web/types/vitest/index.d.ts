declare namespace Vitest {
  type Awaitable<T> = T | Promise<T>

  interface TestResult {
    readonly id?: string
    readonly name?: string
    readonly state: 'pass' | 'fail' | 'skip' | 'todo' | 'only'
    readonly errors?: readonly unknown[]
    readonly duration?: number
  }

  interface TestContext {
    readonly meta?: Record<string, unknown>
    readonly expect: ExpectStatic
    onTestFailed(handler: (result: TestResult) => Awaitable<void>): void
    onTestFinished(handler: (result: TestResult) => Awaitable<void>): void
    skip(): void
    todo(reason?: string): void
    fail(reason?: string): void
    [key: string]: unknown
  }

  type TestImplementation<TContext extends TestContext = TestContext> = (
    context: TContext,
  ) => Awaitable<void>

  interface HookImplementation<TContext extends TestContext = TestContext> {
    (implementation: TestImplementation<TContext>, timeout?: number): void
    skip?(reason?: string): void
    retry?(retries: number): void
  }

  interface SuiteImplementation {
    (name: string, handler: () => Awaitable<void> | void, timeout?: number): void
    skip(name: string, handler: () => Awaitable<void> | void, timeout?: number): void
    only(name: string, handler: () => Awaitable<void> | void, timeout?: number): void
    todo(name: string, handler?: () => Awaitable<void> | void): void
    concurrent(name: string, handler: () => Awaitable<void> | void, timeout?: number): void
    each<T extends ReadonlyArray<unknown> | ReadonlyArray<ReadonlyArray<unknown>>>(
      cases: T,
    ): (name: string, handler: (...args: T extends ReadonlyArray<ReadonlyArray<infer U>> ? U[] : T[number][]) => Awaitable<void> | void, timeout?: number) => void
  }

  interface TestAPI<TContext extends TestContext = TestContext> {
    (name: string, implementation: TestImplementation<TContext>, timeout?: number): void
    skip(name: string, implementation: TestImplementation<TContext>, timeout?: number): void
    only(name: string, implementation: TestImplementation<TContext>, timeout?: number): void
    todo(name: string, reason?: string): void
    concurrent(name: string, implementation: TestImplementation<TContext>, timeout?: number): void
    fails(name: string, implementation: TestImplementation<TContext>, timeout?: number): void
    each<T extends ReadonlyArray<unknown> | ReadonlyArray<ReadonlyArray<unknown>>>(
      cases: T,
    ): (name: string, implementation: (
      ...args: T extends ReadonlyArray<ReadonlyArray<infer U>> ? U[] : T[number][],
    ) => Awaitable<void> | void) => void
    extend<TExtension extends Record<string, unknown>>(
      fixtures: TExtension,
    ): TestAPI<TestContext & TExtension>
    retry(count: number): TestAPI<TContext>
    runIf(predicate: boolean | (() => boolean)):
      | TestAPI<TContext>
      | ((name: string, implementation: TestImplementation<TContext>, timeout?: number) => void)
    skipIf(predicate: boolean | (() => boolean)):
      | TestAPI<TContext>
      | ((name: string, implementation: TestImplementation<TContext>, timeout?: number) => void)
  }

  interface MatcherResult {
    pass: boolean
    message(): string
  }

  interface Matchers<T> {
    readonly not: Matchers<T>
    readonly resolves: Matchers<Awaited<T>>
    readonly rejects: Matchers<unknown>
    [assertion: string]: (...args: any[]) => Awaitable<void> | MatcherResult | void
  }

  interface ExpectStatic {
    <T>(actual: T): Matchers<T>
    <T>(actual: Awaitable<T>): Matchers<Awaited<T>>
    extend(matchers: Record<string, (...args: any[]) => Awaitable<MatcherResult | void> | MatcherResult | void>): void
    addSnapshotSerializer(serializer: { test: (value: unknown) => boolean; print: (value: unknown, serialize: (input: unknown) => string) => string }): void
    assertions(expected: number): void
    hasAssertions(): void
    getState(): Record<string, unknown>
    setState(state: Record<string, unknown>): void
  }

  type AnyFunction = (...args: any[]) => any

  interface SpyInstance<Args extends any[] = any[], Return = any> {
    get mock(): {
      calls: Args[]
      results: { type: 'return' | 'throw' | 'incomplete'; value: Return | unknown }[]
    }
    mockImplementation(impl: (...args: Args) => Return): this
    mockImplementationOnce(impl: (...args: Args) => Return): this
    mockReturnValue(value: Return): this
    mockReturnValueOnce(value: Return): this
    mockResolvedValue(value: Awaitable<Return>): this
    mockRejectedValue(error: unknown): this
    restore(): void
    reset(): void
    clear(): void
  }

  interface VitestMocker {
    fn<T extends AnyFunction = AnyFunction>(implementation?: T): SpyInstance<Parameters<T>, ReturnType<T>>
    spyOn<T extends object, K extends keyof T>(object: T, method: K): T[K] extends AnyFunction
      ? SpyInstance<Parameters<T[K]>, ReturnType<T[K]>>
      : never
    mock(module: string, factory: () => any): void
    unmock(module: string): void
    importActual<T = unknown>(module: string): Promise<T>
    importMock<T = unknown>(module: string): Promise<T>
    resetAllMocks(): void
    restoreAllMocks(): void
    clearAllMocks(): void
  }

  interface VitestGlobal {
    readonly config: Record<string, unknown>
    readonly environment: string
    readonly expect: ExpectStatic
    readonly vi: VitestMocker
    readonly suite: SuiteImplementation
    readonly test: TestAPI
  }
}

declare module 'vitest' {
  export type Awaitable<T> = Vitest.Awaitable<T>
  export type TestResult = Vitest.TestResult
  export type TestContext = Vitest.TestContext
  export type TestImplementation<TContext extends TestContext = TestContext> = Vitest.TestImplementation<TContext>
  export type HookImplementation<TContext extends TestContext = TestContext> = Vitest.HookImplementation<TContext>
  export type SuiteImplementation = Vitest.SuiteImplementation
  export type TestAPI<TContext extends TestContext = TestContext> = Vitest.TestAPI<TContext>
  export type MatcherResult = Vitest.MatcherResult
  export type Matchers<T> = Vitest.Matchers<T>
  export type ExpectStatic = Vitest.ExpectStatic
  export type SpyInstance<Args extends any[] = any[], Return = any> = Vitest.SpyInstance<Args, Return>
  export type VitestMocker = Vitest.VitestMocker
  export type VitestGlobal = Vitest.VitestGlobal

  export const expect: ExpectStatic
  export const vi: VitestMocker
  export const vitest: VitestGlobal
  export const suite: SuiteImplementation
  export const describe: SuiteImplementation
  export const test: TestAPI
  export const it: TestAPI
  export const beforeAll: Vitest.HookImplementation
  export const afterAll: Vitest.HookImplementation
  export const beforeEach: Vitest.HookImplementation
  export const afterEach: Vitest.HookImplementation
  export function onTestFailed(handler: (result: TestResult) => Vitest.Awaitable<void>): void
  export function onTestFinished(handler: (result: TestResult) => Vitest.Awaitable<void>): void
}

export {}
