const { fetchMember } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');

module.exports = {
  name: 'warnings',
  description: 'List member warnings',
  category: 'moderation',
  aliases: ['warns'],
  usage: '[member]',
  permLevel: 'mod',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const warns = client.db.getWarnings(message.guild.id, member.id);
    if (!warns.length) return message.reply({ embeds: [info(`No warnings for **${member.user.tag}**.`)] });
    const list = warns.slice(0, 15).map((w) => `\`#${w.id}\` — <t:${Math.floor(w.created_at / 1000)}:R> — <@${w.moderator_id}>\n${w.reason}`).join('\n\n');
    return message.reply({ embeds: [info(list, `Warnings — ${member.user.tag} (${warns.length})`)] });
  },
};
