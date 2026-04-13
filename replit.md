# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── todo-app/           # React + Vite To-Do List app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Artifacts

### `artifacts/todo-app` — Minimal To-Do App

React + Vite app at `/` (port 25230 in dev).

**Features:**
- Add, edit, delete tasks
- Drag-and-drop reordering (dnd-kit)
- Priority levels: low / medium / high / urgent (color-coded left border)
- Smart categories/tags with emoji icons
- Progress tracker (circular progress showing % done)
- Dark mode / light mode toggle (persisted in localStorage)
- Daily Focus Mode — shows only today's tasks
- Satisfying task completion animation (framer-motion + confetti)
- Motivational message when all tasks complete

**Data storage:** All tasks and categories are saved in browser `localStorage` on the device where the app is opened. No server or database is required. Data is device-local and persists across page refreshes.

**Key files:**
- `src/pages/Home.tsx` — main page
- `src/components/tasks/TaskCard.tsx` — draggable task card
- `src/components/tasks/TaskInput.tsx` — bottom add bar
- `src/components/tasks/EditTaskDialog.tsx` — edit modal
- `src/components/categories/CategoryList.tsx` — category filter tabs
- `src/components/layout/Header.tsx` — header with progress + theme toggle
- `src/hooks/use-tasks-api.ts` — hooks wrapping the local store (same interface as before)
- `src/context/StoreContext.tsx` — React context providing reactive localStorage state
- `src/lib/local-store.ts` — localStorage CRUD operations (tasks, categories)
- `src/hooks/use-theme.ts` — dark/light mode hook
- `src/index.css` — design tokens (HSL color palette)

### `artifacts/api-server` — Express API Server

Serves at `/api` (port 8080 in dev).

**Routes:**
- `GET /api/tasks` — list tasks (with `focusMode` and `categoryId` query params)
- `POST /api/tasks` — create task
- `GET /api/tasks/:id` — get task
- `PUT /api/tasks/:id` — update task
- `DELETE /api/tasks/:id` — delete task
- `POST /api/tasks/reorder` — drag-and-drop reorder
- `GET /api/categories` — list categories
- `POST /api/categories` — create category
- `PUT /api/categories/:id` — update category
- `DELETE /api/categories/:id` — delete category

## Database Schema

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | text | |
| color | text | hex color |
| icon | text | nullable, emoji |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| title | text | |
| description | text | nullable |
| completed | boolean | default false |
| priority | enum | low/medium/high/urgent |
| categoryId | integer FK | → categories.id |
| dueDate | text | YYYY-MM-DD |
| sortOrder | integer | for drag-and-drop |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| completedAt | timestamp | nullable |

## TypeScript & Composite Projects

- **Always typecheck from the root** — `pnpm run typecheck`
- **Codegen**: `pnpm --filter @workspace/api-spec run codegen`
- **DB push**: `pnpm --filter @workspace/db run push`
