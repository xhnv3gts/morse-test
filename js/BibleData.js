import { getData, getRandomItem, getRandomIndex } from './utils.js';

export default class BibleData {
    static #directoryPath;
    static #metadata;
    static async initialize() {
        this.#directoryPath = new URL('../data/kjv/', import.meta.url);
        this.#metadata = await this.#getData('./metadata.json');
    }
    static async getRandomWord() {
        const words = await this.#getData('./words.json');
        return getRandomItem(words);
    }
    static async getBook(bookName) {
        const bookNames = this.#metadata.bookNames;
        bookName ??= getRandomItem(bookNames);
        const filePath = `./${String(bookNames.indexOf(bookName) + 1).padStart(2, '0')}_${bookName.replaceAll(' ', '-')}.json`;
        const bookAsChapters = await this.#getData(filePath);
        const reference = { bookName };
        return { bookAsChapters, reference };
    }
    static async getChapter(bookName, chapterNo) {
        const { bookAsChapters, reference } = await this.getBook(bookName);
        chapterNo ??= getRandomIndex(bookAsChapters) + 1;
        const chapterAsVerses = bookAsChapters[chapterNo - 1];
        reference.chapterNo = chapterNo;
        return { chapterAsVerses, reference };
    }
    static async getVerse(bookName, chapterNo, verseNo) {
        const { chapterAsVerses, reference } = await this.getChapter(bookName, chapterNo);
        verseNo ??= getRandomIndex(chapterAsVerses) + 1;
        const verse = chapterAsVerses[verseNo - 1];
        reference.verseNo = verseNo;
        return { verse, reference };
    }
    static getBookNames() {
        return this.#metadata.bookNames;
    }
    static getChapterCount(bookName) {
        return this.#metadata[bookName].chapterCount;
    }
    static getVerseCount(bookName, chapterNo) {
        return this.#metadata[bookName][chapterNo].verseCount;
    }
    static async #getData(filePath) {
        const data = await getData(new URL(filePath, this.#directoryPath));
        return data;
    }
}
