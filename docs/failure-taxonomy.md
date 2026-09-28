# Agentic Workflow Failure Taxonomy v0

**Status:** Draft seed taxonomy
**Product:** Agentic Ops Observatory
**Purpose:** Define the first failure classes the CLI and GitHub Action should detect or document.

## AO-001: Monitor Self-Burn

The workflow consumes the scarce resource it is meant to monitor during its normal no-op path.

Examples:

- A quota monitor calls a premium model just to check whether premium-model quota is low.
- A cost monitor spends billable API calls when there is no change to report.
- A rate-limit monitor polls through the same constrained rate limit it is meant to preserve.

Detection direction:

- Compare `monitored_resources` against `normal_path.resource_consumption`.
- Flag overlap when the path is recurring, automated, and expected to run without human-triggered work.

Severity factors:

- recurrence frequency;
- cost per run;
- absence of deterministic/platform-native alternative;
- lack of backoff or state caching.

## AO-002: Missing Human Gate For External Action

The workflow can send messages, publish content, spend money, change production state, acquire assets, or contact third parties without an explicit human approval gate.

Detection direction:

- Find external action capabilities.
- Require an approval boundary before execution.
- Treat draft-only preparation separately from external dispatch.

Severity factors:

- public blast radius;
- financial impact;
- irreversibility;
- ability to impersonate a human or organization.

## AO-003: Sensitive Context Exposure

The workflow can place credentials, secrets, private messages, private files, or sensitive business context into prompts, logs, URLs, command arguments, generated artifacts, or public reports.

Detection direction:

- Inspect declared inputs and outputs.
- Flag flows from sensitive input categories to public/logged/generated output categories.
- Require masked secret handling where credentials are needed.

Severity factors:

- credential exposure;
- customer/private user data;
- public artifact path;
- inability to delete or rotate exposed material.

## AO-004: Evidence-Free Automation

The workflow takes action or makes a recommendation without preserving enough evidence for a reviewer to understand the decision.

Detection direction:

- Require source references, command outputs, trace summaries, or generated report paths.
- Flag pure chat-only conclusions for consequential workflows.

Severity factors:

- consequential decision;
- repeated/automated execution;
- missing replay path;
- no durable artifact.

## AO-005: Unbounded Retry Or Loop

The workflow can repeatedly call models, tools, APIs, or external actions without a clear stopping condition.

Detection direction:

- Inspect recurrence, retry, and fallback policies.
- Require max attempts, time budget, cost budget, or state-based stop condition.

Severity factors:

- billable API calls;
- external side effects;
- high-frequency schedule;
- no alert on repeated failure.
