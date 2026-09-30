# CI Integration

Agentic Ops Observatory is intended to run as a lightweight review gate. A typical CI use starts in report-only mode, then moves to fail-on-high once the fixture set represents real workflow boundaries.

## Recommended Rollout

1. Add one fixture for a real workflow boundary.
2. Run the Action with `fail-on-high: "false"` and review the Markdown report.
3. Fix or explicitly accept the findings.
4. Add the JSON report as a build artifact or feed it into an internal dashboard.
5. Turn on `fail-on-high: "true"` when high-severity findings should block the change.

## GitHub Actions Example

```yaml
name: Agentic Ops

on:
  pull_request:
  workflow_dispatch:

jobs:
  observatory:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - id: agentic-ops
        uses: SilverRookLabs/agentic-ops-observatory@main
        with:
          fixtures: agentic-ops
          output: agentic-ops-observatory-report.md
          json-output: agentic-ops-observatory-report.json
          fail-on-high: "false"

      - name: Upload Agentic Ops reports
        uses: actions/upload-artifact@v4
        with:
          name: agentic-ops-observatory
          path: |
            ${{ steps.agentic-ops.outputs.report-path }}
            ${{ steps.agentic-ops.outputs.json-report-path }}
```

## Outputs

| Output | Meaning |
| --- | --- |
| `finding-count` | Total findings emitted. |
| `high-count` | High-severity findings emitted. |
| `medium-count` | Medium-severity findings emitted. |
| `low-count` | Low-severity findings emitted. |
| `report-path` | Absolute path to the Markdown report. |
| `json-report-path` | Absolute path to the JSON report, when configured. |

## JSON Report Shape

The JSON report contains three top-level keys:

- `summary`: fixture count, finding count, severity counts, and flattened findings.
- `results`: fixture-by-fixture analyzer results.
- `rules`: the detector catalog used for the run.

Example summary:

```json
{
  "fixtureCount": 6,
  "findingCount": 5,
  "severityCounts": {
    "high": 4,
    "medium": 1,
    "low": 0
  }
}
```

## Privacy Boundary

Do not put raw prompts, credentials, customer data, private messages, proprietary logs, or secrets into fixtures. Fixtures should describe categories and operating boundaries, not paste sensitive source material into CI artifacts.
