# Agentic Ops Fixture Format v0

Agentic Ops Observatory reads JSON fixtures that describe a workflow's operating boundaries. The format is intentionally small so users can write fixtures by hand before deeper trace adapters exist.

## Top-Level Fields

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | string | Stable fixture identifier. |
| `name` | string | Human-readable workflow name. |
| `automated` | boolean | Whether the workflow can run without a human trigger. |
| `consequential` | boolean | Whether the workflow can affect money, production state, public artifacts, or third parties. |
| `schedule.recurring` | boolean | Whether the workflow repeats on a schedule or loop. |
| `monitoredResources` | string[] | Scarce resources the workflow is meant to protect or monitor. |
| `normalPath.resourceConsumption` | string[] | Scarce resources consumed during the ordinary no-op path. |
| `externalActions` | object[] | Public, financial, production, or third-party actions the workflow can perform. |
| `dataFlows` | object[] | Declared flows from input categories to output/sink categories. |
| `evidence` | object | Durable evidence preserved for review. |
| `retryPolicy` / `loopPolicy` | object | Stop conditions and budgets for repeated work. |

## Detector Mapping

| Detector | Required Fixture Data |
| --- | --- |
| AO-001 Monitor Self-Burn | `monitoredResources`, `normalPath.resourceConsumption`, `schedule.recurring` |
| AO-002 Missing Human Gate | `externalActions[].type`, `externalActions[].requiresHumanApproval`, `externalActions[].draftOnly` |
| AO-003 Sensitive Context Exposure | `dataFlows[].fromCategory`, `dataFlows[].toCategory`, `dataFlows[].masked` |
| AO-004 Evidence-Free Automation | `consequential`, `recommendation.consequential`, `evidence` |
| AO-005 Unbounded Retry Or Loop | `schedule.recurring`, `retryPolicy`, `loopPolicy`, `normalPath.resourceConsumption` |

## Example

```json
{
  "id": "release-assistant",
  "name": "Release assistant can publish without approval",
  "automated": true,
  "consequential": true,
  "externalActions": [
    {
      "name": "Publish GitHub release",
      "type": "release",
      "external": true,
      "requiresHumanApproval": false
    }
  ],
  "evidence": {
    "reportPaths": ["release-plan.md"]
  },
  "retryPolicy": {
    "maxAttempts": 1
  }
}
```

## v0 Boundaries

- The analyzer trusts fixture declarations; it does not yet parse arbitrary workflows.
- The report is an operational sanity check, not a compliance certification.
- Fixture authors should avoid including credentials, private customer text, or raw secrets. Use categories and summaries instead.
