# Changelog

Agentic Ops Observatory is still a research preview. This log records public-facing product progress only.

## 2026-09-30 - CI Report Integration Pass

- Added optional machine-readable JSON reports with `--json-output`.
- Added `--list-rules` for automation and documentation consumers.
- Added medium, low, and JSON-report Action outputs.
- Added CI integration documentation and a checked-in JSON example report.
- Expanded CLI tests for JSON output and rule catalog behavior.

## 2026-09-29 - Working v0 Public Overhaul

- Rewrote the README to describe the actual working fixture analyzer instead of a future scaffold.
- Added CLI help, output-path selection, and explicit `--fail-on-high` control.
- Added suggested next steps to report findings.
- Regenerated the example report from the checked-in fixtures.
- Expanded CLI tests around help text and report output.
- Updated the GitHub Action metadata to expose an `output` input.

## 2026-09-27 - Public Scope Tightening

- Limited the public package to the checker, synthetic fixtures, docs needed to run and understand it, and tests.
- Reduced the public inventory to product source, fixtures, tests, and usage documentation.

## 2026-09-25 - Public Contribution Prep

- Added contribution guidance for public-safe fixtures and detector checks.
- Updated public artifact hygiene candidates to include contribution and changelog surfaces.

## 2026-09-24 - Local v0 Scaffold

- Added AO-001 through AO-005 fixture coverage.
- Added local CLI analyzer and GitHub Action wrapper metadata.
- Added fixture format, failure taxonomy, annotated example, example report, public file inventory, and hygiene checker.
