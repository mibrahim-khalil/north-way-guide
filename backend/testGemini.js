import "dotenv/config";
import { geminiText } from "./src/utils/gemini.js";

const text = await geminiText("Say hello in one line.");
console.log(text);