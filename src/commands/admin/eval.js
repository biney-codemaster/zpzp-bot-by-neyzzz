const util = require('util');
const { error, info } = require('../../utils/embeds');

module.exports = {
  name: 'eval',
  description: 'Évalue du JS (owner)',
  category: 'admin',
  usage: '<code>',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const code = args.join(' ');
    if (!code) return message.reply({ embeds: [error('Donne du code.')] });
    try {
      let result = await eval(code);
      if (typeof result !== 'string') result = util.inspect(result, { depth: 1 });
      result = result.replaceAll(client.token, '[TOKEN]');
      return message.reply({ embeds: [info(`\`\`\`js\n${result.slice(0, 3900)}\n\`\`\``, 'Eval')] });
    } catch (err) {
      return message.reply({ embeds: [error(`\`\`\`js\n${String(err).slice(0, 3900)}\n\`\`\``)] });
    }
  },
};
