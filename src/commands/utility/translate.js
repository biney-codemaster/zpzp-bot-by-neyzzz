const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

const LANG_ALIASES = {
  en: 'en',
  fr: 'fr',
  es: 'es',
  de: 'de',
  it: 'it',
  pt: 'pt',
  ru: 'ru',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-CN',
  ar: 'ar',
  nl: 'nl',
  pl: 'pl',
  tr: 'tr',
};

async function translateText(text, target) {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const translated = (data[0] || []).map((chunk) => chunk[0]).join('');
  const detected = data[2] || 'auto';
  return { translated, detected };
}

module.exports = {
  name: 'translate',
  description: 'Translate text',
  category: 'utility',
  aliases: ['tr'],
  usage: '<lang> <text>',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message, args) {
    const langRaw = (args[0] || '').toLowerCase();
    const text = args.slice(1).join(' ');

    if (!langRaw || !text) {
      return message.reply({
        embeds: [
          error(
            [
              'Usage: `+translate <lang> <text>`',
              'Example: `+translate en Bonjour le monde`',
              `Languages: ${Object.keys(LANG_ALIASES).join(', ')}`,
            ].join('\n')
          ),
        ],
      });
    }

    const target = LANG_ALIASES[langRaw] || (langRaw.length <= 5 ? langRaw : null);
    if (!target) {
      return message.reply({ embeds: [error('Invalid language code.')] });
    }

    if (text.length > 1000) {
      return message.reply({ embeds: [error('Max 1000 characters.')] });
    }

    try {
      const { translated, detected } = await translateText(text, target);
      if (!translated) {
        return message.reply({ embeds: [error('Translation failed.')] });
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Translation')
            .addFields(
              {
                name: `From (${detected})`,
                value: text.slice(0, 1024),
              },
              {
                name: `To (${target})`,
                value: translated.slice(0, 1024),
              }
            )
            .setFooter({ text: message.author.tag })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error('[translate]', err);
      return message.reply({
        embeds: [error('Translation service unavailable. Try again later.')],
      });
    }
  },
};
