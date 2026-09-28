# Agentic Ops Observatory Report

Fixtures inspected: 6
Findings: 5
High severity: 4

## Findings

### AO-004: Evidence-free automation

- Severity: high
- Fixture: Automation recommends a consequential change with no durable evidence
- Source: `fixtures/evidence-free-automation.json`
- Detail: The workflow makes a consequential recommendation or action without durable evidence a reviewer can inspect.

### AO-002: Missing human gate for external action

- Severity: high
- Fixture: Release assistant can publish without approval
- Source: `fixtures/missing-approval-gate.json`
- Actions: `Publish GitHub release`
- Detail: The workflow can perform an external action without an explicit human approval gate.

### AO-001: Monitor self-burn

- Severity: high
- Fixture: Quota watcher consumes premium model quota
- Source: `fixtures/monitor-self-burn.json`
- Resources: `openai:gpt-5.5`
- Detail: The normal path consumes a resource the workflow is meant to monitor.

### AO-003: Sensitive context exposure

- Severity: medium
- Fixture: Support agent logs private customer context
- Source: `fixtures/sensitive-context-exposure.json`
- Flows: `customer-data -> logs`
- Detail: Sensitive input can flow into prompts, logs, URLs, generated artifacts, or another exposed sink.

### AO-005: Unbounded retry or loop

- Severity: high
- Fixture: Agent retries failed API investigation without a stop rule
- Source: `fixtures/unbounded-loop.json`
- Detail: The workflow can repeatedly call tools, APIs, models, or external actions without a declared stopping condition.
