#!/usr/bin/env node
/**
 * build-knowledge-graph.mjs
 *
 * One-pass structural extraction + graph building for all batches.
 * Uses @understand-anything/core directly (initialized once) for efficiency.
 */

import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve('/Users/NewUser/.understand-anything/repo/understand-anything-plugin');
const require = createRequire(resolve(pluginRoot, 'package.json'));

let core;
try {
  core = await import(pathToFileURL(require.resolve('@understand-anything/core')).href);
} catch {
  core = await import(pathToFileURL(resolve(pluginRoot, 'packages/core/dist/index.js')).href);
}

const { TreeSitterPlugin, PluginRegistry, builtinLanguageConfigs, registerAllParsers } = core;
const { buildResult } = await import(pathToFileURL(resolve('/Users/NewUser/.understand-anything/repo/understand-anything-plugin/skills/understand/extract-structure-result.mjs')).href);

const PROJECT_ROOT = '/Users/NewUser/Downloads/Veterinary Laminitis Trials 3';
const INTERMEDIATE = join(PROJECT_ROOT, '.understand-anything/intermediate');

// Load scan, batches, import map
const scan = JSON.parse(readFileSync(join(INTERMEDIATE, 'scan-result.json'), 'utf8'));
const batches = JSON.parse(readFileSync(join(INTERMEDIATE, 'batches.json'), 'utf8'));
const importMap = JSON.parse(readFileSync(join(INTERMEDIATE, 'import-map.json'), 'utf8'));

const fileInfoMap = new Map();
for (const f of scan.files) fileInfoMap.set(f.path, f);

// Initialize parser registry once
const tsConfigs = builtinLanguageConfigs.filter(c => c.treeSitter);
const tsPlugin = new TreeSitterPlugin(tsConfigs);
await tsPlugin.init();
const registry = new PluginRegistry();
registry.register(tsPlugin);
registerAllParsers(registry);

function fileNodeId(path, category) {
  if (category === 'config') return `config:${path}`;
  if (category === 'docs') return `document:${path}`;
  if (category === 'infra') return `service:${path}`;
  if (category === 'script') return `file:${path}`;
  if (category === 'data') return `resource:${path}`;
  if (category === 'markup') return `file:${path}`;
  return `file:${path}`;
}

function makeNode(id, type, name, filePath, summary, tags, complexity = 'moderate', language = '') {
  return { id, type, name, filePath, summary, tags: tags || [], complexity, language };
}

function makeEdge(source, target, type, weight = 0.5) {
  return { source, target, type, weight };
}

