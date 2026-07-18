const { fetchMember } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'inventory',
  description: 'Affiche un inventaire',
  category: 'economy',
  aliases: ['inv', 'bag'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const items = client.db.getInventory(message.guild.id, member.id);
    if (!items.length) return message.reply({ embeds: [info(`Inventaire vide pour **${member.user.username}**.`)] });
    const lines = items.map((it) => {
      const meta = config.shop.find((s) => s.id === it.item_id);
      return `• **${meta?.name || it.item_id}** ×${it.amount}`;
    }).join('\n');
    return message.reply({ embeds: [info(lines, `🎒 Inventaire de ${member.user.username}`)] });
  },
};
