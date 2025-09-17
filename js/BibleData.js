import { getData, getRandomItem, getRandomIndex, getRandomSubarray } from './utils.js';

export default class BibleData {
    static #directoryPath;
    static setDirectoryPath(directoryPath) {
        if (!directoryPath.endsWith('/')) { directoryPath += '/'; }
        this.#directoryPath = directoryPath;
    }
    static #words;
    static async getRandomWord() {
        this.#words ??= await getData(`${this.#directoryPath}words.json`);
        return getRandomItem(this.#words);
    }
    static #bookNames;
    static #bookCache = {};
    static async getBook(bookName) {
        this.#bookNames ??= await getData(`${this.#directoryPath}book-names.json`);
        bookName ??= getRandomItem(this.#bookNames);
        let bookAsChapters;
        if (Object.hasOwn(this.#bookCache, bookName)) {
            bookAsChapters = this.#bookCache[bookName];
        } else {
            const serialNo = this.#bookNames.indexOf(bookName) + 1;
            const fileName = `${String(serialNo).padStart(2, '0')}_${bookName.replaceAll(' ', '-')}.json`;
            bookAsChapters = this.#bookCache[bookName] = await getData(`${this.#directoryPath}${fileName}`);
        }
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
    static async getText(maxWords, bookName, chapterNo, verseNo) {
        const { verse, reference } = await this.getVerse(bookName, chapterNo, verseNo);
        const words = verse.split(' ');
        const text = getRandomSubarray(words, maxWords).join(' ');
        return { text, reference };
    }
}
