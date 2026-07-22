const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');
const { withEmoji } = require('../../utils/emoji');

module.exports = {
  name: 'config',
  description: 'Show server configuration',
  category: 'config',
  aliases: ['settings'],
  permLevel: 'owner',
  async execute(client, message) {
    const g = client.db.ensureGuild(message.guild.id);
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('config', `Config — ${message.guild.name}`))
          .addFields(
            { name: 'Prefix', value: `\`${g.prefix}\``, inline: true },
            { name: 'Mod role', value: g.mod_role ? `<@&${g.mod_role}>` : 'None', inline: true },
            { name: 'Modlog', value: g.modlog_channel ? `<#${g.modlog_channel}>` : 'None', inline: true },
            { name: 'Welcome', value: g.welcome_channel ? `<#${g.welcome_channel}>` : 'None', inline: true },
            { name: 'Leave', value: g.leave_channel ? `<#${g.leave_channel}>` : 'None', inline: true },
            { name: 'Autorole', value: g.autorole ? `<@&${g.autorole}>` : 'None', inline: true },
            { name: 'Tickets', value: g.ticket_category ? 'Yes' : 'No', inline: true },
            {
              name: 'Automod',
              value: `Link:${g.automod_antilink ? 'ON' : 'OFF'} Spam:${g.automod_antispam ? 'ON' : 'OFF'} Words:${g.automod_badwords ? 'ON' : 'OFF'}`,
            }
          )
          .setTimestamp(),
      ],
    });
  },
};
