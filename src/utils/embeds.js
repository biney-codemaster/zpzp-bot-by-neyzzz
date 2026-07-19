const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function color() {
  return Number.parseInt(config.embedColor, 16) || 0xffffff;
}

function base(title, description) {
  const embed = new EmbedBuilder().setColor(color()).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function success(description, title = 'Succès') {
  return base(title, description);
}

function error(description, title = 'Erreur') {
  return base(title, description);
}

function info(description, title = null) {
  return base(title, description);
}

module.exports = { color, base, success, error, info };
