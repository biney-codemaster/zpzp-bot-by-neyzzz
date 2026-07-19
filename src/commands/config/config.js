const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'config',
  description: 'Affiche la configuration',
  category: 'config',
  aliases: ['settings'],
  permLevel: 'admin',
  async execute(client, message) {
    const g = client.db.ensureGuild(message.guild.id);
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(`Config — ${message.guild.name}`)
          .addFields(
            { name: 'Préfixe', value: `\`${g.prefix}\``, inline: true },
            { name: 'Admin role', value: g.admin_role ? `<@&${g.admin_role}>` : 'Non', inline: true },
            { name: 'Mod role', value: g.mod_role ? `<@&${g.mod_role}>` : 'Non', inline: true },
            { name: 'Modlog', value: g.modlog_channel ? `<#${g.modlog_channel}>` : 'Non', inline: true },
            { name: 'Welcome', value: g.welcome_channel ? `<#${g.welcome_channel}>` : 'Non', inline: true },
            { name: 'Leave', value: g.leave_channel ? `<#${g.leave_channel}>` : 'Non', inline: true },
            { name: 'Autorole', value: g.autorole ? `<@&${g.autorole}>` : 'Non', inline: true },
            { name: 'Tickets', value: g.ticket_category ? 'Oui' : 'Non', inline: true },
            { name: 'Automod', value: `Lien:${g.automod_antilink ? 'ON' : 'OFF'} Spam:${g.automod_antispam ? 'ON' : 'OFF'} Mots:${g.automod_badwords ? 'ON' : 'OFF'}` }
          )
          .setTimestamp(),
      ],
    });
  },
};
