const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'calc',
  description: 'Calcule une expression mathématique simple',
  category: 'utility',
  aliases: ['math', 'calculate'],
  usage: '<expression>',
  async execute(client, message, args) {
    const expr = args.join(' ');
    if (!expr) return message.reply({ embeds: [error('Usage : `+calc 2+2*3`')] });
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return message.reply({ embeds: [error('Caractères non autorisés.')] });
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr})`)();
      if (!Number.isFinite(result)) return message.reply({ embeds: [error('Résultat invalide.')] });
      return message.reply({ embeds: [info(`🧮 \`${expr}\` = **${result}**`)] });
    } catch {
      return message.reply({ embeds: [error('Expression invalide.')] });
    }
  },
};
