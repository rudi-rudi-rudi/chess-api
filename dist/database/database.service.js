var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
let DatabaseService = class DatabaseService {
    client;
    db;
    constructor() {
        const url = process.env.DATABASE_URL;
        if (!url)
            throw new Error('DATABASE_URL is required');
        this.client = postgres(url, { prepare: false });
        this.db = drizzle(this.client);
    }
    async onModuleInit() {
        await this.client `
      create table if not exists users (
        id text primary key,
        email text not null unique,
        name text not null,
        picture text,
        created_at timestamptz not null default now()
      );`;
        await this.client `
      create table if not exists sessions (
        token text primary key,
        user_id text not null references users(id) on delete cascade,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );`;
        await this.client `
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
        await this.client `
      create table if not exists plans (
        user_id text primary key references users(id) on delete cascade,
        tier text not null default 'free',
        status text not null default 'active',
        stripe_customer_id text,
        stripe_subscription_id text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );`;
        await this.client `
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
};
DatabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], DatabaseService);
export { DatabaseService };
//# sourceMappingURL=database.service.js.map