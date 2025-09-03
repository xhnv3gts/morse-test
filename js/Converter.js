import { getData } from "./utils.js";

const characterToMorseCode = await getData('./data/character-to-morse-code.json');
export default class Converter {
    static #WORD_SEPARATOR = '|';
    static #CHARACTER_SEPARATOR = ' ';
    static #DECODING_MODE = Object.freeze({ EN_FIRST: 0, EN_ONLY: 1, JA_FIRST: 2, JA_ONLY: 3 });
    static get WORD_SEPARATOR() { return this.#WORD_SEPARATOR; }
    static get CHARACTER_SEPARATOR() { return this.#CHARACTER_SEPARATOR; }
    static get DECODING_MODE() { return this.#DECODING_MODE; }
    static #characterToMorseCode;
    static #morseCodeToCharacter;
    static #primaryLanguage;
    static #secondaryLanguage;
    static textToMorseCode(text) {
        return this.#normalizeText(text).split(' ').map(word => word.split('').map(character => this.#characterToMorseCode[character]).join(this.#CHARACTER_SEPARATOR)).join(this.#WORD_SEPARATOR);
    }
    static morseCodeToText(morseCode) {
        return morseCode.split(this.#WORD_SEPARATOR).map(mcWord => mcWord.split(this.#CHARACTER_SEPARATOR).map(mcCharacter =>
            this.#morseCodeToCharacter.number[mcCharacter] ?? this.#morseCodeToCharacter[this.#primaryLanguage][mcCharacter] ?? this.#morseCodeToCharacter[this.#secondaryLanguage][mcCharacter]
        ).join('')).join(' ');
    }
    static setDecodingMode(decodingMode) {
        [this.#primaryLanguage, this.#secondaryLanguage] = {
            [this.#DECODING_MODE.EN_FIRST]: ['en', 'ja'],
            [this.#DECODING_MODE.EN_ONLY]: ['en', null],
            [this.#DECODING_MODE.JA_FIRST]: ['ja', 'en'],
            [this.#DECODING_MODE.JA_ONLY]: ['ja', null],
        }[decodingMode];
    }
    static #normalizeText(text) {
        return text
            .toLowerCase()
            .replaceAll(/[\u3041-\u3096]/g, c => shiftCharacter(c, 0x60)) //コメント
            .replaceAll(/[ァィゥェォッャュョヮ]/g, c => shiftCharacter(c, 0x1))
            .replaceAll(/[ガギグゲゴザジズゼゾダヂヅデドバビブベボ]/g, c => `${shiftCharacter(c, -0x1)}゛`)
            .replaceAll(/[パピプペポ]/g, c => `${shiftCharacter(c, -0x2)}゜`)
            .replaceAll('ヴ', 'ウ゛')
            .replaceAll('ヵ', 'カ')
            .replaceAll('ヶ', 'ケ');

        function shiftCharacter(character, charCodeOffset) {
            return String.fromCharCode(character.charCodeAt(0) + charCodeOffset);
        }
    }
    static {
        this.#characterToMorseCode = Object.fromEntries(
            Object.values(characterToMorseCode).flatMap(Object.entries)
        );
        this.#morseCodeToCharacter = Object.fromEntries(
            Object.entries(characterToMorseCode).map(([outerKey, innerObj]) => [
                outerKey,
                Object.fromEntries(
                    Object.entries(innerObj).map(([k, v]) => [v, k])
                )
            ])
        );
    }
}
