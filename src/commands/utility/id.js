const { info, error } = require('../../utils/embeds');
const { fetchMember, parseRole, parseChannel } = require('../../utils/helpers');

module.exports = {
  name: 'id',
  description: 'Show IDs for yourself, this channel/server, or a mention',
  category: 'utility',
  aliases: ['getid'],
  usage: '[@user|@role|#channel]',
  permLevel: 'user',
  async execute(client, message, args) {
    if (!args.length && !message.mentions.users.size && !message.mentions.roles.size && !message.mentions.channels.size) {
      return message.reply({
        embeds: [
          info(
            [
              `Your ID: \`${message.author.id}\``,
              `Channel ID: \`${message.channel.id}\``,
              `Server ID: \`${message.guild.id}\``,
              '',
              'Or pass a mention / name: `+id @user` `+id @role` `+id #channel`',
            ].join('\n'),
            'IDs'
          ),
        ],
      });
    }

    const arg = args.join(' ');

    if (message.mentions.users.size) {
      const user = message.mentions.users.first();
      return message.reply({
        embeds: [info(`**User** ${user.tag}\n\`${user.id}\``, 'ID')],
      });
    }

    if (message.mentions.roles.size) {
      const role = message.mentions.roles.first();
      return message.reply({
        embeds: [info(`**Role** ${role.name}\n\`${role.id}\``, 'ID')],
      });
    }

    if (message.mentions.channels.size) {
      const channel = message.mentions.channels.first();
      return message.reply({
        embeds: [info(`**Channel** #${channel.name}\n\`${channel.id}\``, 'ID')],
      });
    }

    const member = await fetchMember(message, arg);
    if (member) {
      return message.reply({
        embeds: [info(`**User** ${member.user.tag}\n\`${member.id}\``, 'ID')],
      });
    }

    const role = parseRole(message, arg);
    if (role) {
      return message.reply({
        embeds: [info(`**Role** ${role.name}\n\`${role.id}\``, 'ID')],
      });
    }

    const channel = parseChannel(message, arg);
    if (channel) {
      return message.reply({
        embeds: [info(`**Channel** #${channel.name}\n\`${channel.id}\``, 'ID')],
      });
    }

    return message.reply({ embeds: [error('Could not resolve that to a user, role, or channel.')] });
  },
};
