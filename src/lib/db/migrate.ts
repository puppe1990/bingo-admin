import type { Client } from '@libsql/client/web';

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    )`,
  `CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      expires_at INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER
    )`,
  `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      bingo_type TEXT NOT NULL DEFAULT '75',
      total_cards INTEGER NOT NULL,
      footer_text TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      drawn_numbers TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER
    )`,
  `CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      card_number TEXT NOT NULL,
      numbers TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      buyer_name TEXT,
      buyer_phone TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER
    )`,
  `CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_event_number ON cards(event_id, card_number)`,
  `CREATE INDEX IF NOT EXISTS idx_cards_user_status ON cards(user_id, status, updated_at)`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`,
];

export async function migrateClient(libsql: Client): Promise<void> {
  for (const sql of MIGRATION_STATEMENTS) {
    await libsql.execute(sql);
  }

  const userColumns = await libsql.execute('PRAGMA table_info(user)');
  const hasRole = userColumns.rows.some((row) => row.name === 'role');
  if (!hasRole) {
    await libsql.execute(`ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  }

  const hasIsActive = userColumns.rows.some((row) => row.name === 'is_active');
  if (!hasIsActive) {
    await libsql.execute(`ALTER TABLE user ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0`);
  }
  const hasAccessExpiresAt = userColumns.rows.some((row) => row.name === 'access_expires_at');
  if (!hasAccessExpiresAt) {
    await libsql.execute(`ALTER TABLE user ADD COLUMN access_expires_at INTEGER`);
  }

  // Backfill: usuários com assinatura ativa viram ativos com a data da assinatura
  await libsql.execute(`
    UPDATE user
    SET is_active = 1,
        access_expires_at = (
          SELECT MAX(s.expires_at)
          FROM subscriptions s
          WHERE s.user_id = user.id
            AND s.status = 'active'
        )
    WHERE role != 'admin'
      AND EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = user.id AND s.status = 'active'
      )
  `);
}
