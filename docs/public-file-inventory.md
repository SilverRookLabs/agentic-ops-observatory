# Public File Inventory

This inventory defines the intended public package for Agentic Ops Observatory.

## Include

- `.github/workflows/agentic-ops.yml`
- `.gitignore`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `README.md`
- `action.yml`
- `docs/annotated-example.md`
- `docs/example-report.md`
- `docs/failure-taxonomy.md`
- `docs/fixture-format.md`
- `docs/public-file-inventory.md`
- `fixtures/*.json`
- `package.json`
- `src/*.js`
- `test/*.js`

## Exclude

- `.silverrook/asset.yaml`
- non-product planning materials
- internal validation or decision records
- Any internal plan, decision log, queue file, or routing metadata.
- Any generated `agentic-ops-observatory-report.md` file at the product root.

## Publication Rule

Publish from a clean public tree assembled from the include list, not by exposing the full internal `openclaw-dev` repository history.
