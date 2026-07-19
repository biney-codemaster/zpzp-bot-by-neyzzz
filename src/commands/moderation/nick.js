const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'nick',
  description: "Change le surnom d'un membre",
  category: 'moderation',
  aliases: ['setnick'],
  usage: '<membre> <surnom|reset>',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ManageNicknames],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const nick = args.slice(1).join(' ');
    if (!member || !nick) return message.reply({ embeds: [error('Usage : `+nick @user Nouveau`')] });
    if (!canModerate(message.member, member) && message.author.id !== member.id) {
      return message.reply({ embeds: [error('Tu ne peux pas modifier ce surnom.')] });
    }
    const value = ['reset', 'clear', 'none'].includes(nick.toLowerCase()) ? null : nick.slice(0, 32);
    await member.setNickname(value);
    return message.reply({ embeds: [success(value ? `Surnom → **${value}**` : 'Surnom réinitialisé.')] });
  },
};
