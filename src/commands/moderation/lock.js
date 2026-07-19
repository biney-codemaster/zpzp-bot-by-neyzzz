const { PermissionFlagsBits } = require('discord.js');
const { success } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'lock',
  description: 'Lock the channel',
  category: 'moderation',
  usage: '[reason]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const reason = args.join(' ') || 'Channel locked';
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason });
    await sendModLog(client, message.guild, { action: 'Lock', moderator: message.author, target: message.channel, reason });
    return message.reply({ embeds: [success(`Channel locked.\n**Reason:** ${reason}`)] });
  },
};
