const { EmbedBuilder } = require('discord.js');
const { success, error, color, info } = require('../../utils/embeds');

module.exports = {
  name: 'automod',
  description: "Configure l'auto-modération",
  category: 'config',
  usage: '<antilink|antispam|badwords> <on|off> | badwords add/remove/list <mot>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const guild = client.db.ensureGuild(message.guild.id);
    const sub = (args[0] || '').toLowerCase();
    const value = (args[1] || '').toLowerCase();

    if (!sub) {
      let badwords = [];
      try {
        badwords = JSON.parse(guild.badwords || '[]');
      } catch {
        badwords = [];
      }

      const embed = new EmbedBuilder()
        .setColor(color())
        .setTitle('⚙️ Auto-mod')
        .setDescription(
          [
            `Anti-lien : **${guild.automod_antilink ? 'ON' : 'OFF'}**`,
            `Anti-spam : **${guild.automod_antispam ? 'ON' : 'OFF'}**`,
            `Mots interdits : **${guild.automod_badwords ? 'ON' : 'OFF'}** (${badwords.length} mots)`,
            '',
            '`+automod antilink on/off`',
            '`+automod antispam on/off`',
            '`+automod badwords on/off`',
            '`+automod badwords add/remove/list <mot>`',
          ].join('\n')
        );

      return message.reply({ embeds: [embed] });
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
        embeds: [success(`**${sub}** → ${enabled ? 'activé' : 'désactivé'}`)],
      });
    }

    if (sub === 'badwords') {
      let badwords = [];
      try {
        badwords = JSON.parse(guild.badwords || '[]');
      } catch {
        badwords = [];
      }

      const action = value;
      const word = args.slice(2).join(' ').toLowerCase();

      if (action === 'list') {
        return message.reply({
          embeds: [
            info(
              badwords.length
                ? badwords.map((w) => `\`${w}\``).join(', ')
                : 'Liste vide.',
              'Mots interdits'
            ),
          ],
        });
      }

      if (action === 'add') {
        if (!word) return message.reply({ embeds: [error('Donne un mot.')] });
        if (!badwords.includes(word)) badwords.push(word);
        client.db.updateGuild(message.guild.id, {
          badwords: JSON.stringify(badwords),
          automod_badwords: 1,
        });
        return message.reply({ embeds: [success(`Mot ajouté : \`${word}\``)] });
      }

      if (action === 'remove') {
        if (!word) return message.reply({ embeds: [error('Donne un mot.')] });
        badwords = badwords.filter((w) => w !== word);
        client.db.updateGuild(message.guild.id, {
          badwords: JSON.stringify(badwords),
        });
        return message.reply({ embeds: [success(`Mot retiré : \`${word}\``)] });
      }
    }

    return message.reply({
      embeds: [error("Usage invalide. Fais `+automod` pour voir l'aide.")],
    });
  },
};
