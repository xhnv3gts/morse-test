import { getData } from './utils.js';

const characterToMorseCode = await getData(new URL('../data/character-to-morse-code.json', import.meta.url));
const morseCodeToCharacter = await getData(new URL('../data/morse-code-to-character.json', import.meta.url));
export default class MorseCodeConverter {
    static #DECODING_MODE = Object.freeze({ EN_FIRST: 0, EN_ONLY: 1, JA_FIRST: 2, JA_ONLY: 3 });
    static get DECODING_MODE() { return this.#DECODING_MODE; }
    static #CHARACTER_SEPARATOR = ' ';
    static #WORD_SEPARATOR = '|';
    static #characterToMorseCode = characterToMorseCode;
    static #morseCodeToCharacter = morseCodeToCharacter;
    static textToMorseCode(text, onFailure) {
        const invalidCharacters = [...new Set([...text.replace(/\s+/g, '')])].filter(character => !Object.hasOwn(this.#characterToMorseCode, character));
        if (invalidCharacters.length) {
            onFailure?.(invalidCharacters);
            return null;
        }
        return text.trim().split(/\s+/).map(word => [...word].map(character => this.#characterToMorseCode[character]).join(this.#CHARACTER_SEPARATOR)).join(this.#WORD_SEPARATOR);
    }
    static morseCodeToText(morseCode, decodingMode, onFailure) {
        const [primaryLang, secondaryLang] = {
            [this.#DECODING_MODE.EN_FIRST]: ['en', 'ja'],
            [this.#DECODING_MODE.EN_ONLY]: ['en', null],
            [this.#DECODING_MODE.JA_FIRST]: ['ja', 'en'],
            [this.#DECODING_MODE.JA_ONLY]: ['ja', null]
        }[decodingMode];

        morseCode = morseCode.split(this.#WORD_SEPARATOR).map(mcWord => mcWord.trim().replace(/\s+/g, this.#CHARACTER_SEPARATOR)).join(this.#WORD_SEPARATOR);
        const invalidMorseCodes = [...new Set(morseCode.split(this.#WORD_SEPARATOR).map(mcWord => mcWord.split(this.#CHARACTER_SEPARATOR)).flat())].filter(mcCharacter =>
            !Object.hasOwn(this.#morseCodeToCharacter[primaryLang], mcCharacter) && (!secondaryLang || !Object.hasOwn(this.#morseCodeToCharacter[secondaryLang], mcCharacter))
        );
        if (invalidMorseCodes.length) {
            onFailure?.(invalidMorseCodes);
            return null;
        }

        return morseCode.split(this.#WORD_SEPARATOR).map(mcWord => mcWord.split(this.#CHARACTER_SEPARATOR).map(mcCharacter =>
            this.#morseCodeToCharacter[primaryLang][mcCharacter] ?? this.#morseCodeToCharacter[secondaryLang][mcCharacter]
        ).join('')).join(' ');
    }
    static structureMorseCode(morseCode) {
        return morseCode.split(this.#WORD_SEPARATOR).map(mcWord => mcWord.split(this.#CHARACTER_SEPARATOR).map(mcCharacter => [...mcCharacter]));
    }
}
