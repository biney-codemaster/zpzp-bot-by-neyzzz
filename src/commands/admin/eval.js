const util = require('util');
const { error, info } = require('../../utils/embeds');

module.exports = {
  name: 'eval',
  description: 'Run JavaScript code inside the bot (owner debugging tool)',
  category: 'admin',
  usage: '<code>',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const code = args.join(' ');
    if (!code) {
      return message.reply({
        embeds: [
          error(
            [
              'Provide JavaScript code to run inside the bot process.',
              '',
              'Example: `+eval client.guilds.cache.size`',
              'Useful for debugging. Very powerful — owner only.',
            ].join('\n')
          ),
        ],
      });
    }
    try {
      let result = await eval(code);
      if (typeof result !== 'string') result = util.inspect(result, { depth: 1 });
      result = result.replaceAll(client.token, '[TOKEN]');
      return message.reply({
        embeds: [info('```js\n' + result.slice(0, 3900) + '\n```', 'Eval')],
      });
    } catch (err) {
      const text = String(err).replaceAll(client.token, '[TOKEN]');
      return message.reply({
        embeds: [error('```js\n' + text.slice(0, 3900) + '\n```')],
      });
    }
  },
};
