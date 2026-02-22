import { pgTable, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    picture: text('picture'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const sessions = pgTable('sessions', {
    token: text('token').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const apiKeys = pgTable('api_keys', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    keyPrefix: text('key_prefix').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});
export const games = pgTable('games', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    mode: text('mode').notNull(),
    aiColor: text('ai_color'),
    fen: text('fen').notNull(),
    pgn: text('pgn').notNull(),
    turn: text('turn').notNull(),
    status: text('status').notNull(),
    resultReason: text('result_reason'),
    resultWinner: text('result_winner'),
    history: jsonb('history').notNull().$type(),
    initialMs: integer('initial_ms'),
    incrementMs: integer('increment_ms'),
    remainingW: integer('remaining_w'),
    remainingB: integer('remaining_b'),
    running: text('running'),
    lastTickAt: integer('last_tick_at'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
//# sourceMappingURL=schema.js.map