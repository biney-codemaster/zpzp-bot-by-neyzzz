const { error } = require('../../utils/embeds');

const EVERYONE_RE = /@(?:everyone|here)\b/i;
const ROLE_MENTION_RE = /<@&\d+>/g;
const USER_MENTION_RE = /<@!?\d+>/g;

module.exports = {
  name: 'say',
  description: 'Make the bot say something',
  category: 'utility',
  usage: '<message>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const text = args.join(' ');
    if (!text) {
      return message.reply({ embeds: [error('Provide a message.')] });
    }

    if (EVERYONE_RE.test(text)) {
      return message.reply({
        embeds: [error('`@everyone` / `@here` are not allowed.')],
      });
    }

    const roleMentions = text.match(ROLE_MENTION_RE) || [];
    const userMentions = text.match(USER_MENTION_RE) || [];
    if (roleMentions.length > 0) {
      return message.reply({
        embeds: [error('Role mentions are not allowed in `+say`.')],
      });
    }
    if (userMentions.length > 5) {
      return message.reply({
        embeds: [error('Too many user mentions (max 5).')],
      });
    }

    await message.delete().catch(() => null);
    return message.channel.send({
      content: text.slice(0, 2000),
      allowedMentions: {
        parse: [],
        users: userMentions.map((m) => m.replace(/\D/g, '')),
        roles: [],
        repliedUser: false,
      },
    });
  },
};
