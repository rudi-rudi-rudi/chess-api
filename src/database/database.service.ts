import { Injectable, OnModuleInit } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  readonly client;
  readonly db;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    this.client = postgres(url, { prepare: false });
    this.db = drizzle(this.client);
  }

  async onModuleInit() {
    await this.client`
      create table if not exists users (
        id text primary key,
        email text not null unique,
        name text not null,
        picture text,
        created_at timestamptz not null default now()
      );`;
    await this.client`
      create table if not exists sessions (
        token text primary key,
        user_id text not null references users(id) on delete cascade,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );`;
    await this.client`
      create table if not exists api_keys (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        name text not null,
        key_hash text not null unique,
        key_prefix text not null,
        active boolean not null default true,
        created_at timestamptz not null default now(),
        last_used_at timestamptz
      );`;
    await this.client`
      create table if not exists plans (
        user_id text primary key references users(id) on delete cascade,
        tier text not null default 'free',
        status text not null default 'active',
        stripe_customer_id text,
        stripe_subscription_id text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );`;
    await this.client`
      create table if not exists api_usage_monthly (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        month_key text not null,
        request_count integer not null default 0,
        updated_at timestamptz not null default now()
      );`;
    await this.client`
      create table if not exists games (
        id text primary key,
        user_id text not null references users(id) on delete cascade,
        mode text not null,
        ai_color text,
        fen text not null,
        pgn text not null,
        turn text not null,
        status text not null,
        result_reason text,
        result_winner text,
        history jsonb not null,
        initial_ms integer,
        increment_ms integer,
        remaining_w integer,
        remaining_b integer,
        running text,
        last_tick_at integer,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );`;
  }
}
