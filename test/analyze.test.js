import test from "node:test";
import assert from "node:assert/strict";
import { RULES, analyzeFixture, renderMarkdown, summarizeResults } from "../src/analyze.js";

test("flags recurring monitor self-burn", () => {
  const result = analyzeFixture({
    id: "quota-watch",
    schedule: { recurring: true },
    monitoredResources: ["openai:gpt-5.5"],
    normalPath: {
      resourceConsumption: ["gpt-5.5"],
    },
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].id, "AO-001");
  assert.equal(result.findings[0].severity, "high");
});

test("does not flag unrelated normal-path consumption", () => {
  const result = analyzeFixture({
    id: "safe-watch",
    schedule: { recurring: true },
    monitoredResources: ["openai:gpt-5.5"],
    normalPath: {
      resourceConsumption: ["github:rest-api"],
    },
  });

  assert.equal(result.findings.length, 0);
});

test("renders markdown summary", () => {
  const markdown = renderMarkdown([
    analyzeFixture({
      id: "quota-watch",
      schedule: { recurring: true },
      monitoredResources: ["codex-quota"],
      normalPath: {
        resourceConsumption: ["codex quota"],
      },
    }, "fixture.json"),
  ]);

  assert.match(markdown, /Agentic Ops Observatory Report/);
  assert.match(markdown, /AO-001/);
  assert.match(markdown, /codex-quota/);
  assert.match(markdown, /Suggested next step/);
  assert.match(markdown, /Medium severity: 0/);
});

test("summarizes findings for machine-readable reports", () => {
  const summary = summarizeResults([
    analyzeFixture({
      id: "quota-watch",
      schedule: { recurring: true },
      monitoredResources: ["codex-quota"],
      normalPath: {
        resourceConsumption: ["codex quota"],
      },
    }, "fixture.json"),
  ]);

  assert.equal(summary.fixtureCount, 1);
  assert.equal(summary.findingCount, 1);
  assert.equal(summary.severityCounts.high, 1);
  assert.equal(summary.findings[0].fixtureId, "quota-watch");
  assert.equal(summary.findings[0].nextStep.includes("cheaper path"), true);
});

test("exposes a stable rule catalog", () => {
  assert.deepEqual(RULES.map((rule) => rule.id), ["AO-001", "AO-002", "AO-003", "AO-004", "AO-005"]);
  assert.equal(RULES.every((rule) => rule.nextStep), true);
});

test("flags external actions without approval gates", () => {
  const result = analyzeFixture({
    id: "release-bot",
    externalActions: [
      {
        name: "Publish release",
        type: "release",
        external: true,
        irreversible: true,
        requiresHumanApproval: false,
      },
    ],
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].id, "AO-002");
  assert.equal(result.findings[0].severity, "high");
});

test("flags sensitive context exposure", () => {
  const result = analyzeFixture({
    id: "support-bot",
    dataFlows: [
      {
        fromCategory: "secret",
        toCategory: "logs",
        masked: false,
      },
    ],
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].id, "AO-003");
  assert.equal(result.findings[0].severity, "high");
});

test("flags consequential recommendations without evidence", () => {
  const result = analyzeFixture({
    id: "evidence-free-recommender",
    automated: true,
    consequential: true,
    evidence: {
      sourceReferences: [],
      reportPaths: [],
    },
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].id, "AO-004");
  assert.equal(result.findings[0].severity, "high");
});

test("flags unbounded recurring loops", () => {
  const result = analyzeFixture({
    id: "retry-bot",
    schedule: { recurring: true },
    normalPath: {
      resourceConsumption: ["gpt-5.5"],
    },
    retryPolicy: {
      unbounded: true,
    },
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].id, "AO-005");
  assert.equal(result.findings[0].severity, "high");
});

test("does not flag draft-only approved external actions with evidence and bounds", () => {
  const result = analyzeFixture({
    id: "safe-draft",
    externalActions: [
      {
        type: "create-public-issue",
        external: true,
        draftOnly: true,
        requiresHumanApproval: true,
      },
    ],
    dataFlows: [
      {
        fromCategory: "public-repo-data",
        toCategory: "generated-artifact",
      },
    ],
    retryPolicy: {
      maxAttempts: 2,
    },
    consequential: true,
    evidence: {
      sourceReferences: ["https://github.com/example/repo/issues/1"],
    },
  });

  assert.equal(result.findings.length, 0);
});
