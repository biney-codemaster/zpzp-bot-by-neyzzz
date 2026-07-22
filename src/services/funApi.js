const { EmbedBuilder } = require('discord.js');
const { color } = require('../utils/embeds');

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'zpzp-bot/2.1 (Discord bot)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function firstOk(providers) {
  let lastErr;
  for (const fn of providers) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All providers failed');
}

async function fetchCatImage() {
  return firstOk([
    async () => {
      const data = await fetchJson('https://api.thecatapi.com/v1/images/search');
      const url = data?.[0]?.url;
      if (!url) throw new Error('no cat url');
      return { url, title: 'Cat', footer: 'TheCatAPI' };
    },
    async () => {
      const data = await fetchJson('https://aws.random.cat/meow');
      if (!data?.file) throw new Error('no cat file');
      return { url: data.file, title: 'Cat', footer: 'Random.cat' };
    },
    async () => {
      const data = await fetchJson('https://some-random-api.com/animal/cat');
      if (!data?.image) throw new Error('no cat image');
      return { url: data.image, title: 'Cat', footer: 'Some Random API' };
    },
  ]);
}

async function fetchDogImage() {
  return firstOk([
    async () => {
      const data = await fetchJson('https://dog.ceo/api/breeds/image/random');
      if (data?.status !== 'success' || !data?.message) throw new Error('dog ceo fail');
      return { url: data.message, title: 'Dog', footer: 'Dog CEO' };
    },
    async () => {
      const data = await fetchJson('https://random.dog/woof.json');
      if (!data?.url) throw new Error('random.dog fail');
      return { url: data.url, title: 'Dog', footer: 'Random.dog' };
    },
  ]);
}

async function fetchMeme() {
  return firstOk([
    async () => {
      const data = await fetchJson('https://meme-api.com/gimme');
      if (!data?.url) throw new Error('meme fail');
      return {
        url: data.url,
        title: data.title || 'Meme',
        footer: `r/${data.subreddit || 'memes'}`,
      };
    },
    async () => {
      const data = await fetchJson('https://meme-api.com/gimme/wholesomememes');
      if (!data?.url) throw new Error('meme wholesome fail');
      return {
        url: data.url,
        title: data.title || 'Meme',
        footer: `r/${data.subreddit || 'wholesomememes'}`,
      };
    },
    async () => {
      const data = await fetchJson('https://meme-api.com/gimme/meowmeowmeow');
      if (!data?.url) throw new Error('meme cat fail');
      return {
        url: data.url,
        title: data.title || 'Meme',
        footer: `r/${data.subreddit || 'memes'}`,
      };
    },
  ]);
}

async function fetchFact() {
  const { FACTS_FALLBACK } = require('../utils/funContent');
  return firstOk([
    async () => {
      const data = await fetchJson('https://uselessfacts.jsph.pl/api/v2/facts/random');
      if (!data?.text) throw new Error('no fact');
      return { text: data.text, source: 'Useless Facts' };
    },
    async () => {
      const data = await fetchJson('https://catfact.ninja/fact');
      if (!data?.fact) throw new Error('no cat fact');
      return { text: data.fact, source: 'Cat Facts' };
    },
    async () => ({
      text: FACTS_FALLBACK[Math.floor(Math.random() * FACTS_FALLBACK.length)],
      source: 'Local fallback',
    }),
  ]);
}

async function fetchQuote() {
  const { QUOTES_FALLBACK } = require('../utils/funContent');
  return firstOk([
    async () => {
      const data = await fetchJson('https://api.quotable.io/random');
      if (!data?.content) throw new Error('no quote');
      return {
        content: data.content,
        author: data.author || 'Unknown',
        source: 'Quotable',
      };
    },
    async () => {
      const q = QUOTES_FALLBACK[Math.floor(Math.random() * QUOTES_FALLBACK.length)];
      return { ...q, source: 'Local fallback' };
    },
  ]);
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

async function fetchTriviaQuestion() {
  const { TRIVIA_FALLBACK } = require('../utils/funContent');
  return firstOk([
    async () => {
      const data = await fetchJson(
        'https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986'
      );
      if (data?.response_code !== 0 || !data?.results?.[0]) {
        throw new Error('opentdb fail');
      }
      const q = data.results[0];
      const correct = decodeURIComponent(q.correct_answer);
      const incorrect = q.incorrect_answers.map(decodeURIComponent);
      const options = [correct, ...incorrect].sort(() => Math.random() - 0.5);
      return {
        question: decodeHtml(decodeURIComponent(q.question)),
        correct,
        options,
        category: decodeHtml(decodeURIComponent(q.category)),
        difficulty: q.difficulty,
        source: 'Open Trivia DB',
      };
    },
    async () => {
      const q = TRIVIA_FALLBACK[Math.floor(Math.random() * TRIVIA_FALLBACK.length)];
      const options = [q.correct, ...q.incorrect].sort(() => Math.random() - 0.5);
      return {
        question: q.question,
        correct: q.correct,
        options,
        category: 'General',
        difficulty: 'easy',
        source: 'Local fallback',
      };
    },
  ]);
}

function imageEmbed({ url, title, footer }) {
  return new EmbedBuilder()
    .setColor(color())
    .setTitle(title || 'Image')
    .setImage(url)
    .setFooter({ text: footer || 'Fun' })
    .setTimestamp();
}

module.exports = {
  fetchJson,
  fetchCatImage,
  fetchDogImage,
  fetchMeme,
  fetchFact,
  fetchQuote,
  fetchTriviaQuestion,
  decodeHtml,
  imageEmbed,
};
