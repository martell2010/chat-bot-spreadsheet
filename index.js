import TelegramBot from "node-telegram-bot-api";
import getWords from "./spreadsheet.js";
import { ACTIONS, INTERVALS } from './constants.js';
import env from './env.js';

import express from 'express';
const app = express()
const port = env.PORT || 3000;

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})


const bot = new TelegramBot(env.TELEGRAM_TOKEN, { polling: true });

const INTERVAL_TIME = 600_000;

let words = []
let ids = new Set();

bot.setMyCommands(JSON.stringify([
    {
        command: ACTIONS.start,
        description: 'Start learning'
    },
    {
        command: ACTIONS.pause,
        description: 'Pause learning'
    },
    {
        command: ACTIONS.update,
        description: 'Update dictionary'
    },
    {
        command: ACTIONS.setInterval,
        description: 'Set messages interval'
    },
]))

const intervalButtons = {
    "reply_markup": {
        "keyboard": [
            [INTERVALS['30'], INTERVALS['60'], INTERVALS['300']],  
            [INTERVALS['600'], INTERVALS['1200'], INTERVALS['1800']],   
            [INTERVALS['3600'], INTERVALS['7200']],   
        ]
     }
};



const generateIds = () => new Set(Array(words.length).fill().map((_, i) => i).sort(() => .5 - Math.random()));

const loadWords = async (force=false) => {
    if(words.length && !force) {
        return;
    }
    
    words = await getWords();
    ids = generateIds()
}

const getWord = async () => {
    if (!ids.size) {
        ids = generateIds();
    }

    if(!words.length) {
        await loadWords();
    }

    const [id] = ids;
    const word = words[id];
    ids.delete(id);
        
    return word;
}

const sendWord = async (chatId) => {
    const {word, prononce, translate, examples } = await getWord();
    
    bot.sendMessage(chatId, `
💬 *Word:* ${word}

🗣️ *Prononce:* ${prononce}

🇺🇦 *Translate:* ${translate}

📃 *Example* 
${examples}
    `, {parse_mode : "Markdown"});
}

const CONFIGS_BY_USER = new Map();

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    
    if(!CONFIGS_BY_USER.has(chatId)) {
        CONFIGS_BY_USER.set(chatId, {
            timer: null,
            interval: INTERVAL_TIME,
        })
    }

    const CURRENT_CONFIG = CONFIGS_BY_USER.get(chatId)

    if(messageText === ACTIONS.start) {
        bot.sendMessage(chatId, 'Started');
        await loadWords();
        sendWord(chatId);
        CURRENT_CONFIG.timer = setInterval(() => sendWord(chatId), CURRENT_CONFIG.interval)
    }
 
    if(messageText === ACTIONS.pause) {
        bot.sendMessage(chatId, 'On pause...');
        clearInterval(CURRENT_CONFIG.timer);
    }

    if(messageText === ACTIONS.update) {
        await loadWords(true);
        bot.sendMessage(chatId, 'Updated');
    }

    if(messageText === ACTIONS.setInterval) {
        await loadWords(true);
        bot.sendMessage(chatId, 'Set message interval', intervalButtons);
    }

    if(Object.values(INTERVALS).includes(messageText)) {
        const [[time]] = Object.entries(INTERVALS).filter(([,v])=> v === messageText)
        CURRENT_CONFIG.interval = Number(time) * 1000;
        
        clearInterval(CURRENT_CONFIG.timer);

        CURRENT_CONFIG.timer = setInterval(() => sendWord(chatId),  CURRENT_CONFIG.interval)
        
        bot.sendMessage(chatId, `New message interval: ${messageText}`, {
            reply_markup: {
                remove_keyboard: true
            }
        });
    }

});