const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'emojis',
  description: 'List server custom emojis',
  category: 'utility',
  aliases: ['emotes'],
  permLevel: 'user',
  async execute(client, message) {
    const emojis = [...message.guild.emojis.cache.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (!emojis.length) {
      return message.reply({ embeds: [error('This server has no custom emojis.')] });
    }

    const animated = emojis.filter((e) => e.animated);
    const staticE = emojis.filter((e) => !e.animated);

    const format = (list) => {
      const lines = list.map((e) => `${e} \`:${e.name}:\``);
      let out = '';
      let shown = 0;
      for (const line of lines) {
        const next = out ? `${out}\n${line}` : line;
        if (next.length > 1800) break;
        out = next;
        shown += 1;
      }
      if (!shown) return 'None';
      if (shown < list.length) {
        out += `\n…(+${list.length - shown} more)`;
      }
      return out;
    };

    const parts = [];
    if (staticE.length) {
      parts.push(`**Static (${staticE.length})**\n${format(staticE)}`);
    }
    if (animated.length) {
      parts.push(`**Animated (${animated.length})**\n${format(animated)}`);
    }

    let body = parts.join('\n\n');
    if (body.length > 4000) {
      body = `${body.slice(0, 3990)}…`;
    }

    return message.reply({
      embeds: [info(body, `Emojis (${emojis.length})`)],
    });
  },
};
