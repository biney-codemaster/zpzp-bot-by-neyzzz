const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'calc', description: 'Evaluate a math expression', category: 'utility', aliases: ['math'], usage: '<expression>', permLevel: 'user',
  async execute(client, message, args) {
    const expr = args.join(' ');
    if (!expr) return message.reply({ embeds: [error('Usage: `+calc 2+2`')] });
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return message.reply({ embeds: [error('Invalid characters.')] });
    try {
      const result = Function(`"use strict"; return (${expr})`)();
      if (!Number.isFinite(result)) return message.reply({ embeds: [error('Invalid result.')] });
      return message.reply({ embeds: [info(`\`${expr}\` = **${result}**`)] });
    } catch { return message.reply({ embeds: [error('Invalid expression.')] }); }
  },
};
