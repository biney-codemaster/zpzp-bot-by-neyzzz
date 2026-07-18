const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'warn',
  description: 'Avertit un membre',
  category: 'moderation',
  aliases: ['avertir'],
  usage: '<membre> <raison>',
  permissions: ['ModerateMembers'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ');
    if (!member) return message.reply({ embeds: [error('Mentionne un membre valide.')] });
    if (!reason) return message.reply({ embeds: [error('Donne une raison.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    const id = client.db.addWarning(message.guild.id, member.id, message.author.id, reason);
    const total = client.db.getWarnings(message.guild.id, member.id).length;
    await sendModLog(client, message.guild, { action: 'Warn', moderator: message.author, target: member.user, reason, extra: `Warn #${id} • Total: ${total}` });
    member.send({ content: `⚠️ Tu as reçu un avertissement sur **${message.guild.name}** : ${reason}` }).catch(() => null);
    return message.reply({ embeds: [success(`**${member.user.tag}** a été averti. (Warn #${id} • Total: ${total})\n**Raison :** ${reason}`)] });
  },
};
