const { success, error, info } = require('../../utils/embeds');
const {
  buildAutomodEmbed,
  mainMenu,
  parseJsonArray,
} = require('../../services/automodSetup');

module.exports = {
  name: 'automod',
  description: 'Open the automod setup menu',
  category: 'config',
  usage: '',
  permLevel: 'owner',
  async execute(client, message, args) {
    const g = client.db.ensureGuild(message.guild.id);
    const sub = (args[0] || '').toLowerCase();
    const value = (args[1] || '').toLowerCase();

    if (!sub) {
      return message.reply({
        embeds: [buildAutomodEmbed(message.guild, g)],
        components: mainMenu(message.author.id),
      });
    }

    if (
      ['antilink', 'antispam', 'badwords'].includes(sub) &&
      ['on', 'off', 'enable', 'disable'].includes(value)
    ) {
      const enabled = ['on', 'enable'].includes(value) ? 1 : 0;
      const key =
        sub === 'antilink'
          ? 'automod_antilink'
          : sub === 'antispam'
            ? 'automod_antispam'
            : 'automod_badwords';
      client.db.updateGuild(message.guild.id, { [key]: enabled });
      return message.reply({
        embeds: [success(`**${sub}** -> ${enabled ? 'ON' : 'OFF'}`)],
      });
    }

    if (sub === 'badwords') {
      let words = parseJsonArray(g.badwords);
      const action = value;
      const word = args.slice(2).join(' ').toLowerCase();
      if (action === 'list') {
        return message.reply({
          embeds: [
            info(
              words.length ? words.map((w) => `\`${w}\``).join(', ') : 'Empty list.',
              'Bad words'
            ),
          ],
        });
      }
      if (action === 'add') {
        if (!word) return message.reply({ embeds: [error('Provide a word.')] });
        if (!words.includes(word)) words.push(word);
        client.db.updateGuild(message.guild.id, {
          badwords: JSON.stringify(words),
          automod_badwords: 1,
        });
        return message.reply({ embeds: [success(`Added: \`${word}\``)] });
      }
      if (action === 'remove') {
        if (!word) return message.reply({ embeds: [error('Provide a word.')] });
        words = words.filter((w) => w !== word);
        client.db.updateGuild(message.guild.id, {
          badwords: JSON.stringify(words),
        });
        return message.reply({ embeds: [success(`Removed: \`${word}\``)] });
      }
    }

    return message.reply({
      embeds: [
        error('Invalid usage. Run `+automod` to open the menu.'),
      ],
    });
  },
};
