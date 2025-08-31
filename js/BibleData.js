import { getData, getRandomItem, getRandomIndex, getRandomSubarray } from './utils.js';

export default class BibleData {
    static #words;
    static async getRandomWord() {
        this.#words ??= await getData('./data/words.json');
        return getRandomItem(this.#words);
    }
    static #bookNames;
    static #bookCache = {};
    static async getBook(bookName) {
        this.#bookNames ??= await getData('./data/book-names.json');
        bookName ??= getRandomItem(this.#bookNames);
        const book = await (async () => {
            if (Object.hasOwn(this.#bookCache, bookName)) {
                return this.#bookCache[bookName];
            } else {
                const serialNo = this.#bookNames.indexOf(bookName) + 1;
                const fileName = `${String(serialNo).padStart(2, '0')}_${bookName.replaceAll(' ', '-')}.json`;
                const book = await getData(`./data/book/${fileName}`);
                this.#bookCache[bookName] = book;
                return book;
            }
        })();
        const reference = { bookName };
        return [book, reference];
    }
    static async getChapter(bookName, chapterNo) {
        const [bookAsChapters, reference] = await this.getBook(bookName);
        chapterNo ??= getRandomIndex(bookAsChapters) + 1;
        const chapter = bookAsChapters[chapterNo - 1];
        reference.chapterNo = chapterNo;
        return [chapter, reference];
    }
    static async getVerse(bookName, chapterNo, verseNo) {
        const [chapterAsVerses, reference] = await this.getChapter(bookName, chapterNo);
        verseNo ??= getRandomIndex(chapterAsVerses) + 1;
        const verse = chapterAsVerses[verseNo - 1];
        reference.verseNo = verseNo;
        return [verse, reference];
    }
    static async getText(wordCount, bookName, chapterNo, verseNo) {
        const [verse, reference] = await this.getVerse(bookName, chapterNo, verseNo);
        const words = verse.split(' ');
        const text = getRandomSubarray(words, wordCount).join(' ');
        return [text, reference];
    }
}
