import fs from "node:fs"
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "db.txt");


export const saveDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data));
  } catch (error) {
    console.error("Write DB error: ", error);
  }
};

export const loadDB = async () => {
  try {
    const data = fs.readFileSync(dbPath, "utf8");

    return JSON.parse(data);
  } catch (err) {
    console.error("Read DB error", err);
  }
};
