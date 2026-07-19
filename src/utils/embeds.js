const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { withEmoji } = require('./emoji');

function color() {
  return Number.parseInt(config.embedColor, 16) || 0xffffff;
}

function base(title, description) {
  const embed = new EmbedBuilder().setColor(color()).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function success(description, title = 'Success') {
  return base(withEmoji('success', title), description);
}

function error(description, title = 'Error') {
  return base(withEmoji('error', title), description);
}

function info(description, title = null) {
  return base(title ? withEmoji('info', title) : null, description);
}

module.exports = { color, base, success, error, info };
