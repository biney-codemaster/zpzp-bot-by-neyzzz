const fs = require('fs');
const path = require('path');
const BetterSqlite3 = require('better-sqlite3');
const config = require('../../config');

class Database {
  constructor(dbPath) {
    const resolved = path.resolve(dbPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    this.db = new BetterSqlite3(resolved);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.#migrate();
  }

  #migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        prefix TEXT NOT NULL DEFAULT '+',
        admin_role TEXT,
        mod_role TEXT,
        modlog_channel TEXT,
        welcome_channel TEXT,
        welcome_message TEXT DEFAULT 'Welcome {user} to **{server}**! You are member #{count}.',
        leave_channel TEXT,
        leave_message TEXT DEFAULT '{user} left **{server}**.',
        autorole TEXT,
        ticket_category TEXT,
        ticket_log TEXT,
        ticket_support_role TEXT,
        automod_antilink INTEGER NOT NULL DEFAULT 0,
        automod_antispam INTEGER NOT NULL DEFAULT 0,
        automod_badwords INTEGER NOT NULL DEFAULT 0,
        badwords TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tickets (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        closed INTEGER NOT NULL DEFAULT 0,
        closed_by TEXT,
        close_reason TEXT,
        closed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS giveaways (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        host_id TEXT NOT NULL,
        prize TEXT NOT NULL,
        winners INTEGER NOT NULL DEFAULT 1,
        ends_at INTEGER NOT NULL,
        ended INTEGER NOT NULL DEFAULT 0,
        entries TEXT NOT NULL DEFAULT '[]'
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
        sent INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS mod_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT,
        extra TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS polls (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        votes TEXT NOT NULL DEFAULT '{}',
        ended INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fun_stats (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rps_wins INTEGER NOT NULL DEFAULT 0,
        rps_losses INTEGER NOT NULL DEFAULT 0,
        rps_ties INTEGER NOT NULL DEFAULT 0,
        trivia_correct INTEGER NOT NULL DEFAULT 0,
        trivia_wrong INTEGER NOT NULL DEFAULT 0,
        ttt_wins INTEGER NOT NULL DEFAULT 0,
        ttt_losses INTEGER NOT NULL DEFAULT 0,
        hangman_wins INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      );
    `);

    this.#ensureColumn('tickets', 'closed_by', 'TEXT');
    this.#ensureColumn('tickets', 'close_reason', 'TEXT');
    this.#ensureColumn('tickets', 'closed_at', 'INTEGER');
  }

  #ensureColumn(table, column, type) {
    const cols = this.db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!cols.includes(column)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
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
    return this.ensureGuild(guildId).prefix || config.prefix;
  }

  addWarning(guildId, userId, moderatorId, reason) {
    return this.db
      .prepare(
        'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(guildId, userId, moderatorId, reason, Date.now()).lastInsertRowid;
  }

  getWarnings(guildId, userId) {
    return this.db
      .prepare(
        'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC'
      )
      .all(guildId, userId);
  }

  clearWarnings(guildId, userId) {
    return this.db
      .prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?')
      .run(guildId, userId).changes;
  }

  removeWarning(guildId, warnId) {
    return this.db
      .prepare('DELETE FROM warnings WHERE guild_id = ? AND id = ?')
      .run(guildId, warnId).changes;
  }

  addModCase(guildId, { userId, moderatorId, action, reason, extra }) {
    return this.db
      .prepare(
        `INSERT INTO mod_cases (guild_id, user_id, moderator_id, action, reason, extra, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        guildId,
        userId || null,
        moderatorId,
        action,
        reason || null,
        extra || null,
        Date.now()
      ).lastInsertRowid;
  }

  getModCases(guildId, userId, limit = 10) {
    return this.db
      .prepare(
        `SELECT * FROM mod_cases WHERE guild_id = ? AND user_id = ?
         ORDER BY created_at DESC LIMIT ?`
      )
      .all(guildId, userId, limit);
  }

  createTicket(channelId, guildId, userId) {
    this.db
      .prepare(
        'INSERT INTO tickets (channel_id, guild_id, user_id, created_at, closed) VALUES (?, ?, ?, ?, 0)'
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

  closeTicket(channelId, { closedBy = null, reason = null } = {}) {
    this.db
      .prepare(
        `UPDATE tickets
         SET closed = 1, closed_by = ?, close_reason = ?, closed_at = ?
         WHERE channel_id = ?`
      )
      .run(closedBy, reason, Date.now(), channelId);
  }

  getLastClosedTicket(guildId, userId) {
    return this.db
      .prepare(
        `SELECT * FROM tickets
         WHERE guild_id = ? AND user_id = ? AND closed = 1
         ORDER BY closed_at DESC LIMIT 1`
      )
      .get(guildId, userId);
  }

  createGiveaway(data) {
    this.db
      .prepare(
        `INSERT INTO giveaways
         (message_id, channel_id, guild_id, host_id, prize, winners, ends_at, ended, entries)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
      )
      .run(
        data.messageId,
        data.channelId,
        data.guildId,
        data.hostId,
        data.prize,
        data.winners,
        data.endsAt,
        JSON.stringify(data.entries || [])
      );
  }

  getGiveaway(messageId) {
    const row = this.db
      .prepare('SELECT * FROM giveaways WHERE message_id = ?')
      .get(messageId);
    if (!row) return null;
    return { ...row, entries: JSON.parse(row.entries || '[]') };
  }

  updateGiveaway(messageId, data) {
    const payload = { ...data };
    if (payload.entries) payload.entries = JSON.stringify(payload.entries);
    const keys = Object.keys(payload);
    const sets = keys.map((k) => `${k} = ?`).join(', ');
    this.db
      .prepare(`UPDATE giveaways SET ${sets} WHERE message_id = ?`)
      .run(...keys.map((k) => payload[k]), messageId);
  }

  getActiveGiveaways() {
    return this.db
      .prepare('SELECT * FROM giveaways WHERE ended = 0')
      .all()
      .map((r) => ({ ...r, entries: JSON.parse(r.entries || '[]') }));
  }

  setAfk(guildId, userId, reason) {
    this.db
      .prepare(
        `INSERT INTO afk (guild_id, user_id, reason, since) VALUES (?, ?, ?, ?)
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
    return this.db
      .prepare(
        'INSERT INTO reminders (guild_id, channel_id, user_id, content, ends_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(guildId, channelId, userId, content, endsAt).lastInsertRowid;
  }

  getDueReminders() {
    return this.db
      .prepare('SELECT * FROM reminders WHERE sent = 0 AND ends_at <= ?')
      .all(Date.now());
  }

  getUserReminders(guildId, userId) {
    return this.db
      .prepare(
        `SELECT * FROM reminders
         WHERE guild_id = ? AND user_id = ? AND sent = 0
         ORDER BY ends_at ASC`
      )
      .all(guildId, userId);
  }

  getReminder(id) {
    return this.db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  }

  cancelReminder(id, userId) {
    return this.db
      .prepare(
        'DELETE FROM reminders WHERE id = ? AND user_id = ? AND sent = 0'
      )
      .run(id, userId).changes;
  }

  markReminderSent(id) {
    this.db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(id);
  }

  createPoll(data) {
    this.db
      .prepare(
        `INSERT INTO polls
         (message_id, channel_id, guild_id, author_id, question, options, votes, ended, created_at)
         VALUES (?, ?, ?, ?, ?, ?, '{}', 0, ?)`
      )
      .run(
        data.messageId,
        data.channelId,
        data.guildId,
        data.authorId,
        data.question,
        JSON.stringify(data.options),
        Date.now()
      );
  }

  getPoll(messageId) {
    const row = this.db
      .prepare('SELECT * FROM polls WHERE message_id = ?')
      .get(messageId);
    if (!row) return null;
    return {
      ...row,
      options: JSON.parse(row.options || '[]'),
      votes: JSON.parse(row.votes || '{}'),
    };
  }

  updatePoll(messageId, data) {
    const payload = { ...data };
    if (payload.options) payload.options = JSON.stringify(payload.options);
    if (payload.votes) payload.votes = JSON.stringify(payload.votes);
    const keys = Object.keys(payload);
    if (!keys.length) return;
    const sets = keys.map((k) => `${k} = ?`).join(', ');
    this.db
      .prepare(`UPDATE polls SET ${sets} WHERE message_id = ?`)
      .run(...keys.map((k) => payload[k]), messageId);
  }

  ensureFunStats(guildId, userId) {
    this.db
      .prepare('INSERT OR IGNORE INTO fun_stats (guild_id, user_id) VALUES (?, ?)')
      .run(guildId, userId);
  }

  addFunStat(guildId, userId, field, amount = 1) {
    const allowed = [
      'rps_wins',
      'rps_losses',
      'rps_ties',
      'trivia_correct',
      'trivia_wrong',
      'ttt_wins',
      'ttt_losses',
      'hangman_wins',
    ];
    if (!allowed.includes(field)) return;
    this.ensureFunStats(guildId, userId);
    this.db
      .prepare(
        `UPDATE fun_stats SET ${field} = ${field} + ? WHERE guild_id = ? AND user_id = ?`
      )
      .run(amount, guildId, userId);
  }

  getFunStats(guildId, userId) {
    this.ensureFunStats(guildId, userId);
    return this.db
      .prepare('SELECT * FROM fun_stats WHERE guild_id = ? AND user_id = ?')
      .get(guildId, userId);
  }

  getFunLeaderboard(guildId, limit = 10) {
    return this.db
      .prepare(
        `SELECT *,
         (rps_wins * 2 + trivia_correct * 3 + ttt_wins * 5 + hangman_wins * 4) AS score
         FROM fun_stats
         WHERE guild_id = ?
         ORDER BY score DESC, rps_wins DESC, trivia_correct DESC
         LIMIT ?`
      )
      .all(guildId, limit);
  }
}

module.exports = Database;
