const { buildSetupEmbed, mainMenu } = require('../../services/giveawaySetup');

module.exports = {
  name: 'gsetup',
  description: 'Configure giveaway defaults',
  category: 'giveaways',
  aliases: ['giveawaysetup'],
  usage: '',
  permLevel: 'admin',
  async execute(client, message) {
    const guildData = client.db.ensureGuild(message.guild.id);
    return message.reply({
      embeds: [buildSetupEmbed(message.guild, guildData)],
      components: mainMenu(message.author.id),
    });
  },
};
