# Contributing to Agentic Ops Observatory

Agentic Ops Observatory is a fixture-first project. The best contribution is a small, public-safe workflow example that shows a real operational failure mode clearly enough for maintainers to discuss, test, and improve.

## Useful Contributions

- New failure-class fixtures that use synthetic or permission-safe data.
- Fixed versions of existing bad fixtures.
- Analyzer checks with focused tests.
- Report wording improvements that make findings easier for maintainers to act on.
- Documentation that helps teams run the checker locally or in GitHub Actions.
- Public-safe examples from real incidents, rewritten so no secrets, private logs, customer data, internal IDs, or proprietary workflow details remain.

## Fixture Rules

Fixtures must be reviewable JSON. Prefer one fixture per failure class.

Each fixture should make these fields obvious:

- workflow name and purpose;
- trigger;
- resources that can be consumed;
- authority boundary for external actions;
- evidence emitted when the workflow succeeds or fails;
- expected finding or reason the fixture is safe.

Do not include:

- credentials, tokens, private keys, passwords, or account IDs;
- raw customer data, private messages, private repository names, or production incident logs;
- non-public operational metadata from another organization;
- copied proprietary prompts or closed-source workflow definitions.

## Detector Rules

New checks should be boring and explainable.

Good detector behavior:

- identifies a concrete operational risk;
- explains why the maintainer should care;
- points to a fixture and remediation path;
- keeps false positives reviewable;
- includes tests for both bad and safe workflows.

Avoid broad claims such as "AI safety certified" or "secure by default." This project catches specific workflow design failures.

## Review Standard

A contribution is ready when:

- `npm test` passes;
- the example report still regenerates from fixtures;
- `npm run hygiene` has no hard-fail findings;
- the public file inventory remains accurate;
- the change improves maintainer understanding without introducing private or strategy-only material.
