const { EmbedBuilder } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'userinfo', description: 'Show user info', category: 'utility', aliases: ['ui', 'whois', 'user'], usage: '[member]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    if (!member) return message.reply({ embeds: [error('Member not found.')] });
    const roles = member.roles.cache.filter((r) => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() }).setThumbnail(member.user.displayAvatarURL({ size: 256 })).addFields(
      { name: 'ID', value: member.id, inline: true },
      { name: 'Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
      { name: 'Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Joined', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
      { name: `Roles [${roles.size}]`, value: roles.size ? roles.map((r) => r.toString()).slice(0, 25).join(', ') : 'None' }
    ).setTimestamp()] });
  },
};
