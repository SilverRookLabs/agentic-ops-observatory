#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { RULES, analyzeFiles, renderMarkdown, summarizeResults } from "./analyze.js";

const DEFAULT_MARKDOWN_OUTPUT = "agentic-ops-observatory-report.md";
const DEFAULT_JSON_OUTPUT = "agentic-ops-observatory-report.json";

function usage() {
  return [
    "Agentic Ops Observatory",
    "",
    "Usage:",
    "  agentic-ops-observatory [options] [fixture-or-directory-or-glob ...]",
    "",
    "Options:",
    "  --output <path>          Write the Markdown report to this path.",
    "  --json-output <path>     Write a machine-readable JSON report to this path.",
    "  --list-rules             Print the detector rule catalog as JSON.",
    "  --fail-on-high <bool>    Exit 1 when high-severity findings exist. Default: true.",
    "  --help                   Show this help text.",
    "",
    "Examples:",
    "  agentic-ops-observatory fixtures",
    "  agentic-ops-observatory \"agentic-ops/**/*.json\" --output report.md --json-output report.json",
    "  INPUT_FAIL_ON_HIGH=false agentic-ops-observatory fixtures",
  ].join("\n");
}

function hasGlobMagic(value) {
  return /[*?[\]]/.test(value);
}

function globSegmentToRegex(segment) {
  const escaped = segment.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`);
}

function walkJsonFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const stat = fs.statSync(root);
  if (stat.isFile()) {
    return root.endsWith(".json") ? [root] : [];
  }

  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files;
}

function expandGlob(pattern) {
  const absolutePattern = path.resolve(pattern);
  const parsed = path.parse(absolutePattern);
  const parts = path.relative(parsed.root, absolutePattern).split(path.sep).filter(Boolean);
  const matches = [];

  function visit(currentPath, index) {
    if (index >= parts.length) {
      if (fs.existsSync(currentPath)) {
        const stat = fs.statSync(currentPath);
        if (stat.isDirectory()) {
          matches.push(...walkJsonFiles(currentPath));
        } else if (stat.isFile() && currentPath.endsWith(".json")) {
          matches.push(currentPath);
        }
      }
      return;
    }

    const segment = parts[index];
    if (segment === "**") {
      visit(currentPath, index + 1);
      if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) {
        return;
      }
      for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          visit(path.join(currentPath, entry.name), index);
        }
      }
      return;
    }

    if (!hasGlobMagic(segment)) {
      visit(path.join(currentPath, segment), index + 1);
      return;
    }

    if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) {
      return;
    }
    const regex = globSegmentToRegex(segment);
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      if (regex.test(entry.name)) {
        visit(path.join(currentPath, entry.name), index + 1);
      }
    }
  }

  visit(parsed.root, 0);
  return path.isAbsolute(pattern) ? matches : matches.map((match) => path.relative(process.cwd(), match));
}

function expandInput(value) {
  return hasGlobMagic(value) ? expandGlob(value) : walkJsonFiles(value);
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return !["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
}

function parseArgs(argv = process.argv.slice(2)) {
  const paths = [];
  let outputPath = process.env.INPUT_OUTPUT ?? process.env.AGENTIC_OPS_OUTPUT ?? DEFAULT_MARKDOWN_OUTPUT;
  let jsonOutputPath = process.env.INPUT_JSON_OUTPUT ?? process.env.AGENTIC_OPS_JSON_OUTPUT ?? "";
  let failOnHigh = parseBoolean(process.env.INPUT_FAIL_ON_HIGH, true);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--list-rules") {
      return { listRules: true };
    }
    if (arg === "--output" || arg === "-o") {
      outputPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      outputPath = arg.slice("--output=".length);
      continue;
    }
    if (arg === "--json-output") {
      jsonOutputPath = argv[index + 1] || DEFAULT_JSON_OUTPUT;
      index += 1;
      continue;
    }
    if (arg.startsWith("--json-output=")) {
      jsonOutputPath = arg.slice("--json-output=".length) || DEFAULT_JSON_OUTPUT;
      continue;
    }
    if (arg === "--fail-on-high") {
      failOnHigh = parseBoolean(argv[index + 1], true);
      index += 1;
      continue;
    }
    if (arg.startsWith("--fail-on-high=")) {
      failOnHigh = parseBoolean(arg.slice("--fail-on-high=".length), true);
      continue;
    }
    paths.push(arg);
  }

  if (!outputPath) {
    throw new Error("--output requires a non-empty path");
  }

  const envInput = process.env.INPUT_FIXTURES?.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) ?? [];
  const requested = paths.length > 0 ? paths : envInput;
  return {
    help: false,
    listRules: false,
    inputs: requested.length > 0 ? requested : ["fixtures"],
    outputPath,
    jsonOutputPath,
    failOnHigh,
  };
}

function appendOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function appendSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

const args = parseArgs();
if (args.help) {
  process.stdout.write(`${usage()}\n`);
  process.exit(0);
}
if (args.listRules) {
  process.stdout.write(`${JSON.stringify({ rules: RULES }, null, 2)}\n`);
  process.exit(0);
}

const inputs = args.inputs;
const files = [...new Set(inputs.flatMap(expandInput))].sort();
if (files.length === 0) {
  process.stderr.write(`No JSON fixture files found for input: ${inputs.join(", ")}\n`);
  process.exitCode = 1;
  process.exit();
}
const results = analyzeFiles(files);
const summary = summarizeResults(results);
const markdown = renderMarkdown(results);
const reportPath = path.resolve(args.outputPath);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, markdown);

let jsonReportPath = "";
if (args.jsonOutputPath) {
  jsonReportPath = path.resolve(args.jsonOutputPath);
  fs.mkdirSync(path.dirname(jsonReportPath), { recursive: true });
  fs.writeFileSync(jsonReportPath, `${JSON.stringify({ summary, results, rules: RULES }, null, 2)}\n`);
}

appendOutput("finding-count", summary.findingCount);
appendOutput("high-count", summary.severityCounts.high);
appendOutput("medium-count", summary.severityCounts.medium);
appendOutput("low-count", summary.severityCounts.low);
appendOutput("report-path", reportPath);
appendOutput("json-report-path", jsonReportPath);
appendSummary(markdown);
process.stdout.write(`${markdown}\n`);

if (args.failOnHigh && summary.severityCounts.high > 0) {
  process.exitCode = 1;
}
