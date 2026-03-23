## Project Owner
kaleidico

## FormForge

A standalone drag-and-drop form builder platform. Like Gravity Forms, but on Next.js. No WordPress dependency.

### Stack
- Next.js (App Router)
- SQLite via Drizzle ORM
- React DnD (builder)
- Preact or vanilla JS (embed runtime)
- Tailwind CSS

### Key Decisions
- No auth. Internal use only (Angelo and Robert).
- No form data stored. Webhook-first, with delivery logs only.
- Embed via inline script tag (no iframe). Enables client-side analytics tracking.
- Linear stack layout with column rows (12-grid). Grid canvas is on the future roadmap.
- Confirmation is redirect-only (no inline messages).
- Retries via cron endpoint, not background jobs.

### Design Doc
`docs/plans/2026-03-23-formforge-design.md`
