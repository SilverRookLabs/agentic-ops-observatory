# Agentic Ops Observatory

> **Research preview** — a local-first checker for agent workflows that waste scarce resources, miss approval gates, leak sensitive context, or fail without useful evidence.

## What It Is

Agentic Ops Observatory is intended to become a local CLI and GitHub Action that reviews agentic workflow descriptions, execution traces, or audit fixtures and emits a Markdown report.

The first target is not model evaluation. It is operational sanity:

- Does the monitor consume the scarce resource it is meant to protect?
- Can a no-op path burn token, quota, or paid execution capacity?
- Does a workflow attempt external actions without a human approval gate?
- Are secrets, credentials, or sensitive context exposed in prompts, logs, or generated artifacts?
- Does the workflow leave enough evidence for a maintainer to understand what happened?

## Why This Exists

Teams are rapidly adding agents to development, operations, research, and monitoring loops. Many failures are not dramatic model hallucinations. They are boring systems failures: a quota monitor that spends quota, an automation that retries forever, a tool that hides the evidence needed to debug it, or a workflow that can act externally without a clear authority boundary.

This project aims to turn those failures into a practical open taxonomy, reproducible fixtures, and eventually CI checks.

## Planned v0

- Failure taxonomy v0.
- JSON fixture format for describing an agent workflow.
- Local CLI that analyzes fixtures and writes Markdown.
- GitHub Action wrapper.
- Example report for the "monitor consumes monitored resource" failure class.
- Public-safe fixture and report examples.

## Initial Failure Classes

See [docs/failure-taxonomy.md](docs/failure-taxonomy.md).

The seed fixture produces [docs/example-report.md](docs/example-report.md), which demonstrates the first detector: a recurring quota watcher that consumes the premium model quota it is supposed to monitor.

Fixture authoring is documented in [docs/fixture-format.md](docs/fixture-format.md).

For a before/after walkthrough, see [docs/annotated-example.md](docs/annotated-example.md).

Contribution guidance lives in [CONTRIBUTING.md](CONTRIBUTING.md), and public-facing progress is tracked in [CHANGELOG.md](CHANGELOG.md).

## Non-Goals

- Hosted SaaS dashboard.
- Secret ingestion by Silver Rook Labs.
- Universal AI safety certification.
- Model leaderboard.
- Fake precision about workflows the tool cannot inspect.

## Privacy and Telemetry

The planned CLI and Action should run inside the user's local environment or GitHub runner. It should not transmit prompts, traces, logs, repository contents, or secrets to Silver Rook Labs.

## Public Scope

This repository is limited to the checker, synthetic fixtures, public-safe documentation, and tests.

## Development Status

This folder is the first durable scaffold. The AO-001 through AO-005 fixture analyzer is working locally; the broader package is not yet ready for public release.

```bash
npm test
INPUT_FAIL_ON_HIGH=false node src/index.js fixtures
INPUT_FAIL_ON_HIGH=false node src/index.js "fixtures/**/*.json"
```
