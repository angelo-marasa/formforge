import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  webhookDefaults: text('webhook_defaults'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const forms = sqliteTable('forms', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  definition: text('definition'),
  confirmationRedirectUrl: text('confirmation_redirect_url'),
  webhooks: text('webhooks'),
  embedKey: text('embed_key').notNull().unique(),
  styleConfig: text('style_config'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const submissionLog = sqliteTable('submission_log', {
  id: text('id').primaryKey(),
  formId: text('form_id').notNull().references(() => forms.id),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),
})

export const webhookDeliveries = sqliteTable('webhook_deliveries', {
  id: text('id').primaryKey(),
  submissionLogId: text('submission_log_id').notNull().references(() => submissionLog.id),
  webhookUrl: text('webhook_url').notNull(),
  responseStatusCode: integer('response_status_code'),
  success: integer('success', { mode: 'boolean' }).notNull().default(false),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
  deliveredAt: integer('delivered_at', { mode: 'timestamp_ms' }),
})
