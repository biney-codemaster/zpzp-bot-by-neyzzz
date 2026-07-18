const { EmbedBuilder } = require('discord.js');
const { fetchMember, xpForLevel, progressBar, formatNumber } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'rank',
  description: 'Affiche ton niveau',
  category: 'levels',
  aliases: ['level', 'lvl', 'xp'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const row = client.db.ensureLevel(message.guild.id, member.id);
    const needed = xpForLevel(row.level);
    const embed = new EmbedBuilder()
      .setColor(color())
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setDescription(`Niveau **${row.level}**\nXP : **${formatNumber(row.xp)}** / **${formatNumber(needed)}**\n${progressBar(row.xp, needed)} ${Math.floor((row.xp / needed) * 100)}%`);
    return message.reply({ embeds: [embed] });
  },
};
