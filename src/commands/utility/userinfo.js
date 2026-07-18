const { EmbedBuilder } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'userinfo',
  description: 'Affiche les infos d\'un utilisateur',
  category: 'utility',
  aliases: ['ui', 'whois', 'user'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    if (!member) return message.reply({ embeds: [error('Membre introuvable.')] });
    const roles = member.roles.cache.filter((r) => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor === '#000000' ? color() : member.displayHexColor)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: member.id, inline: true },
        { name: 'Surnom', value: member.nickname || 'Aucun', inline: true },
        { name: 'Bot', value: member.user.bot ? 'Oui' : 'Non', inline: true },
        { name: 'Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'A rejoint', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
        { name: `Rôles [${roles.size}]`, value: roles.size ? roles.map((r) => r.toString()).slice(0, 20).join(', ') : 'Aucun' }
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
