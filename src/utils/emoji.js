/**
 * Custom Discord emojis for the bot.
 * Set a value to '<:name:id>' or '<a:name:id>', or leave null if unused.
 * Do not use unicode emojis anywhere in the bot.
 */
const emojis = {
  success: null,
  error: null,
  warn: null,
  info: null,
  loading: null,

  // Help categories
  moderation: null,
  utility: null,
  fun: null,
  tickets: null,
  giveaways: null,
  config: null,
  admin: null,

  // Components / UI
  home: null,
  close: null,
  enter: null,
  yes: null,
  no: null,

  // Tickets
  ticketOpen: null,
  ticketClose: null,
  ticketAdd: null,
  ticketRemove: null,
  ticketTranscript: null,
  ticketConfirm: null,
  ticketCancel: null,
};

/**
 * @param {keyof typeof emojis} key
 * @returns {string|null}
 */
function get(key) {
  const value = emojis[key];
  return value || null;
}

/**
 * Prefix text with a custom emoji + space, or return text alone if null.
 * @param {keyof typeof emojis} key
 * @param {string} [text]
 */
function withEmoji(key, text = '') {
  const value = get(key);
  if (!value) return text;
  return text ? `${value} ${text}` : value;
}

/**
 * Discord.js component emoji object, or undefined when unset.
 * @param {keyof typeof emojis} key
 * @returns {{ id: string, name: string, animated?: boolean }|undefined}
 */
function componentEmoji(key) {
  const value = get(key);
  if (!value) return undefined;
  const match = String(value).match(/^<(a?):([\w~]+):(\d+)>$/);
  if (!match) return undefined;
  return {
    id: match[3],
    name: match[2],
    animated: match[1] === 'a',
  };
}

/**
 * Apply component emoji to a builder if configured.
 * @template T
 * @param {T} builder
 * @param {keyof typeof emojis} key
 * @returns {T}
 */
function applyComponentEmoji(builder, key) {
  const emoji = componentEmoji(key);
  if (emoji && typeof builder.setEmoji === 'function') {
    builder.setEmoji(emoji);
  }
  return builder;
}

module.exports = {
  ...emojis,
  emojis,
  get,
  withEmoji,
  componentEmoji,
  applyComponentEmoji,
};
