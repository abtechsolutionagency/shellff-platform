/// <reference path="./index.d.ts" />
declare module 'vitest/globals' {
  export * from 'vitest'
}
declare global {
  const suite: import('vitest').SuiteImplementation
  const describe: import('vitest').SuiteImplementation
  const test: import('vitest').TestAPI
  const it: import('vitest').TestAPI
  const expect: import('vitest').ExpectStatic
  const vi: import('vitest').VitestMocker
  const vitest: import('vitest').VitestGlobal
  const beforeAll: import('vitest').HookImplementation
  const afterAll: import('vitest').HookImplementation
  const beforeEach: import('vitest').HookImplementation
  const afterEach: import('vitest').HookImplementation
  const onTestFailed: (handler: (result: import('vitest').TestResult) => import('vitest').Awaitable<void>) => void
  const onTestFinished: (handler: (result: import('vitest').TestResult) => import('vitest').Awaitable<void>) => void
}
export {}