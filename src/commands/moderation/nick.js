const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'nick',
  description: 'Change a member nickname',
  category: 'moderation',
  aliases: ['setnick'],
  usage: '<member> <nick|reset>',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ManageNicknames],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const nick = args.slice(1).join(' ');
    if (!member || !nick) return message.reply({ embeds: [error('Usage: `+nick @user NewNick`')] });
    if (!canModerate(message.member, member) && message.author.id !== member.id) {
      return message.reply({ embeds: [error('You cannot change this nickname.')] });
    }
    const value = ['reset', 'clear', 'none'].includes(nick.toLowerCase()) ? null : nick.slice(0, 32);
    await member.setNickname(value);
    return message.reply({ embeds: [success(value ? `Nickname set to **${value}**` : 'Nickname reset.')] });
  },
};
