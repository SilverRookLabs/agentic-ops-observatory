#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { analyzeFiles, renderMarkdown } from "./analyze.js";

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

function parseInputs() {
  const cliPaths = process.argv.slice(2);
  const envInput = process.env.INPUT_FIXTURES?.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) ?? [];
  const requested = cliPaths.length > 0 ? cliPaths : envInput;
  return requested.length > 0 ? requested : ["fixtures"];
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

const inputs = parseInputs();
const files = [...new Set(inputs.flatMap(expandInput))].sort();
if (files.length === 0) {
  process.stderr.write(`No JSON fixture files found for input: ${inputs.join(", ")}\n`);
  process.exitCode = 1;
  process.exit();
}
const results = analyzeFiles(files);
const markdown = renderMarkdown(results);
const reportPath = path.resolve("agentic-ops-observatory-report.md");
fs.writeFileSync(reportPath, markdown);

const findings = results.flatMap((result) => result.findings);
const highCount = findings.filter((finding) => finding.severity === "high").length;
appendOutput("finding-count", findings.length);
appendOutput("high-count", highCount);
appendOutput("report-path", reportPath);
appendSummary(markdown);
process.stdout.write(`${markdown}\n`);

const failOnHigh = String(process.env.INPUT_FAIL_ON_HIGH ?? "true").toLowerCase() !== "false";
if (failOnHigh && highCount > 0) {
  process.exitCode = 1;
}
