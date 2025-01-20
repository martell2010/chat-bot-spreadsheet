export const CONFIG = {
    langCode: "en",
    langName: "English",
    translationCode: 'ua',
    flag: "🇺🇸",
    prompt: `
Provide a syntactically correct JSON array for the following words with these fields:

- "word": the original English word.
- "pronounce": how to pronounce, phonetic transcription in Ukrainian.
- "translate": translation into Ukrainian.
- "examples": an example sentence in English and its Ukrainian translation in one sentence.

Example input: Thrill

Expected JSON output:
[
  {
    "word": "Thrill",
    "pronounce": "трил",
    "translate": "збудження, щастя, щедрість",
    "examples": "I feel such thrill now and want to share this wonderful feeling with you. Це таке щастя і щедрість."
  },
]
  
**Ensure that response not include anything except JSON, any additional information or text**
**Ensure the JSON is valid and correctly formatted, with no missing or extra characters.**
`
}