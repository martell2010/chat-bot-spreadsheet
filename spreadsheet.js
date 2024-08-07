import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import env from './env.js';

const { 
  GOOGLE_CLIENT_EMAIL, 
  GOOGLE_PRIVATE_KEY,
  SPREADSHEET_ID,
  SPREADSHEET_TAB_IDX 
} = env;


const serviceAccountAuth = new JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export default async function getWords() {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[SPREADSHEET_TAB_IDX];

  const rows = await sheet.getRows();

  return rows.map(({_rawData}) => {
    const [word, prononce, type, translate, examples] = _rawData;
    return {word, prononce, type, translate, examples};
  })
}
