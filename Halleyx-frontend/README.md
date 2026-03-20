# Halleyx Frontend

A modern React + Vite frontend for workflow management with validation, graph output, and a polished UI.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Run](#run)
  - [Build](#build)
- [Project Structure](#project-structure)
- [Key Screens](#key-screens)
- [Execution Flow](#execution-flow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## About

`Halleyx-frontend` is a frontend client for managing and executing workflows. It integrates with a backend API and supports:

- workflow create/edit/delete operations
- step management (ordering, metadata JSON, active flags)
- rule negotiation (conditions, transitions)
- execution simulation with pre-checks and dynamic path resolution
- graph visualization of execution path + in-app step-by-step navigation
- safe confirm/cancel UI patterns (no raw browser alerts)

## Features

- workflow listing (pagination + filtering)
- prevents execution when no rules or no steps exist
- validates execution payload against rules and step schema
- displays user-friendly modals for deletion and errors
- supports back-and-forth graph view after execution
- step metadata is JSON-friendly and includes default placeholders

## Tech Stack

- React 18
- Vite 5
- React Router v6
- Axios
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- backend API available, configured in `src/config/api.js`

### Install

```bash
cd c:\Users\kk627\Desktop\Halleyx-frontend
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  api/
    axios.js
    executionApi.js
    ruleApi.js
    stepApi.js
    workflowApi.js
  components/
    Layout.jsx
  pages/
    WorkflowList.jsx
    WorkflowEditor.jsx
    WorkflowStepsPage.jsx
    WorkflowRulesPage.jsx
    RuleManager.jsx
    StepManager.jsx
  services/
    workflowService.js
  styles/
    index.css
  utils/
    workflowEngine.js
    ruleEngine.js
  App.jsx
  main.jsx
```

## Key Screens

- `/workflows` - manage workflows, execute, and visualize results
- `/workflows/new` - create workflow definition
- `/workflows/:id` - edit workflow structure
- `/workflows/:id/steps` - manage step order, status, and metadata
- `/workflows/:id/rules` - configure rule conditions and transitions

## Execution Flow

1. Choose a workflow and fill execution amount/inputs.
2. System checks there are steps and rules; shows error if missing.
3. Runs rule matching (`amount`) to derive path using `ruleEngine`.
4. If pass, app retrieves step list and marks step statuses.
5. User can open graph view to inspect each step, then return to execution.

## Troubleshooting

- If `vite` is not recognized:
  - run `npm install`
  - run `npm run dev` from project root
  - or `npx vite`
- If API calls fail, check `src/config/api.js` for backend URL.

## Contributing

1. Create an issue with a short feature request or bug report.
2. `git checkout -b feat/<name>`
3. Make code updates
4. `git commit -m "feat: ..."`
5. `git push` and open a pull request.

## License

MIT
