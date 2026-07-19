const { EmbedBuilder } = require('discord.js');
const { success, error, info, color } = require('../../utils/embeds');

module.exports = {
  name: 'automod',
  description: "Configure l'auto-modération",
  category: 'config',
  usage: '<antilink|antispam|badwords> <on|off> | badwords add/remove/list',
  permLevel: 'admin',
  async execute(client, message, args) {
    const g = client.db.ensureGuild(message.guild.id);
    const sub = (args[0] || '').toLowerCase();
    const value = (args[1] || '').toLowerCase();

    if (!sub) {
      let words = [];
      try { words = JSON.parse(g.badwords || '[]'); } catch { words = []; }
      return message.reply({
        embeds: [new EmbedBuilder().setColor(color()).setTitle('Auto-mod').setDescription(
          [
            `Anti-lien : **${g.automod_antilink ? 'ON' : 'OFF'}**`,
            `Anti-spam : **${g.automod_antispam ? 'ON' : 'OFF'}**`,
            `Mots interdits : **${g.automod_badwords ? 'ON' : 'OFF'}** (${words.length})`,
            '',
            '`+automod antilink on/off`',
            '`+automod antispam on/off`',
            '`+automod badwords on/off`',
            '`+automod badwords add/remove/list <mot>`',
          ].join('\n')
        )],
      });
    }

    if (['antilink', 'antispam', 'badwords'].includes(sub) && ['on', 'off', 'enable', 'disable'].includes(value)) {
      const enabled = ['on', 'enable'].includes(value) ? 1 : 0;
      const key = sub === 'antilink' ? 'automod_antilink' : sub === 'antispam' ? 'automod_antispam' : 'automod_badwords';
      client.db.updateGuild(message.guild.id, { [key]: enabled });
      return message.reply({ embeds: [success(`**${sub}** → ${enabled ? 'ON' : 'OFF'}`)] });
    }

    if (sub === 'badwords') {
      let words = [];
      try { words = JSON.parse(g.badwords || '[]'); } catch { words = []; }
      const action = value;
      const word = args.slice(2).join(' ').toLowerCase();
      if (action === 'list') return message.reply({ embeds: [info(words.length ? words.map((w) => `\`${w}\``).join(', ') : 'Liste vide.', 'Mots interdits')] });
      if (action === 'add') {
        if (!word) return message.reply({ embeds: [error('Donne un mot.')] });
        if (!words.includes(word)) words.push(word);
        client.db.updateGuild(message.guild.id, { badwords: JSON.stringify(words), automod_badwords: 1 });
        return message.reply({ embeds: [success(`Ajouté : \`${word}\``)] });
      }
      if (action === 'remove') {
        if (!word) return message.reply({ embeds: [error('Donne un mot.')] });
        words = words.filter((w) => w !== word);
        client.db.updateGuild(message.guild.id, { badwords: JSON.stringify(words) });
        return message.reply({ embeds: [success(`Retiré : \`${word}\``)] });
      }
    }

    return message.reply({ embeds: [error('Usage invalide. Fais `+automod`.')] });
  },
};
