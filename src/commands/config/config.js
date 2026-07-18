const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'config',
  description: 'Affiche la configuration du serveur',
  category: 'config',
  aliases: ['settings', 'configuration'],
  permissions: ['ManageGuild'],
  async execute(client, message) {
    const g = client.db.ensureGuild(message.guild.id);
    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle(`⚙️ Config — ${message.guild.name}`)
      .addFields(
        { name: 'Préfixe', value: `\`${g.prefix}\``, inline: true },
        {
          name: 'Modlog',
          value: g.modlog_channel ? `<#${g.modlog_channel}>` : 'Non',
          inline: true,
        },
        {
          name: 'Welcome',
          value: g.welcome_channel ? `<#${g.welcome_channel}>` : 'Non',
          inline: true,
        },
        {
          name: 'Leave',
          value: g.leave_channel ? `<#${g.leave_channel}>` : 'Non',
          inline: true,
        },
        {
          name: 'Autorole',
          value: g.autorole ? `<@&${g.autorole}>` : 'Non',
          inline: true,
        },
        {
          name: 'Suggestions',
          value: g.suggestion_channel ? `<#${g.suggestion_channel}>` : 'Non',
          inline: true,
        },
        {
          name: 'Tickets',
          value: g.ticket_category ? `Catégorie \`${g.ticket_category}\`` : 'Non',
          inline: true,
        },
        { name: 'Levels', value: g.levels_enabled ? 'ON' : 'OFF', inline: true },
        {
          name: 'Level channel',
          value: g.level_channel ? `<#${g.level_channel}>` : 'Salon du msg',
          inline: true,
        },
        {
          name: 'Automod',
          value: `Lien:${g.automod_antilink ? '✅' : '❌'} Spam:${g.automod_antispam ? '✅' : '❌'} Mots:${g.automod_badwords ? '✅' : '❌'}`,
          inline: false,
        }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
