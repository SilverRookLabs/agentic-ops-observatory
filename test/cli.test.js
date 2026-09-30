import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cliPath = path.resolve("src/index.js");

function makeFixture(root, relativePath, fixture) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(fixture, null, 2)}\n`);
  return fullPath;
}

test("CLI expands glob fixture inputs", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-ops-"));
  const reportPath = path.join(root, "report.md");
  makeFixture(root, "agentic-ops/workflows/quota.json", {
    id: "quota-watch",
    schedule: { recurring: true },
    monitoredResources: ["codex-quota"],
    normalPath: {
      resourceConsumption: ["codex quota"],
    },
  });

  const output = execFileSync(process.execPath, [
    cliPath,
    path.join(root, "agentic-ops/**/*.json"),
    "--output",
    reportPath,
    "--fail-on-high=false",
  ], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });

  assert.match(output, /Fixtures inspected: 1/);
  assert.match(output, /AO-001/);
  assert.match(fs.readFileSync(reportPath, "utf8"), /Suggested next step/);
});

test("CLI help describes output and failure options", () => {
  const output = execFileSync(process.execPath, [cliPath, "--help"], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });

  assert.match(output, /--output <path>/);
  assert.match(output, /--json-output <path>/);
  assert.match(output, /--list-rules/);
  assert.match(output, /--fail-on-high <bool>/);
});

test("CLI writes a machine-readable JSON report", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-ops-json-"));
  const markdownPath = path.join(root, "report.md");
  const jsonPath = path.join(root, "report.json");
  makeFixture(root, "agentic-ops/quota.json", {
    id: "quota-watch",
    schedule: { recurring: true },
    monitoredResources: ["codex-quota"],
    normalPath: {
      resourceConsumption: ["codex quota"],
    },
  });

  execFileSync(process.execPath, [
    cliPath,
    path.join(root, "agentic-ops"),
    "--output",
    markdownPath,
    "--json-output",
    jsonPath,
    "--fail-on-high=false",
  ], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });

  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  assert.equal(report.summary.fixtureCount, 1);
  assert.equal(report.summary.findingCount, 1);
  assert.equal(report.summary.severityCounts.high, 1);
  assert.equal(report.rules.length, 5);
});

test("CLI prints detector rules as JSON", () => {
  const output = execFileSync(process.execPath, [cliPath, "--list-rules"], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });

  const parsed = JSON.parse(output);
  assert.deepEqual(parsed.rules.map((rule) => rule.id), ["AO-001", "AO-002", "AO-003", "AO-004", "AO-005"]);
});

test("CLI fails when no fixture files match", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-ops-empty-"));
  const result = spawnSync(process.execPath, [cliPath, path.join(root, "agentic-ops/**/*.json")], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /No JSON fixture files found/);
});
