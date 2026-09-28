# Annotated Example: External Action Gate

This example shows how a small fixture can catch a workflow that looks harmless in prose but can cross a real authority boundary.

## Bad Fixture

```json
{
  "id": "release-bot",
  "name": "Automated release publisher",
  "externalActions": [
    {
      "name": "Publish release",
      "type": "release",
      "external": true,
      "irreversible": true,
      "requiresHumanApproval": false
    }
  ]
}
```

## Finding

The analyzer emits `AO-002` because the workflow can publish externally without a human approval gate.

```md
### AO-002: Missing human gate for external action

- Severity: high
- Fixture: Automated release publisher
- Actions: `Publish release`
- Detail: The workflow can perform an external action without an explicit human approval gate.
```

## Fixed Fixture

```json
{
  "id": "release-bot-fixed",
  "name": "Draft release preparer",
  "externalActions": [
    {
      "name": "Prepare release draft",
      "type": "release",
      "external": true,
      "draftOnly": true,
      "requiresHumanApproval": true
    }
  ],
  "evidence": {
    "reportPaths": ["docs/release-review.md"]
  }
}
```

## Why This Matters

The fix does not remove automation. It narrows automation to preparation, preserves review evidence, and makes publication a separate human-approved action.

That is the core product stance: keep useful agents, but make authority, evidence, cost, and sensitive context explicit enough to review.
