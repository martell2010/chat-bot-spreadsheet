import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import env from "./env.js";

const {
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  SPREADSHEET_ID,
  SPREADSHEET_TAB_IDX,
} = env;

const serviceAccountAuth = new JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const readDictionary = async () => {
  console.info("START Reading dictionary");
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[SPREADSHEET_TAB_IDX];

  const rows = await sheet.getRows();
  console.info("END Reading dictionary");

  return rows.map(({ _rawData }) => {
    const [word, pronounce, translate, examples, repeat] = _rawData;
    return { word, pronounce, translate, examples, repeat: Boolean(Number(repeat)) };
  });
};

/**
 * @param {{word: string, pronounce: string, translate: string, examples: string}} wordEntity
 * @returns {Promise<boolean>}
 */
export const writeWordToDictionary = async (wordEntity) => {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[SPREADSHEET_TAB_IDX];

  const data = Object.values(wordEntity);

  try {
    await sheet.addRow(data);

    return true;
  } catch (error) {
    console.log('Write word to dictionary error', error);
    return false;
  }
};
