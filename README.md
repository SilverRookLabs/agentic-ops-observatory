# Agentic Ops Observatory

Local-first checks for costly or unsafe agent workflows.

Agentic Ops Observatory is a working v0 fixture analyzer. It reads public-safe JSON descriptions of agent workflows, flags five operational failure classes, and writes a Markdown report that can be used locally or in GitHub Actions.

It is not a general trace parser yet. The current version trusts the fixture data you provide.

## What Works Today

- Local Node CLI for JSON fixture files, directories, and simple glob patterns.
- GitHub Action wrapper.
- Markdown report generation.
- High-severity CI failure mode.
- AO-001 through AO-005 detectors:
  - monitor self-burn;
  - missing human approval gate;
  - sensitive context exposure;
  - evidence-free automation;
  - unbounded retry or loop.
- Six synthetic fixtures and a generated example report.
- Node test coverage for detector and CLI behavior.

## Quickstart

```bash
git clone https://github.com/SilverRookLabs/agentic-ops-observatory.git
cd agentic-ops-observatory
npm test
node src/index.js fixtures --fail-on-high=false
```

The analyzer writes `agentic-ops-observatory-report.md` by default.

To choose an output path:

```bash
node src/index.js fixtures --output reports/agentic-ops.md --fail-on-high=false
```

To make CI fail when high-severity findings exist, omit `--fail-on-high=false`:

```bash
node src/index.js fixtures
```

## Example Result

The checked-in fixtures currently produce:

- 6 fixtures inspected;
- 5 findings;
- 4 high-severity findings;
- 1 medium-severity finding.

See [docs/example-report.md](docs/example-report.md).

## GitHub Action

```yaml
name: Agentic Ops Observatory

on:
  pull_request:
  workflow_dispatch:

jobs:
  agentic-ops:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: SilverRookLabs/agentic-ops-observatory@main
        with:
          fixtures: agentic-ops
          output: agentic-ops-observatory-report.md
          fail-on-high: "true"
```

Use `fail-on-high: "false"` when you want a report-only pass.

## Fixture Format

Fixtures are small JSON files that describe the operational boundaries of an agent workflow. The analyzer intentionally starts from explicit fixture data before attempting arbitrary trace parsing.

See [docs/fixture-format.md](docs/fixture-format.md).

## Detector Coverage

| ID | Failure Class | Looks For |
| --- | --- | --- |
| AO-001 | Monitor self-burn | A recurring monitor consumes the scarce resource it is meant to protect. |
| AO-002 | Missing human gate | External or irreversible actions can execute without human approval. |
| AO-003 | Sensitive context exposure | Secrets, credentials, private data, or internal context flow into exposed sinks. |
| AO-004 | Evidence-free automation | Consequential recommendations lack durable evidence. |
| AO-005 | Unbounded retry or loop | Repeated model/tool/API work lacks stop conditions or budgets. |

Detailed detector notes live in [docs/failure-taxonomy.md](docs/failure-taxonomy.md).

## What This Is Not Yet

- It does not parse arbitrary logs, workflow YAML, traces, or prompts.
- It does not prove a workflow is safe.
- It does not certify compliance.
- It does not send data to Silver Rook Labs.
- It is not a hosted dashboard.
- It is not a model benchmark.

## Privacy and Telemetry

The CLI and Action run in your local environment or GitHub runner. They do not transmit prompts, traces, logs, repository contents, or secrets to Silver Rook Labs.

Do not put raw secrets, customer data, private messages, or proprietary logs into fixtures. Use categories and summaries instead.

## Development Status

Status: working v0 research preview.

The fixture analyzer is functional and tested. The next useful improvements are trace adapters, richer schema validation, more before/after fixtures, and a stable release tag.

Public-facing progress is tracked in [CHANGELOG.md](CHANGELOG.md).
