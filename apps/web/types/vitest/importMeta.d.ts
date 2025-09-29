/// <reference path="./index.d.ts" />

declare module 'vitest/importMeta' {
  import type { VitestGlobal } from 'vitest'

  interface ImportMeta {
    readonly vitest?: VitestGlobal
  }
}

export {}
