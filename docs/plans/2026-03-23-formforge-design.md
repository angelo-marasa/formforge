# FormForge - Design Document

**Date:** 2026-03-23
**Authors:** Angelo Marasa, Robert Baker
**Status:** Approved

## Overview

FormForge is a standalone drag-and-drop form builder platform built on Next.js. It replaces the need for WordPress-dependent solutions like Gravity Forms by providing a modern, embeddable form system that works on any website.

## Core Concepts

- **Multi-tenant:** Clients get their own workspace with forms and webhook configurations
- **No auth:** Internal use only (Angelo and Robert manage everything)
- **Embeddable:** Lightweight script tag renders forms directly in the client's DOM
- **Webhook-first:** Form submissions fire to one or more webhook endpoints
- **No data storage:** Field data is never stored. Only delivery logs are kept.

## Architecture

### Stack
- Next.js (App Router)
- SQLite (via Drizzle ORM)
- React DnD (drag-and-drop builder)
- Tailwind CSS
- Preact or vanilla JS (embed runtime)

### Three Surfaces

1. **Admin UI** (`/admin`) - Internal form builder and client management. No authentication.
2. **Embed Runtime** (`/embed.js` + `/api/forms/[id]`) - Lightweight script clients drop on their sites. Fetches form definition, renders in their DOM, handles validation and submission.
3. **API Layer** (`/api/*`) - Serves form definitions, receives submissions, dispatches webhooks, logs delivery status.

## Data Model

### clients
| Column | Type | Notes |
|--------|------|-------|
| id | text (ULID) | Primary key |
| name | text | e.g. "GO Mortgage" |
| slug | text | e.g. "go-mortgage" |
| webhook_defaults | text (JSON) | Optional default webhooks for all forms |
| created_at | integer | Unix timestamp |
| updated_at | integer | Unix timestamp |

### forms
| Column | Type | Notes |
|--------|------|-------|
| id | text (ULID) | Primary key |
| client_id | text | FK to clients |
| name | text | Form name |
| slug | text | URL-friendly name |
| status | text | draft / published |
| definition | text (JSON) | Fields, layout, conditions, pages, validation |
| confirmation_redirect_url | text | Where to send user after submit |
| webhooks | text (JSON) | Array of webhook URLs |
| embed_key | text | Unique public identifier for embed |
| style_config | text (JSON) | Colors, fonts (future theming) |
| created_at | integer | Unix timestamp |
| updated_at | integer | Unix timestamp |

### submission_log
| Column | Type | Notes |
|--------|------|-------|
| id | text (ULID) | Primary key |
| form_id | text | FK to forms |
| submitted_at | integer | Unix timestamp |

### webhook_deliveries
| Column | Type | Notes |
|--------|------|-------|
| id | text (ULID) | Primary key |
| submission_log_id | text | FK to submission_log |
| webhook_url | text | The endpoint hit |
| response_status_code | integer | HTTP status |
| success | integer | 0 or 1 |
| retry_count | integer | Number of attempts |
| error_message | text | Nullable |
| delivered_at | integer | Unix timestamp |

## Form Definition Schema

The `definition` column stores the entire form structure as JSON:

```json
{
  "pages": [
    {
      "id": "page_1",
      "title": "Contact Info",
      "rows": [
        {
          "id": "row_1",
          "columns": [
            { "width": 6, "fieldId": "first_name" },
            { "width": 6, "fieldId": "last_name" }
          ]
        },
        {
          "id": "row_2",
          "columns": [
            { "width": 12, "fieldId": "email" }
          ]
        }
      ]
    }
  ],
  "fields": {
    "first_name": {
      "type": "text",
      "label": "First Name",
      "placeholder": "John",
      "required": true,
      "validation": { "minLength": 2 }
    },
    "email": {
      "type": "email",
      "label": "Email",
      "required": true
    }
  },
  "conditions": [
    {
      "id": "cond_1",
      "logic": "AND",
      "rules": [
        { "fieldId": "state", "operator": "equals", "value": "FL" },
        { "fieldId": "loan_type", "operator": "notEquals", "value": "VA" }
      ],
      "actions": [
        { "type": "show", "targetFieldId": "florida_disclosure" },
        { "type": "setValue", "targetFieldId": "region", "value": "southeast" }
      ]
    }
  ]
}
```

