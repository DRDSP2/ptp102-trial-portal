#!/usr/bin/env node
/**
 * build-graph-from-structure.mjs
 *
 * Converts extract-structure.mjs results + import-map into
 * GraphNode/GraphEdge batch files for merge-batch-graphs.py.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = '/Users/NewUser/Downloads/Veterinary Laminitis Trials 3';
const INTERMEDIATE = join(PROJECT_ROOT, '.understand-anything/intermediate');

function loadJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const scan = loadJSON(join(INTERMEDIATE, 'scan-result.json'));
const importMap = loadJSON(join(INTERMEDIATE, 'import-map.json'));
const batches = loadJSON(join(INTERMEDIATE, 'batches.json'));

const fileInfoMap = new Map();
for (const f of scan.files) {
  fileInfoMap.set(f.path, f);
}

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

function buildBatchGraph(batchIndex, structureResults) {
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

  for (const result of structureResults.results) {
    const path = result.path;
    const info = fileInfoMap.get(path) || { language: result.language, fileCategory: result.fileCategory || 'code' };
    const category = info.fileCategory;
    const nodeType = category === 'config' ? 'config' : category === 'docs' ? 'document' : category === 'infra' ? 'service' : category === 'data' ? 'resource' : 'file';
    const fileId = fileNodeId(path, category);
    const name = path.split('/').pop();

    // File-level node
    const summary = result.sections && result.sections.length > 0
      ? `${name} (${result.language || info.language}) — ${result.totalLines} lines. ${result.sections.length} sections.`
      : `${name} (${result.language || info.language}) — ${result.totalLines} lines.`;
    const tags = [result.language || info.language, category];
    if (result.metrics) {
      if (result.metrics.functionCount > 0) tags.push('has-functions');
      if (result.metrics.classCount > 0) tags.push('has-classes');
      if (result.metrics.exportCount > 0) tags.push('has-exports');
    }
    const complexity = result.totalLines > 300 ? 'complex' : result.totalLines > 100 ? 'moderate' : 'simple';
    addNode(makeNode(fileId, nodeType, name, path, summary, tags, complexity, result.language || info.language));

    // Functions
    if (result.functions) {
      for (const fn of result.functions) {
        const fnId = `function:${path}:${fn.name}`;
        addNode(makeNode(fnId, 'function', fn.name, path,
          `Function ${fn.name} in ${name} (lines ${fn.startLine}-${fn.endLine})`,
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
          `Class ${cls.name} in ${name} (lines ${cls.startLine}-${cls.endLine})`,
          [result.language || info.language, 'class'],
          cls.endLine - cls.startLine > 100 ? 'complex' : cls.endLine - cls.startLine > 40 ? 'moderate' : 'simple',
          result.language || info.language));
        addEdge(makeEdge(fileId, clsId, 'contains', 1.0));

        // Class methods
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

    // Exports
    if (result.exports) {
      for (const exp of result.exports) {
        // Link exports to file
        addEdge(makeEdge(fileId, fileId, 'exports', 0.8));
      }
    }

    // Sections (for docs)
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

    // Services (Dockerfile, CI)
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

    // Definitions (types, interfaces)
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
  }

  // Add import edges from importMap for files in this batch
  for (const result of structureResults.results) {
    const path = result.path;
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
for (let i = 0; i < batches.batches.length; i++) {
  const batch = batches.batches[i];
  const inputPath = join(PROJECT_ROOT, '.understand-anything/tmp', `batch-${i}-input.json`);
  const outputPath = join(INTERMEDIATE, `batch-${i}-structure.json`);

  // Write input
  writeFileSync(inputPath, JSON.stringify({
    projectRoot: PROJECT_ROOT,
    batchFiles: batch.files,
    batchImportData: batch.batchImportData
  }, null, 2));

  // Run extract-structure (we'll do this in a separate shell invocation for speed)
}

console.log('Batch inputs prepared. Next step: run extract-structure on all batches.');
