const { info } = require('../../utils/embeds');

module.exports = {
  name: 'roles',
  description: 'List server roles',
  category: 'utility',
  permLevel: 'user',
  async execute(client, message) {
    const roles = message.guild.roles.cache
      .filter((r) => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position);

    const mapped = roles.map((r) => r.toString());
    let body = mapped.join(', ');
    let truncated = false;
    if (body.length > 3900) {
      truncated = true;
      while (body.length > 3900 && mapped.length) {
        mapped.pop();
        body = mapped.join(', ');
      }
      body += ` …(+${roles.size - mapped.length} more)`;
    }

    return message.reply({
      embeds: [
        info(
          body || 'None',
          `Roles (${roles.size})${truncated ? ' — truncated' : ''}`
        ),
      ],
    });
  },
};
