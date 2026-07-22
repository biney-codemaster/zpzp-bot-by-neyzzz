const config = require('../../config');
const {
  DEFAULT_PANEL_TITLE,
  DEFAULT_PANEL_DESCRIPTION,
} = require('./tickets');

const DEFAULT_WELCOME_MESSAGE =
  'Welcome {user} to **{server}**! You are member #{count}.';
const DEFAULT_LEAVE_MESSAGE = '{user} left **{server}**.';

const DEFAULT_AUTOMOD = {
  automod_antilink: 0,
  automod_antispam: 0,
  automod_badwords: 0,
  badwords: '[]',
  automod_ignore_channels: '[]',
  automod_ignore_roles: '[]',
  automod_log: 0,
  automod_antilink_action: 'delete',
  automod_antispam_action: 'timeout',
  automod_badwords_action: 'delete',
  automod_timeout_seconds: 30,
};

const DEFAULT_WELCOME = {
  welcome_channel: null,
  welcome_message: DEFAULT_WELCOME_MESSAGE,
};

const DEFAULT_LEAVE = {
  leave_channel: null,
  leave_message: DEFAULT_LEAVE_MESSAGE,
};

function fullConfigReset() {
  return {
    prefix: config.prefix,
    admin_role: null,
    mod_role: null,
    modlog_channel: null,
    ...DEFAULT_WELCOME,
    ...DEFAULT_LEAVE,
    autorole: null,
    ticket_category: null,
    ticket_log: null,
    ticket_support_role: null,
    ticket_panel_title: DEFAULT_PANEL_TITLE,
    ticket_panel_description: DEFAULT_PANEL_DESCRIPTION,
    ...DEFAULT_AUTOMOD,
    giveaway_required_role: null,
    giveaway_min_account_days: null,
    giveaway_boosters_only: null,
    giveaway_bonus_role: null,
    giveaway_bonus_entries: null,
    giveaway_ping_on_end: null,
  };
}

function parseJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function actionLabel(action) {
  const map = {
    delete: 'Delete',
    warn: 'Warn',
    timeout: 'Timeout',
  };
  return map[action] || 'Delete';
}

module.exports = {
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_LEAVE_MESSAGE,
  DEFAULT_AUTOMOD,
  DEFAULT_WELCOME,
  DEFAULT_LEAVE,
  fullConfigReset,
  parseJsonArray,
  actionLabel,
};
