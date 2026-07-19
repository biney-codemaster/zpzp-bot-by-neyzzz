const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'warn',
  description: 'Warn a member',
  category: 'moderation',
  usage: '<member> <reason>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ');
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    if (!reason) return message.reply({ embeds: [error('Provide a reason.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('You cannot moderate this member.')] });
    const warnId = client.db.addWarning(message.guild.id, member.id, message.author.id, reason);
    const total = client.db.getWarnings(message.guild.id, member.id).length;
    const caseId = await sendModLog(client, message.guild, { action: 'Warn', moderator: message.author, target: member.user, reason, extra: `Warn #${warnId} • Total ${total}` });
    member.send(`You were warned in **${message.guild.name}**: ${reason}`).catch(() => null);
    return message.reply({ embeds: [success(`**${member.user.tag}** warned. Warn #${warnId} • Case #${caseId} • Total ${total}\n**Reason:** ${reason}`)] });
  },
};
