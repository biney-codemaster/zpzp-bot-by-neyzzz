const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../../config');

class BotDatabase {
  constructor() {
    const dir = path.dirname(path.resolve(config.dbPath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(config.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '+',
        modlog_channel TEXT,
        welcome_channel TEXT,
        welcome_message TEXT DEFAULT 'Bienvenue {user} sur **{server}** ! Tu es le membre n°{count}.',
        leave_channel TEXT,
        leave_message TEXT DEFAULT '{user} a quitté **{server}**.',
        autorole TEXT,
        suggestion_channel TEXT,
        ticket_category TEXT,
        ticket_log TEXT,
        ticket_support_role TEXT,
        level_channel TEXT,
        levels_enabled INTEGER DEFAULT 1,
        automod_antilink INTEGER DEFAULT 0,
        automod_antispam INTEGER DEFAULT 0,
        automod_badwords INTEGER DEFAULT 0,
        badwords TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS economy (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        wallet INTEGER DEFAULT 200,
        bank INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0,
        last_work INTEGER DEFAULT 0,
        last_crime INTEGER DEFAULT 0,
        last_rob INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS inventory (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        amount INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id, item_id)
      );

      CREATE TABLE IF NOT EXISTS levels (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        last_xp INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        closed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS suggestions (
        message_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS giveaways (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        host_id TEXT NOT NULL,
        prize TEXT NOT NULL,
        winners INTEGER DEFAULT 1,
        ends_at INTEGER NOT NULL,
        ended INTEGER DEFAULT 0,
        entries TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS afk (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        since INTEGER NOT NULL,
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        ends_at INTEGER NOT NULL,
        sent INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS mutes (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        ends_at INTEGER,
        reason TEXT,
        PRIMARY KEY (guild_id, user_id)
      );
    `);
  }

  ensureGuild(guildId) {
    this.db
      .prepare('INSERT OR IGNORE INTO guilds (id, prefix) VALUES (?, ?)')
      .run(guildId, config.prefix);
    return this.getGuild(guildId);
  }

  getGuild(guildId) {
    return this.db.prepare('SELECT * FROM guilds WHERE id = ?').get(guildId);
  }

  updateGuild(guildId, data) {
    this.ensureGuild(guildId);
    const keys = Object.keys(data);
    if (!keys.length) return this.getGuild(guildId);
    const sets = keys.map((k) => `${k} = ?`).join(', ');
    this.db
      .prepare(`UPDATE guilds SET ${sets} WHERE id = ?`)
      .run(...keys.map((k) => data[k]), guildId);
    return this.getGuild(guildId);
  }

  getPrefix(guildId) {
    if (!guildId) return config.prefix;
    const guild = this.ensureGuild(guildId);
    return guild.prefix || config.prefix;
  }

  addWarning(guildId, userId, moderatorId, reason) {
    const info = this.db
      .prepare(
        'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(guildId, userId, moderatorId, reason, Date.now());
    return info.lastInsertRowid;
  }

  getWarnings(guildId, userId) {
    return this.db
      .prepare(
        'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC'
      )
      .all(guildId, userId);
  }

  clearWarnings(guildId, userId) {
    const info = this.db
      .prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?')
      .run(guildId, userId);
    return info.changes;
  }

  removeWarning(guildId, warnId) {
    const info = this.db
      .prepare('DELETE FROM warnings WHERE guild_id = ? AND id = ?')
      .run(guildId, warnId);
    return info.changes;
  }

  ensureEconomy(guildId, userId) {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO economy (guild_id, user_id, wallet) VALUES (?, ?, ?)'
      )
      .run(guildId, userId, config.economy.startBalance);
    return this.db
      .prepare('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?')
      .get(guildId, userId);
  }

  updateEconomy(guildId, userId, data) {
    this.ensureEconomy(guildId, userId);
    const keys = Object.keys(data);
    const sets = keys.map((k) => `${k} = ?`).join(', ');
    this.db
      .prepare(`UPDATE economy SET ${sets} WHERE guild_id = ? AND user_id = ?`)
      .run(...keys.map((k) => data[k]), guildId, userId);
    return this.ensureEconomy(guildId, userId);
  }

  getInventory(guildId, userId) {
    return this.db
      .prepare(
        'SELECT * FROM inventory WHERE guild_id = ? AND user_id = ? AND amount > 0'
      )
      .all(guildId, userId);
  }

  addItem(guildId, userId, itemId, amount = 1) {
    this.db
      .prepare(
        `INSERT INTO inventory (guild_id, user_id, item_id, amount)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(guild_id, user_id, item_id)
         DO UPDATE SET amount = amount + excluded.amount`
      )
      .run(guildId, userId, itemId, amount);
  }

  ensureLevel(guildId, userId) {
    this.db
      .prepare('INSERT OR IGNORE INTO levels (guild_id, user_id) VALUES (?, ?)')
      .run(guildId, userId);
    return this.db
      .prepare('SELECT * FROM levels WHERE guild_id = ? AND user_id = ?')
      .get(guildId, userId);
  }

  updateLevel(guildId, userId, data) {
    this.ensureLevel(guildId, userId);
    const keys = Object.keys(data);
    const sets = keys.map((k) => `${k} = ?`).join(', ');
    this.db
      .prepare(`UPDATE levels SET ${sets} WHERE guild_id = ? AND user_id = ?`)
      .run(...keys.map((k) => data[k]), guildId, userId);
    return this.ensureLevel(guildId, userId);
  }

  getTopEconomy(guildId, limit = 10) {
    return this.db
      .prepare(
        `SELECT user_id, wallet, bank, (wallet + bank) AS total
         FROM economy WHERE guild_id = ?
         ORDER BY total DESC LIMIT ?`
      )
      .all(guildId, limit);
  }

  getTopLevels(guildId, limit = 10) {
    return this.db
      .prepare(
        `SELECT user_id, xp, level FROM levels
         WHERE guild_id = ?
         ORDER BY level DESC, xp DESC LIMIT ?`
      )
      .all(guildId, limit);
  }

  createTicket(channelId, guildId, userId) {
    this.db
      .prepare(
        'INSERT INTO tickets (channel_id, guild_id, user_id, created_at) VALUES (?, ?, ?, ?)'
      )
      .run(channelId, guildId, userId, Date.now());
  }

  getTicket(channelId) {
    return this.db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
  }

  getOpenTicketByUser(guildId, userId) {
    return this.db
      .prepare(
        'SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND closed = 0'
      )
      .get(guildId, userId);
  }

  closeTicket(channelId) {
    this.db.prepare('UPDATE tickets SET closed = 1 WHERE channel_id = ?').run(channelId);
  }

  addSuggestion(messageId, guildId, userId, content) {
    this.db
      .prepare(
        'INSERT INTO suggestions (message_id, guild_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(messageId, guildId, userId, content, Date.now());
  }

  getSuggestion(messageId) {
    return this.db
      .prepare('SELECT * FROM suggestions WHERE message_id = ?')
      .get(messageId);
  }

  updateSuggestion(messageId, status) {
    this.db
      .prepare('UPDATE suggestions SET status = ? WHERE message_id = ?')
      .run(status, messageId);
  }

  createGiveaway(data) {
    this.db
      .prepare(
        `INSERT INTO giveaways
         (message_id, channel_id, guild_id, host_id, prize, winners, ends_at, ended, entries)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
      )
      .run(
        data.message_id,
        data.channel_id,
        data.guild_id,
        data.host_id,
        data.prize,
        data.winners,
        data.ends_at,
        JSON.stringify(data.entries || [])
      );
  }

  getGiveaway(messageId) {
    const row = this.db
      .prepare('SELECT * FROM giveaways WHERE message_id = ?')
      .get(messageId);
    if (row) row.entries = JSON.parse(row.entries || '[]');
    return row;
  }

  updateGiveaway(messageId, data) {
    const keys = Object.keys(data);
    const payload = { ...data };
    if (payload.entries) payload.entries = JSON.stringify(payload.entries);
    const sets = keys.map((k) => `${k} = ?`).join(', ');
    this.db
      .prepare(`UPDATE giveaways SET ${sets} WHERE message_id = ?`)
      .run(...keys.map((k) => payload[k]), messageId);
  }

  getActiveGiveaways() {
    const rows = this.db
      .prepare('SELECT * FROM giveaways WHERE ended = 0')
      .all();
    return rows.map((r) => ({ ...r, entries: JSON.parse(r.entries || '[]') }));
  }

  setAfk(guildId, userId, reason) {
    this.db
      .prepare(
        `INSERT INTO afk (guild_id, user_id, reason, since)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(guild_id, user_id)
         DO UPDATE SET reason = excluded.reason, since = excluded.since`
      )
      .run(guildId, userId, reason, Date.now());
  }

  getAfk(guildId, userId) {
    return this.db
      .prepare('SELECT * FROM afk WHERE guild_id = ? AND user_id = ?')
      .get(guildId, userId);
  }

  removeAfk(guildId, userId) {
    this.db
      .prepare('DELETE FROM afk WHERE guild_id = ? AND user_id = ?')
      .run(guildId, userId);
  }

  addReminder(guildId, channelId, userId, content, endsAt) {
    const info = this.db
      .prepare(
        'INSERT INTO reminders (guild_id, channel_id, user_id, content, ends_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(guildId, channelId, userId, content, endsAt);
    return info.lastInsertRowid;
  }

  getDueReminders() {
    return this.db
      .prepare('SELECT * FROM reminders WHERE sent = 0 AND ends_at <= ?')
      .all(Date.now());
  }

  markReminderSent(id) {
    this.db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(id);
  }
}

module.exports = BotDatabase;
