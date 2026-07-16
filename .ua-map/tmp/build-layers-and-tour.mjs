#!/usr/bin/env node
/**
 * build-layers-and-tour.mjs
 *
 * Deterministic layer and tour generation from assembled graph.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = '/Users/NewUser/Downloads/Veterinary Laminitis Trials 3';
const INTERMEDIATE = join(PROJECT_ROOT, '.understand-anything/intermediate');

const graph = JSON.parse(readFileSync(join(INTERMEDIATE, 'assembled-graph.json'), 'utf8'));

const fileNodes = graph.nodes.filter(n =>
  ['file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint'].includes(n.type)
);

function pathMatches(path, patterns) {
  return patterns.some(p => path.startsWith(p) || path.includes(p));
}

function getLayerId(path, type) {
  if (type === 'document') return 'layer:documentation';
  if (type === 'config') return 'layer:configuration';
  if (type === 'service' || type === 'resource') return 'layer:infrastructure';
  if (type === 'endpoint') return 'layer:backend-api';
  if (type === 'pipeline') return 'layer:infrastructure';
  if (type === 'schema') return 'layer:backend-api';
  if (type === 'table') return 'layer:backend-api';

  if (pathMatches(path, ['src/__tests__/', 'e2e/', 'tests/'])) return 'layer:tests';
  if (pathMatches(path, ['src/app/', 'src/pages/'])) return 'layer:frontend-app';
  if (pathMatches(path, ['src/components/'])) return 'layer:components';
  if (pathMatches(path, ['src/hooks/'])) return 'layer:hooks-and-utils';
  if (pathMatches(path, ['src/lib/', 'src/utils/'])) return 'layer:hooks-and-utils';
  if (pathMatches(path, ['src/context/'])) return 'layer:frontend-app';
  if (pathMatches(path, ['src/types/', 'src/models/'])) return 'layer:types-and-models';
  if (pathMatches(path, ['api/', 'server/'])) return 'layer:backend-api';
  if (pathMatches(path, ['supabase/'])) return 'layer:backend-api';
  if (pathMatches(path, ['scripts/'])) return 'layer:scripts-and-tooling';
  if (pathMatches(path, ['public/', 'assets/'])) return 'layer:assets';
  if (pathMatches(path, ['.github/'])) return 'layer:infrastructure';
  if (pathMatches(path, ['docs/'])) return 'layer:documentation';
  if (pathMatches(path, ['deploy.sh', 'vercel.json', 'vite.config', 'postcss.config', 'tailwind.config', 'eslint.config', 'tsconfig.json', 'components.json'])) return 'layer:configuration';
  if (path.startsWith('src/')) return 'layer:frontend-core';

  return 'layer:project-root';
}

const layers = {
  'layer:documentation': {
    id: 'layer:documentation',
    name: 'Documentation',
    description: 'Project documentation, guides, and deployment notes',
    nodeIds: []
  },
  'layer:configuration': {
    id: 'layer:configuration',
    name: 'Configuration',
    description: 'Build, lint, and project configuration files',
    nodeIds: []
  },
  'layer:infrastructure': {
    id: 'layer:infrastructure',
    name: 'Infrastructure & Deployment',
    description: 'CI/CD, deployment scripts, and infrastructure definitions',
    nodeIds: []
  },
  'layer:backend-api': {
    id: 'layer:backend-api',
    name: 'Backend & API',
    description: 'Serverless API routes, Supabase functions, and database logic',
    nodeIds: []
  },
  'layer:frontend-app': {
    id: 'layer:frontend-app',
    name: 'Frontend App & Pages',
    description: 'Application shell, routing, and page components',
    nodeIds: []
  },
  'layer:components': {
    id: 'layer:components',
    name: 'UI Components',
    description: 'Reusable React components and UI primitives',
    nodeIds: []
  },
  'layer:hooks-and-utils': {
    id: 'layer:hooks-and-utils',
    name: 'Hooks, Utilities & Libraries',
    description: 'Custom React hooks, utility functions, and client libraries',
    nodeIds: []
  },
  'layer:types-and-models': {
    id: 'layer:types-and-models',
    name: 'Types & Models',
    description: 'TypeScript type definitions and data models',
    nodeIds: []
  },
  'layer:tests': {
    id: 'layer:tests',
    name: 'Tests',
    description: 'Unit tests, integration tests, and E2E specs',
    nodeIds: []
  },
  'layer:scripts-and-tooling': {
    id: 'layer:scripts-and-tooling',
    name: 'Scripts & Tooling',
    description: 'One-off scripts, seeders, and development tools',
    nodeIds: []
  },
  'layer:assets': {
    id: 'layer:assets',
    name: 'Assets & Public Files',
    description: 'Static assets, images, and public-facing files',
    nodeIds: []
  },
  'layer:frontend-core': {
    id: 'layer:frontend-core',
    name: 'Frontend Core',
    description: 'Core frontend files: entry point, styles, and base setup',
    nodeIds: []
  },
  'layer:project-root': {
    id: 'layer:project-root',
    name: 'Project Root',
    description: 'Top-level project files and miscellaneous artifacts',
    nodeIds: []
  }
};

for (const node of fileNodes) {
  const layerId = getLayerId(node.filePath, node.type);
  if (layers[layerId]) {
    layers[layerId].nodeIds.push(node.id);
  }
}

// Remove empty layers and convert to array
const layersArray = Object.values(layers).filter(l => l.nodeIds.length > 0);

writeFileSync(join(INTERMEDIATE, 'layers.json'), JSON.stringify(layersArray, null, 2), 'utf8');
console.log(`Generated ${layersArray.length} layers`);
for (const l of layersArray) {
  console.log(`  ${l.id}: ${l.nodeIds.length} nodes`);
}

// Build tour
const tour = [
  {
    order: 1,
    title: 'Project Overview',
    description: 'Start with the README to understand the project purpose, stack, and deployment strategy.',
    nodeIds: ['document:README.md', 'document:DEPLOYMENT.md']
  },
  {
    order: 2,
    title: 'Configuration & Tooling',
    description: 'Review project configuration, build setup, and dependencies.',
    nodeIds: ['config:package.json', 'config:tsconfig.json', 'config:vite.config.ts']
  },
  {
    order: 3,
    title: 'Application Entry Point',
    description: 'How the React app boots and mounts in the DOM.',
    nodeIds: ['file:src/main.tsx', 'file:src/app/app.tsx']
  },
  {
    order: 4,
    title: 'Authentication & Session',
    description: 'Auth context and session management with Supabase.',
    nodeIds: ['file:src/context/AuthContext.tsx']
  },
  {
    order: 5,
    title: 'Pages & Routing',
    description: 'Main route components that map to hash-router URLs.',
    nodeIds: fileNodes.filter(n => n.filePath && n.filePath.startsWith('src/pages/')).slice(0, 5).map(n => n.id)
  },
  {
    order: 6,
    title: 'UI Components & Forms',
    description: 'Reusable components and form building blocks.',
    nodeIds: fileNodes.filter(n => n.filePath && n.filePath.startsWith('src/components/')).slice(0, 5).map(n => n.id)
  },
  {
    order: 7,
    title: 'Backend API & Serverless Functions',
    description: 'Vercel serverless API routes and Supabase edge functions.',
    nodeIds: fileNodes.filter(n => n.filePath && (n.filePath.startsWith('api/') || n.filePath.startsWith('supabase/') || n.filePath.startsWith('server/'))).slice(0, 5).map(n => n.id)
  },
  {
    order: 8,
    title: 'Hooks & Client Libraries',
    description: 'Custom React hooks and client-side libraries for data and uploads.',
    nodeIds: fileNodes.filter(n => n.filePath && (n.filePath.startsWith('src/hooks/') || n.filePath.startsWith('src/lib/'))).slice(0, 5).map(n => n.id)
  },
  {
    order: 9,
    title: 'Tests & Quality',
    description: 'Test coverage across unit, component, and E2E levels.',
    nodeIds: fileNodes.filter(n => n.filePath && (n.filePath.startsWith('src/__tests__/') || n.filePath.startsWith('e2e/'))).slice(0, 5).map(n => n.id)
  },
  {
    order: 10,
    title: 'Deployment & Infrastructure',
    description: 'CI/CD workflows and deployment scripts.',
    nodeIds: fileNodes.filter(n => n.filePath && (n.filePath.startsWith('.github/') || n.filePath === 'deploy.sh' || n.filePath.startsWith('scripts/'))).slice(0, 5).map(n => n.id)
  }
];

// Drop dangling refs and sort
const validNodeIds = new Set(graph.nodes.map(n => n.id));
for (const step of tour) {
  step.nodeIds = step.nodeIds.filter(id => validNodeIds.has(id));
}
const validTour = tour.filter(s => s.nodeIds.length > 0);

writeFileSync(join(INTERMEDIATE, 'tour.json'), JSON.stringify(validTour, null, 2), 'utf8');
console.log(`Generated ${validTour.length} tour steps`);
