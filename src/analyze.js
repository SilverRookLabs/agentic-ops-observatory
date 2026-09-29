import fs from "node:fs";
import path from "node:path";

const RESOURCE_ALIASES = new Map([
  ["openai:gpt-5.5", "openai:gpt-5.5"],
  ["gpt-5.5", "openai:gpt-5.5"],
  ["codex-quota", "codex-quota"],
  ["codex quota", "codex-quota"],
  ["xai:grok", "xai:grok"],
  ["grok", "xai:grok"],
]);

const SENSITIVE_CATEGORIES = new Set([
  "credential",
  "credentials",
  "secret",
  "secrets",
  "private-message",
  "private-file",
  "customer-data",
  "personal-data",
  "internal-context",
]);

const EXPOSED_SINKS = new Set([
  "prompt",
  "log",
  "logs",
  "url",
  "command-argument",
  "command-arguments",
  "generated-artifact",
  "public-report",
  "public-artifact",
  "third-party-api",
]);

const EXTERNAL_ACTIONS = new Set([
  "send-message",
  "publish-content",
  "spend-money",
  "change-production-state",
  "contact-third-party",
  "acquire-asset",
  "create-public-issue",
  "deploy",
  "release",
]);

export function normalizeResource(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return RESOURCE_ALIASES.get(key) ?? key;
}

function normalizeToken(value) {
  return String(value ?? "").trim().toLowerCase();
}

function hasEvidence(evidence) {
  if (!evidence) {
    return false;
  }

  return [
    evidence.sourceReferences,
    evidence.commandOutputs,
    evidence.traceSummaries,
    evidence.reportPaths,
    evidence.artifacts,
  ].some((items) => Array.isArray(items) && items.length > 0);
}

function hasLoopBound(fixture) {
  const retryPolicy = fixture.retryPolicy ?? {};
  const loopPolicy = fixture.loopPolicy ?? {};
  return [
    retryPolicy.maxAttempts,
    retryPolicy.timeBudgetMinutes,
    retryPolicy.costBudgetUsd,
    retryPolicy.stopCondition,
    loopPolicy.maxIterations,
    loopPolicy.timeBudgetMinutes,
    loopPolicy.costBudgetUsd,
    loopPolicy.stopCondition,
  ].some((value) => value !== undefined && value !== null && value !== "");
}

export function analyzeFixture(fixture, sourcePath = "<memory>") {
  const findings = [];
  const monitored = new Set((fixture.monitoredResources ?? []).map(normalizeResource));
  const consumed = new Set((fixture.normalPath?.resourceConsumption ?? []).map(normalizeResource));
  const overlap = [...monitored].filter((resource) => consumed.has(resource));

  if (overlap.length > 0 && fixture.schedule?.recurring !== false) {
    findings.push({
      id: "AO-001",
      severity: fixture.normalPath?.humanTriggered === true ? "medium" : "high",
      title: "Monitor self-burn",
      message: "The normal path consumes a resource the workflow is meant to monitor.",
      sourcePath,
      resources: overlap,
    });
  }

  const externalActions = (fixture.externalActions ?? []).filter((action) => {
    const type = normalizeToken(action.type ?? action.name);
    const draftOnly = action.draftOnly === true || normalizeToken(action.mode) === "draft-only";
    const approved = action.requiresHumanApproval === true || action.humanApprovalGate === true;
    return !draftOnly && (EXTERNAL_ACTIONS.has(type) || action.external === true) && !approved;
  });

  if (externalActions.length > 0) {
    findings.push({
      id: "AO-002",
      severity: externalActions.some((action) => action.irreversible === true || action.financialImpact === true) ? "high" : "medium",
      title: "Missing human gate for external action",
      message: "The workflow can perform an external action without an explicit human approval gate.",
      sourcePath,
      actions: externalActions.map((action) => action.name ?? action.type ?? "external action"),
    });
  }

  const sensitiveFlows = (fixture.dataFlows ?? []).filter((flow) => {
    const from = normalizeToken(flow.fromCategory ?? flow.from);
    const to = normalizeToken(flow.toCategory ?? flow.to);
    const masked = flow.masked === true || flow.redacted === true;
    return !masked && SENSITIVE_CATEGORIES.has(from) && EXPOSED_SINKS.has(to);
  });

  if (sensitiveFlows.length > 0) {
    findings.push({
      id: "AO-003",
      severity: sensitiveFlows.some((flow) => ["credential", "credentials", "secret", "secrets"].includes(normalizeToken(flow.fromCategory ?? flow.from))) ? "high" : "medium",
      title: "Sensitive context exposure",
      message: "Sensitive input can flow into prompts, logs, URLs, generated artifacts, or another exposed sink.",
      sourcePath,
      flows: sensitiveFlows.map((flow) => `${flow.fromCategory ?? flow.from} -> ${flow.toCategory ?? flow.to}`),
    });
  }

  if ((fixture.consequential === true || fixture.recommendation?.consequential === true) && !hasEvidence(fixture.evidence)) {
    findings.push({
      id: "AO-004",
      severity: fixture.automated === true || fixture.schedule?.recurring === true ? "high" : "medium",
      title: "Evidence-free automation",
      message: "The workflow makes a consequential recommendation or action without durable evidence a reviewer can inspect.",
      sourcePath,
    });
  }

  const hasDeclaredLoopPolicy = fixture.retryPolicy !== undefined || fixture.loopPolicy !== undefined;
  const hasExplicitUnboundedLoop = fixture.retryPolicy?.unbounded === true || fixture.loopPolicy?.unbounded === true;
  if ((hasExplicitUnboundedLoop || hasDeclaredLoopPolicy) && !hasLoopBound(fixture)) {
    findings.push({
      id: "AO-005",
      severity: fixture.externalActions?.some((action) => action.external === true) || consumed.size > 0 ? "high" : "medium",
      title: "Unbounded retry or loop",
      message: "The workflow can repeatedly call tools, APIs, models, or external actions without a declared stopping condition.",
      sourcePath,
    });
  }

  return {
    fixtureId: fixture.id ?? path.basename(sourcePath),
    name: fixture.name ?? fixture.id ?? path.basename(sourcePath),
    findings,
  };
}