function buildBatchGraph(batchIndex, batchFiles, batchImportData) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  function addNode(node) {
    if (!nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  }

  function addEdge(edge) {
    edges.push(edge);
  }

  for (const file of batchFiles) {
    const absolutePath = join(PROJECT_ROOT, file.path);
    let content;
    try {
      content = readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    const totalLines = content.endsWith('\n') ? Math.max(0, lines.length - 1) : lines.length;
    const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;

    let analysis = null;
    try {
      analysis = registry.analyzeFile(file.path, content);
    } catch {}

    let callGraph = null;
    if (file.fileCategory === 'code' || file.fileCategory === 'script') {
      try {
        const cg = registry.extractCallGraph(file.path, content);
        if (cg && cg.length > 0) {
          callGraph = cg.map(entry => ({ caller: entry.caller, callee: entry.callee, lineNumber: entry.lineNumber }));
        }
      } catch {}
    }

    const result = buildResult(file, totalLines, nonEmptyLines, analysis, callGraph, batchImportData);
    const path = file.path;
    const info = fileInfoMap.get(path) || file;
    const category = info.fileCategory;
    const nodeType = category === 'config' ? 'config' : category === 'docs' ? 'document' : category === 'infra' ? 'service' : category === 'data' ? 'resource' : 'file';
    const fileId = fileNodeId(path, category);
    const name = path.split('/').pop();

    // File node
    let summary = `${name} (${result.language || info.language}) — ${result.totalLines} lines.`;
    const tags = [result.language || info.language, category];
    if (result.metrics) {
      if (result.metrics.functionCount > 0) tags.push('has-functions');
      if (result.metrics.classCount > 0) tags.push('has-classes');
      if (result.metrics.exportCount > 0) tags.push('has-exports');
    }
    if (result.sections && result.sections.length > 0) {
      summary += ` ${result.sections.length} sections.`;
    }
    const complexity = result.totalLines > 300 ? 'complex' : result.totalLines > 100 ? 'moderate' : 'simple';
    addNode(makeNode(fileId, nodeType, name, path, summary, tags, complexity, result.language || info.language));

    // Functions
    if (result.functions) {
      for (const fn of result.functions) {
        const fnId = `function:${path}:${fn.name}`;
        addNode(makeNode(fnId, 'function', fn.name, path,
          `Function ${fn.name} in ${name}`,
          [result.language || info.language, 'function'],
          fn.endLine - fn.startLine > 50 ? 'complex' : fn.endLine - fn.startLine > 20 ? 'moderate' : 'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, fnId, 'contains', 1.0));
      }
    }

    // Classes
    if (result.classes) {
      for (const cls of result.classes) {
        const clsId = `class:${path}:${cls.name}`;
        addNode(makeNode(clsId, 'class', cls.name, path,
          `Class ${cls.name} in ${name}`,
          [result.language || info.language, 'class'],
          cls.endLine - cls.startLine > 100 ? 'complex' : cls.endLine - cls.startLine > 40 ? 'moderate' : 'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, clsId, 'contains', 1.0));
        if (cls.methods) {
          for (const method of cls.methods) {
            const mId = `function:${path}:${cls.name}.${method}`;
            addNode(makeNode(mId, 'function', `${cls.name}.${method}`, path,
              `Method ${method} of class ${cls.name}`,
              [result.language || info.language, 'method'],
              'simple',
              result.language || info.language));
            addEdge(makeEdge(clsId, mId, 'contains', 1.0));
          }
        }
      }
    }

    // Sections
    if (result.sections) {
      for (const sec of result.sections) {
        const secId = `concept:${path}:${sec.heading}`;
        addNode(makeNode(secId, 'concept', sec.heading, path,
          `Section: ${sec.heading}`,
          [result.language || info.language, 'section'],
          'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, secId, 'contains', 1.0));
      }
    }

    // Services
    if (result.services) {
      for (const svc of result.services) {
        const svcId = `service:${path}:${svc.name}`;
        addNode(makeNode(svcId, 'service', svc.name, path,
          `Service ${svc.name}${svc.image ? ` (image: ${svc.image})` : ''}`,
          ['service', 'infrastructure'],
          'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, svcId, 'contains', 1.0));
      }
    }

    // Endpoints
    if (result.endpoints) {
      for (const ep of result.endpoints) {
        const epId = `endpoint:${path}:${ep.method} ${ep.path}`;
        addNode(makeNode(epId, 'endpoint', `${ep.method} ${ep.path}`, path,
          `API endpoint ${ep.method} ${ep.path}`,
          ['api', 'endpoint'],
          'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, epId, 'contains', 1.0));
      }
    }

    // Definitions
    if (result.definitions) {
      for (const def of result.definitions) {
        const defId = `concept:${path}:${def.name}`;
        addNode(makeNode(defId, 'concept', def.name, path,
          `${def.kind || 'Definition'} ${def.name}`,
          [result.language || info.language, 'definition'],
          'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, defId, 'contains', 1.0));
      }
    }

    // Call graph edges
    if (callGraph) {
      for (const cg of callGraph) {
        const callerId = cg.caller.includes(':') ? cg.caller : `function:${path}:${cg.caller}`;
        const calleeId = cg.callee.includes(':') ? cg.callee : `function:${path}:${cg.callee}`;
        if (nodeIds.has(callerId) && nodeIds.has(calleeId)) {
          addEdge(makeEdge(callerId, calleeId, 'calls', 0.8));
        }
      }
    }
  }

  // Import edges for files in this batch
  for (const file of batchFiles) {
    const path = file.path;
    const fileId = fileNodeId(path, fileInfoMap.get(path)?.fileCategory || 'code');
    const imports = importMap.importMap[path] || [];
    for (const imp of imports) {
      const targetInfo = fileInfoMap.get(imp);
      const targetId = fileNodeId(imp, targetInfo?.fileCategory || 'code');
      if (nodeIds.has(targetId)) {
        addEdge(makeEdge(fileId, targetId, 'imports', 0.7));
      }
    }
  }

  return { nodes, edges };
}

// Process all batches
let totalNodes = 0;
let totalEdges = 0;

for (let i = 0; i < batches.batches.length; i++) {
  const batch = batches.batches[i];
  const graph = buildBatchGraph(i, batch.files, batch.batchImportData);
  totalNodes += graph.nodes.length;
  totalEdges += graph.edges.length;
  writeFileSync(join(INTERMEDIATE, `batch-${i}.json`), JSON.stringify(graph, null, 2), 'utf8');
  console.log(`Batch ${i}: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
}

console.log(`Total: ${totalNodes} nodes, ${totalEdges} edges across ${batches.batches.length} batches`);
