const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function color() {
  return Number.parseInt(config.embedColor.replace('#', ''), 16);
}

function base(title, description) {
  const embed = new EmbedBuilder().setColor(color()).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

function success(description, title = 'Succès') {
  return base(title, description).setColor(0x57f287);
}

function error(description, title = 'Erreur') {
  return base(title, description).setColor(0xed4245);
}

function info(description, title = 'Information') {
  return base(title, description);
}

function warn(description, title = 'Attention') {
  return base(title, description).setColor(0xfee75c);
}

module.exports = { base, success, error, info, warn, color };