export function renderMarkdown(results) {
  const findings = results.flatMap((result) => result.findings.map((finding) => ({ ...finding, fixtureName: result.name })));
  const highCount = findings.filter((finding) => finding.severity === "high").length;
  const mediumCount = findings.filter((finding) => finding.severity === "medium").length;
  const lowCount = findings.filter((finding) => finding.severity === "low").length;
  const lines = [
    "# Agentic Ops Observatory Report",
    "",
    `Fixtures inspected: ${results.length}`,
    `Findings: ${findings.length}`,
    `High severity: ${highCount}`,
    `Medium severity: ${mediumCount}`,
    `Low severity: ${lowCount}`,
    "",
  ];

  if (findings.length === 0) {
    lines.push("No findings detected by the current rule set.", "");
    return lines.join("\n");
  }

  lines.push("## Findings", "");
  for (const finding of findings) {
    lines.push(`### ${finding.id}: ${finding.title}`);
    lines.push("");
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- Fixture: ${finding.fixtureName}`);
    lines.push(`- Source: \`${finding.sourcePath}\``);
    if (finding.resources?.length > 0) {
      lines.push(`- Resources: ${finding.resources.map((resource) => `\`${resource}\``).join(", ")}`);
    }
    if (finding.actions?.length > 0) {
      lines.push(`- Actions: ${finding.actions.map((action) => `\`${action}\``).join(", ")}`);
    }
    if (finding.flows?.length > 0) {
      lines.push(`- Flows: ${finding.flows.map((flow) => `\`${flow}\``).join(", ")}`);
    }
    lines.push(`- Detail: ${finding.message}`);
    lines.push(`- Suggested next step: ${finding.nextStep ?? nextStepForFinding(finding.id)}`);
    lines.push("");
  }

  return lines.join("\n");
}

function nextStepForFinding(id) {
  switch (id) {
    case "AO-001":
      return "Move the monitor to a cheaper path, cache the check, or require human-triggered execution.";
    case "AO-002":
      return "Convert the action to draft-only output or add a human approval gate before execution.";
    case "AO-003":
      return "Mask or summarize sensitive data before it reaches prompts, logs, URLs, or public artifacts.";
    case "AO-004":
      return "Attach durable evidence references before allowing consequential recommendations.";
    case "AO-005":
      return "Add max attempts, time budget, cost budget, or an explicit stop condition.";
    default:
      return "Review the fixture and add a narrower operating boundary.";
  }
}

export function readFixture(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function analyzeFiles(filePaths) {
  return filePaths.map((filePath) => analyzeFixture(readFixture(filePath), filePath));
}
