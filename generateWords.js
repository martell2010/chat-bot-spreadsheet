import axios from "axios";
import { SYSTEM_PROMT } from "./constants.js";
import env from "./env.js";

const {
  CHAT_GPT_API_KEY,
  CHAT_GPT_API_HOST,
  CHAT_GPT_API_URL,
  CHAT_GPT_BOT_ID,
} = env;

/**
 * @param {string} words
 * @returns {Promise<null|Array<{word: string, pronounce: string, translate: string, examples: string}>>}
 */
export const generateWords = async (words) => {
  if (!words?.length) {
    return null;
  }
  console.log(words);
  const options = {
    method: "POST",
    url: CHAT_GPT_API_URL,
    headers: {
      "x-rapidapi-key": CHAT_GPT_API_KEY,
      "x-rapidapi-host": CHAT_GPT_API_HOST,
      "Content-Type": "application/json",
    },
    data: {
      bot_id: CHAT_GPT_BOT_ID,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMT,
        },
        {
          role: "user",
          content: words,
        },
      ],
      user_id: "",
      temperature: 0.9,
      top_k: 5,
      top_p: 0.9,
      max_tokens: 256,
      model: "gpt 3.5",
    },
  };

  try {
    const response = await axios.request(options);
    console.log(response.data.result);

    return JSON.parse(response.data.result);
  } catch (error) {
    console.error(error);
    return null;
  }
};
