import TelegramBot from "node-telegram-bot-api";
import { readDictionary, writeWordToDictionary } from "./dictionary.js";
import { ACTIONS, INTERVALS } from "./constants.js";
import env from "./env.js";

import { generateWords } from "./generateWords.js";
import { loadDB, saveDB } from "./db/db.js";

const bot = new TelegramBot(env.TELEGRAM_TOKEN, { polling: true });

const INTERVAL_TIME = 600_000;

let words = [];
let ids = new Set();


const escapeText = (text) => text.replace(/([|{\[\]*_~}+)(#>!=\-.])/gm, '\\$1');

bot.setMyCommands(
  JSON.stringify([
    {
      command: ACTIONS.start,
      description: "Start learning",
    },
    {
      command: ACTIONS.pause,
      description: "Pause learning",
    },
    {
      command: ACTIONS.update,
      description: "Update dictionary",
    },
    {
      command: ACTIONS.setInterval,
      description: "Set messages interval",
    },
    {
      command: ACTIONS.writeWords,
      description: "Write words to dictionary",
    },
    {
      command: ACTIONS.reverse,
      description: "Reverse card EN-UA or UA-EN",
    },
  ])
);

const intervalButtons = {
  reply_markup: {
    keyboard: [
      [INTERVALS["30"], INTERVALS["60"], INTERVALS["300"]],
      [INTERVALS["600"], INTERVALS["1200"], INTERVALS["1800"]],
      [INTERVALS["3600"], INTERVALS["7200"]],
    ],
  },
};

const generateIds = () =>
  new Set(
    Array(words.length)
      .fill()
      .map((_, i) => i)
      .sort(() => 0.5 - Math.random())
  );

const loadWords = async (force = false) => {
  if (words.length && !force) {
    return;
  }

  if (force) {
    words = await readDictionary();
    saveDB(words);
  } else {
    words = await loadDB();
  }

  ids = generateIds();
};

const getWord = async () => {
  if (!ids.size) {
    ids = generateIds();
  }

  if (!words.length) {
    await loadWords();
  }

  const [id] = ids;
  const word = words[id];
  ids.delete(id);

  return word;
};

const getMessageTemplate = (wordEntity, isReversed = false) => {
  const word = escapeText(wordEntity.word);
  const pronounce = escapeText(wordEntity.pronounce);
  const translate = escapeText(wordEntity.translate);
  const examples = escapeText(wordEntity.examples);

  if (isReversed) {
    return `
💬 *Words:* ${translate}

🗣️ *Pronounce:* ||${pronounce}||

🇺🇸 *Translate:* ||${word}||

📃 *Example* 
||${examples}||
`;
  }

  return `
💬 *Word:* ${word}

🗣️ *Pronounce:* ||${pronounce}||

🇺🇦 *Translate:* ||${translate}||

📃 *Example* 
||${examples}||
    `;
};
const sendWord = async (chatId, isReversed = false) => {
  const wordEntity = await getWord();

  bot.sendMessage(chatId, getMessageTemplate(wordEntity, isReversed), {
    parse_mode: "MarkdownV2",
  });
};

const CONFIGS_BY_USER = new Map();

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  console.log(CONFIGS_BY_USER);

  if (!CONFIGS_BY_USER.has(chatId)) {
    CONFIGS_BY_USER.set(chatId, {
      timer: null,
      interval: INTERVAL_TIME,
      isAddedWords: false,
      isReversed: false,
    });
  }

  const CURRENT_CONFIG = CONFIGS_BY_USER.get(chatId);

  if (messageText === ACTIONS.start) {
    bot.sendMessage(chatId, "Started");
    await loadWords();
    sendWord(chatId, CURRENT_CONFIG.isReversed);
    clearInterval(CURRENT_CONFIG.timer);
    CURRENT_CONFIG.timer = setInterval(
      () => sendWord(chatId, CURRENT_CONFIG.isReversed),
      CURRENT_CONFIG.interval
    );
  }

  if (messageText === ACTIONS.pause) {
    bot.sendMessage(chatId, "On pause...");
    clearInterval(CURRENT_CONFIG.timer);
  }

  if (messageText === ACTIONS.update) {
    await loadWords(true);
    bot.sendMessage(chatId, "Updated");
  }

  if (messageText === ACTIONS.setInterval) {
    await loadWords(true);
    bot.sendMessage(chatId, "Set message interval", intervalButtons);
  }

  if (Object.values(INTERVALS).includes(messageText)) {
    const [[time]] = Object.entries(INTERVALS).filter(
      ([, v]) => v === messageText
    );
    CURRENT_CONFIG.interval = Number(time) * 1000;

    clearInterval(CURRENT_CONFIG.timer);

    CURRENT_CONFIG.timer = setInterval(
      () => sendWord(chatId, CURRENT_CONFIG.isReversed),
      CURRENT_CONFIG.interval
    );

    bot.sendMessage(chatId, `New message interval: ${messageText}`, {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  }

  if (messageText === ACTIONS.reverse) {
    CURRENT_CONFIG.isReversed = !CURRENT_CONFIG.isReversed;
    bot.sendMessage(
      chatId,
      CURRENT_CONFIG.isReversed ? "Card set to UA-EN" : "Card set to EN-UA"
    );
    return;
  }

  if (messageText === ACTIONS.writeWords) {
    bot.sendMessage(
      chatId,
      'Text words what you want to add to dictionary(use "," as separator)'
    );
    CURRENT_CONFIG.isAddedWords = true;
    return;
  }

  if (CURRENT_CONFIG.isAddedWords) {
    bot.sendMessage(chatId, "AI is generating new cards for you ✍🏻...");
    const wordEntities = await generateWords(messageText);
    console.log("wordEntities", wordEntities);

    if (!wordEntities || !Array.isArray(wordEntities)) {
      bot.sendMessage(chatId, "Something wrong.");
      CURRENT_CONFIG.isAddedWords = false;
      return;
    }

    for await (const wordEntity of wordEntities) {
      await writeWordToDictionary(wordEntity);
      bot.sendMessage(chatId, "Word was successfully added");
      bot.sendMessage(
        chatId,
        getMessageTemplate(wordEntity, CURRENT_CONFIG.isReversed),
        { parse_mode: "MarkdownV2" }
      );
    }

    CURRENT_CONFIG.isAddedWords = false;
  }
});
