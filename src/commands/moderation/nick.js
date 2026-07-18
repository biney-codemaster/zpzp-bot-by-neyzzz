const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'nick',
  description: 'Change le surnom d\'un membre',
  category: 'moderation',
  aliases: ['nickname', 'setnick'],
  usage: '<membre> <nouveau surnom|reset>',
  permissions: ['ManageNicknames'],
  botPermissions: ['ManageNicknames'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const nick = args.slice(1).join(' ');
    if (!member) return message.reply({ embeds: [error('Mentionne un membre.')] });
    if (!nick) return message.reply({ embeds: [error('Donne un nouveau surnom ou `reset`.')] });
    if (!canModerate(message.member, member) && message.author.id !== member.id) {
      return message.reply({ embeds: [error('Tu ne peux pas modifier ce surnom.')] });
    }
    const value = ['reset', 'clear', 'none'].includes(nick.toLowerCase()) ? null : nick.slice(0, 32);
    await member.setNickname(value);
    return message.reply({ embeds: [success(value ? `Surnom de **${member.user.tag}** → **${value}**` : `Surnom de **${member.user.tag}** réinitialisé.`)] });
  },
};
