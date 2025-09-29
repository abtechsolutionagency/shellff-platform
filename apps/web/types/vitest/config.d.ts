/// <reference path="./index.d.ts" />

declare module 'vitest/config' {
  interface TestConfig {
    include?: readonly string[]
    exclude?: readonly string[]
    globals?: boolean
    environment?: string
    setupFiles?: string | readonly string[]
    alias?: Record<string, string | readonly string[]>
    coverage?: Record<string, unknown>
    reporters?: readonly (string | [string, Record<string, unknown>])[]
    [key: string]: unknown
  }

  interface InlineConfig {
    root?: string
    base?: string
    mode?: string
    plugins?: unknown[]
    resolve?: Record<string, unknown>
    server?: Record<string, unknown>
    preview?: Record<string, unknown>
    test?: TestConfig
    [key: string]: unknown
  }

  interface ConfigEnv {
    readonly command: 'build' | 'serve' | 'test' | string
    readonly mode: string
  }

  type UserConfigExport =
    | InlineConfig
    | Promise<InlineConfig>
    | ((env: ConfigEnv) => InlineConfig | Promise<InlineConfig>)

  export type { ConfigEnv, InlineConfig, TestConfig, UserConfigExport }

  export function defineConfig<T extends UserConfigExport>(config: T): T
}

export {}
