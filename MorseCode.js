import { getData } from './utils.js';

const morseCodeList = await getData('./data/morse-code.json'); //todo:ファイル名、変数名
export default class MorseCode extends String {
    static #DECODING_MODE = Object.freeze({ EN_FIRST: 0, EN_ONLY: 1, JA_FIRST: 2, JA_ONLY: 3 });
    static get DECODING_MODE() { return this.#DECODING_MODE; }
    static #CHARACTER_SEPARATOR = ' ';
    static #WORD_SEPARATOR = '|';
    static #characterToMorseCode = Object.fromEntries(Object.values(morseCodeList).flatMap(Object.entries));
    static #morseCodeToCharacter = Object.fromEntries(Object.entries(morseCodeList).map(([key, obj]) => [key, Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]))]));
    static fromText(text) {
        const morseCode = this.#normalizeText(text).split(' ').map(word => word.split('').map(character => {
            if (!Object.hasOwn(this.#characterToMorseCode, character)) { throw new Error('モールス符号に変換できない文字が含まれています。'); }
            return this.#characterToMorseCode[character];
        }).join(this.#CHARACTER_SEPARATOR)).join(this.#WORD_SEPARATOR);
        return new MorseCode(morseCode);
    }
    static #normalizeText(text) {
        return text
            .toLowerCase()
            .replaceAll(/[ぁ-ゖ]/g, character => shiftCharCode(character, 0x60))
            .replaceAll(/[ァィゥェォッャュョヮ]/g, character => shiftCharCode(character, 0x1))
            .replaceAll(/[ガギグゲゴザジズゼゾダヂヅデドバビブベボ]/g, character => `${shiftCharCode(character, -0x1)}゛`)
            .replaceAll(/[パピプペポ]/g, character => `${shiftCharCode(character, -0x2)}゜`)
            .replaceAll('ヴ', 'ウ゛')
            .replaceAll('ヵ', 'カ')
            .replaceAll('ヶ', 'ケ')
            .replaceAll(/[ヷ-ヺ]/g, character => `${shiftCharCode(character, -0x8)}゛`);

        function shiftCharCode(character, offset) {
            return String.fromCharCode(character.charCodeAt(0) + offset);
        }
    }
    #signals;
    constructor(morseCode) {
        super(morseCode);
    }
    toText(decodingMode) {
        const [primaryLang, secondaryLang] = {
            [MorseCode.#DECODING_MODE.EN_FIRST]: ['en', 'ja'],
            [MorseCode.#DECODING_MODE.EN_ONLY]: ['en', null],
            [MorseCode.#DECODING_MODE.JA_FIRST]: ['ja', 'en'],
            [MorseCode.#DECODING_MODE.JA_ONLY]: ['ja', null],
        }[decodingMode];
        return this.split(MorseCode.#WORD_SEPARATOR).map(mcWord => mcWord.split(MorseCode.#CHARACTER_SEPARATOR).map(mcCharacter =>
            MorseCode.#morseCodeToCharacter.number[mcCharacter] ?? MorseCode.#morseCodeToCharacter[primaryLang][mcCharacter] ?? MorseCode.#morseCodeToCharacter[secondaryLang]?.[mcCharacter]
        ).join('')).join(' ');
    }
    toSignals() {
        this.#signals ??= this.split(MorseCode.#WORD_SEPARATOR).map(mcWord => mcWord.split(MorseCode.#CHARACTER_SEPARATOR).map(mcCharacter => mcCharacter.split('')));
        return this.#signals;
    }
}