Column widths use a 12-grid system. Fields are stored flat in a map, rows reference them by ID. Conditions are separate, referencing fields by ID with AND/OR logic.

### Field Types (v1)
- Text (single line)
- Textarea (multi-line)
- Email
- Phone
- Number
- Select dropdown
- Multi-select
- Radio buttons
- Checkboxes
- File upload
- Date picker
- Hidden field
- HTML block (static content between fields)
- Section divider
- Page break (multi-step)

### Condition Operators
- equals, notEquals
- contains, notContains
- greaterThan, lessThan
- isEmpty, isNotEmpty

### Condition Actions
- show / hide field
- setValue (set a field's value)
- skipToPage (multi-step navigation)

## Embed Runtime

Client adds to their site:

```html
<div id="ff-abc123"></div>
<script src="https://formforge.io/embed.js" data-form="abc123"></script>
```

1. `embed.js` (~5KB loader) reads `data-form`, fetches definition from `/api/forms/abc123`
2. Renders form into target div with namespaced CSS (`.ff-form .ff-field`)
3. Handles validation, conditional logic, and page navigation client-side
4. On submit, POSTs to `/api/submissions` with form ID and field data
5. API dispatches webhooks, returns redirect URL
6. Embed redirects the user

No React in the embed. Preact (3KB) or vanilla JS to keep it fast.

Future: modal/popup trigger option.

## Webhook Delivery

1. API receives submission POST
2. Creates `submission_log` record
3. Looks up webhooks (form-level, falls back to client defaults)
4. Fires all webhooks in parallel
5. Logs each delivery to `webhook_deliveries`
6. Failed webhooks retry up to 3 times with exponential backoff (10s, 60s, 5min)
7. Returns confirmation redirect URL to embed

### Webhook Payload

```json
{
  "form_id": "abc123",
  "form_name": "Contact Form",
  "client": "go-mortgage",
  "submitted_at": "2026-03-23T16:45:00Z",
  "fields": {
    "first_name": "Jimmy",
    "last_name": "Hansell",
    "email": "jimmy@gomortgage.com"
  }
}
```

Retries handled by cron endpoint (`/api/cron/retry-webhooks`) hit every minute.

## Admin UI - Form Builder

Three-panel layout:

**Left sidebar:** Field palette. 15 field types as draggable cards.

**Center canvas:** Form preview. Pages as tabs. Rows with fields. Drag to reorder, drag to split columns. Visual 12-grid indicators.

**Right sidebar:** Field settings. Label, placeholder, required, validation, options, conditional logic rules.

**Top bar:** Form name, save (draft), publish, preview, embed code copy button.

No auto-save. Explicit save and publish.

## Confirmation

Redirect to a specified URL after successful submission. Configured per form via `confirmation_redirect_url`.

## Styling

v1: Basic built-in style set with namespaced CSS.

Future: Theme options, color inputs, font selection stored in `style_config` JSON.

## Phase Plan

### Phase 1 - Foundation
- Next.js app scaffolding, SQLite + Drizzle setup
- Data model (clients, forms, submission_log, webhook_deliveries)
- Admin CRUD: create/edit clients, create/edit forms (no builder yet, just metadata)
- Basic Tailwind layout with three-panel shell

### Phase 2 - Form Builder
- Field palette with all 15 types
- Drag-and-drop onto canvas (React DnD)
- Row/column layout with 12-grid system
- Right sidebar field configuration
- Multi-step page management
- JSON definition saved to database

### Phase 3 - Embed Runtime
- Lightweight embed script (Preact or vanilla JS)
- Fetches form definition, renders fields
- Client-side validation
- Multi-step navigation
- Submission POST to API

### Phase 4 - Conditional Logic Engine
- Rule builder UI in admin (if/and/or dropdowns)
- Client-side evaluation in embed runtime
- Show/hide, set value, skip page actions
- Calculated fields

### Phase 5 - Webhook System
- Parallel webhook dispatch on submission
- Delivery logging
- Retry cron with exponential backoff
- Submission log viewer in admin

### Phase 6 - Polish
- Embed CSS namespacing and base styles
- Form preview mode in admin
- Embed code generator with copy button
- Style config (basic color/font options)

## Future Roadmap
- Grid-based canvas (freeform layout)
- Modal/popup embed option
- Theme system with multiple style presets
- Client-facing dashboard with auth
- Form analytics (views, submissions, abandonment)
- A/B testing (multiple form variants)
