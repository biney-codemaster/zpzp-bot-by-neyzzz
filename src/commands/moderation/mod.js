const { info } = require('../../utils/embeds');
const {
  buildModEmbed,
  mainMenu,
  canUseModMenu,
} = require('../../services/modMenu');
const { hasLevel } = require('../../utils/permissions');

module.exports = {
  name: 'mod',
  description: 'Moderation panel (lookup, config)',
  category: 'moderation',
  aliases: ['modpanel', 'modmenu'],
  usage: '',
  permLevel: 'mod',
  async execute(client, message) {
    const guildData = client.db.ensureGuild(message.guild.id);
    if (!canUseModMenu(message.member, guildData, client.config.ownerIds)) {
      return message.reply({ embeds: [info('You do not have access to the moderation panel.')] });
    }

    const isAdmin = hasLevel(
      message.member,
      'admin',
      guildData,
      client.config.ownerIds
    );
    const thresholds = client.db.getWarnThresholds(message.guild.id);

    const embed = buildModEmbed(message.guild, guildData, thresholds);

    return message.reply({
      embeds: [embed],
      components: mainMenu(message.author.id, isAdmin),
    });
  },
};
