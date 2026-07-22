const {
  defaultDraft,
  setDraft,
  buildCreateEmbed,
  mainMenu,
} = require('../../services/giveawayCreate');

module.exports = {
  name: 'gcreate',
  description: 'Create a giveaway with an interactive menu',
  category: 'giveaways',
  aliases: ['giveaway'],
  usage: '',
  permLevel: 'admin',
  async execute(client, message) {
    const draft = defaultDraft(message.channel.id);
    setDraft(client, message.guild.id, message.author.id, draft);

    return message.reply({
      embeds: [buildCreateEmbed(message.guild, draft)],
      components: mainMenu(message.author.id),
    });
  },
};
