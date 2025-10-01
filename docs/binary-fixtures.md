# Binary fixture workflow

This repository keeps the git history text-only. Binary payloads that tests rely on are generated locally from deterministic base64 definitions.

## Generating the fixtures

```bash
pnpm generate:fixtures
```

The command will run any package-level generators and execute [`scripts/generate-binary-fixtures.mjs`](../scripts/generate-binary-fixtures.mjs) to emit binary payloads into the git-ignored [`fixtures/`](../fixtures/) directory. The script produces a manifest summarizing the outputs so that tests can reference fixture metadata without parsing the binary blobs.

## Outputs

Running the generator yields four fixtures:

- `prism.bin` – seeded spectral noise sample for color-mapping checks.
- `lattice.bin` – pseudo-random lattice weights used by queue scheduling specs.
- `glacier.bin` – compact PCM envelope approximating a frozen pad swell.
- `ember.bin` – high-contrast glitch burst for resilience and corruption tests.

The assets live in `fixtures/binaries/` and are safe to delete—they will be recreated on demand by the generator. Keep all changes to the fixture definitions within the repository’s TypeScript or script sources so they remain reviewable.
