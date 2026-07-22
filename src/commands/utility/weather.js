const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

const WMO = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

async function geocode(query) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const data = await res.json();
  return data.results?.[0] || null;
}

async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  return res.json();
}

module.exports = {
  name: 'weather',
  description: 'Show current weather for a city',
  category: 'utility',
  aliases: ['meteo', 'w'],
  usage: '<city>',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message, args) {
    const query = args.join(' ');
    if (!query) {
      return message.reply({
        embeds: [error('Usage: `+weather Paris` or `+weather New York`')],
      });
    }

    try {
      const place = await geocode(query);
      if (!place) {
        return message.reply({ embeds: [error('City not found.')] });
      }

      const data = await fetchWeather(place.latitude, place.longitude);
      const cur = data.current;
      if (!cur) {
        return message.reply({ embeds: [error('Weather data unavailable.')] });
      }

      const condition = WMO[cur.weather_code] || `Code ${cur.weather_code}`;
      const where = [place.name, place.admin1, place.country]
        .filter(Boolean)
        .join(', ');

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle(`Weather — ${where}`)
            .addFields(
              {
                name: 'Condition',
                value: condition,
                inline: true,
              },
              {
                name: 'Temperature',
                value: `${cur.temperature_2m}°C`,
                inline: true,
              },
              {
                name: 'Feels like',
                value: `${cur.apparent_temperature}°C`,
                inline: true,
              },
              {
                name: 'Humidity',
                value: `${cur.relative_humidity_2m}%`,
                inline: true,
              },
              {
                name: 'Wind',
                value: `${cur.wind_speed_10m} km/h`,
                inline: true,
              },
              {
                name: 'Timezone',
                value: data.timezone || 'N/A',
                inline: true,
              }
            )
            .setFooter({ text: 'Data: Open-Meteo' })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error('[weather]', err);
      return message.reply({
        embeds: [error('Weather service unavailable. Try again later.')],
      });
    }
  },
};
