const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { color } = require('../../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../../utils/emoji');

module.exports = {
  name: 'configreset',
  description: 'Reset all server configuration to defaults',
  category: 'config',
  aliases: ['resetconfig'],
  usage: '',
  permLevel: 'owner',
  cooldown: 10,
  async execute(client, message) {
    const confirm = new ButtonBuilder()
      .setCustomId(`cfgreset_confirm:${message.author.id}`)
      .setLabel('Confirm reset')
      .setStyle(ButtonStyle.Danger);
    applyComponentEmoji(confirm, 'warn');

    const cancel = new ButtonBuilder()
      .setCustomId(`cfgreset_cancel:${message.author.id}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);
    applyComponentEmoji(cancel, 'close');

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('config', 'Reset configuration'))
          .setDescription(
            [
              'This will reset **all** server settings to defaults:',
              'prefix, mod role, modlog, welcome, leave, autorole, tickets, automod, and giveaway defaults.',
              '',
              'This cannot be undone.',
            ].join('\n')
          )
          .setTimestamp(),
      ],
      components: [new ActionRowBuilder().addComponents(confirm, cancel)],
    });
  },
};
