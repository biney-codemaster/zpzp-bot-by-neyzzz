function parseUserId(message, arg) {
  if (!arg && message.mentions.users.size) {
    return message.mentions.users.first().id;
  }
  if (!arg) return null;
  const mention = message.mentions.users.first();
  if (mention) return mention.id;
  const cleaned = arg.replace(/[<@!>]/g, '');
  if (/^\d{15,20}$/.test(cleaned)) return cleaned;
  return null;
}

module.exports = { parseUserId };
