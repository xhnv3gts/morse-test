import Beep from './js/Beep.js';
import IambicKeyer from './js/IambicKeyer.js';

//設定
const dotDuration = 50;
const defaultConvertMode = 'EN_ONLY';
const dotKey = 'ArrowLeft';
const dashKey = 'ArrowUp';

//ショートカットキー
window.addEventListener('keydown', e => {
    if (e.repeat) { return; }
    switch (e.key) {
        case 'Delete':
            if (document.activeElement !== document.getElementById('example-text')) {
                document.getElementById('clear-output').dispatchEvent(new Event('click'));
            }
            break;
        case 'ArrowDown':
            document.getElementById('practice-reception').dispatchEvent(new Event('click'));
            break;
        case 'v':
            document.getElementById('show-answer').dispatchEvent(new Event('click'));
            break;
    }
    switch (e.code) {
        case 'ArrowRight':
            e.preventDefault();
            document.getElementById('listen-again').dispatchEvent(new Event('click'));
            break;
    }
});

//
class Converter {
    static #MODE = { EN_FIRST: ['欧文優先', 'en', true], JA_FIRST: ['和文優先', 'ja', true], EN_ONLY: ['欧文のみ', 'en', false], JA_ONLY: ['和文のみ', 'ja', false] };
    static get MODE() { return this.#MODE; }
    static #letterToMorseCode = {
        'en': { 'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..' },
        'ja': { 'ア': '--.--', 'イ': '.-', 'ウ': '..-', 'エ': '-.---', 'オ': '.-...', 'カ': '.-..', 'キ': '-.-..', 'ク': '...-', 'ケ': '-.--', 'コ': '----', 'サ': '-.-.-', 'シ': '--.-.', 'ス': '---.-', 'セ': '.---.', 'ソ': '---.', 'タ': '-.', 'チ': '..-.', 'ツ': '.--.', 'テ': '.-.--', 'ト': '..-..', 'ナ': '.-.', 'ニ': '-.-.', 'ヌ': '....', 'ネ': '--.-', 'ノ': '..--', 'ハ': '-...', 'ヒ': '--..-', 'フ': '--..', 'ヘ': '.', 'ホ': '-..', 'マ': '-..-', 'ミ': '..-.-', 'ム': '-', 'メ': '-...-', 'モ': '-..-.', 'ヤ': '.--', 'ユ': '-..--', 'ヨ': '--', 'ラ': '...', 'リ': '--.', 'ル': '-.--.', 'レ': '---', 'ロ': '.-.-', 'ワ': '-.-', 'ヰ': '.-..-', 'ヱ': '.--..', 'ヲ': '.---', 'ン': '.-.-.' }
    };
    static #numberToMorseCode = { '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----' };
    static #symbolToMorseCode = {
        'en': { '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '"': '.-..-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '/': '-..-.', '(': '-.--.', ')': '-.--.-', ':': '---...', '@': '.--.-.' },
        'ja': { '゛': '..', '゜': '..--.', 'ー': '.--.-', '、': '.-.-.-', '（': '-.--.-', '）': '.-..-.' }
    };
    static #characterToMorseCode = { primary: {}, secondary: {} };
    static #morseCodeToCharacter = { primary: {}, secondary: {} };
    static toMorseCode(character) {
        return this.#characterToMorseCode.primary[character] ?? this.#characterToMorseCode.secondary[character];
    }
    static toCharacter(morseCode) {
        return this.#morseCodeToCharacter.primary[morseCode] ?? this.#morseCodeToCharacter.secondary[morseCode];
    }
    static setMode([, primaryLang, useSecondary]) {
        this.#characterToMorseCode.primary = { ...this.#letterToMorseCode[primaryLang], ...this.#numberToMorseCode, ...this.#symbolToMorseCode[primaryLang] };
        this.#morseCodeToCharacter.primary = swapKeyValue(this.#characterToMorseCode.primary);
        const secondaryLang = { 'en': 'ja', 'ja': 'en' }[primaryLang];
        this.#characterToMorseCode.secondary = useSecondary ? { ...this.#letterToMorseCode[secondaryLang], ...this.#symbolToMorseCode[secondaryLang] } : {};
        this.#morseCodeToCharacter.secondary = swapKeyValue(this.#characterToMorseCode.secondary);

        function swapKeyValue(obj) {
            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]));
        }
    }
}

document.addEventListener("visibilitychange", () => {
    document.getElementById('log').append('[vc]');
    if (document.visibilityState === "hidden") {
        document.getElementById('log').append('[h]');
        // Beep.cancel();
        Player.stop();
    } else if (document.visibilityState === "visible") {
        document.getElementById('log').append('[v]');
    }
});

// document.getElementById('test1').addEventListener('click', () => {
//     document.getElementById('log').append('[t1]');
//     Player.stop();
// });

//共通------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.getElementById('volume').addEventListener('input', e => Beep.setVolume(e.target.valueAsNumber));
document.getElementById('volume').dispatchEvent(new Event('input'));

//送信練習------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const output = document.getElementById('output');
const signals = [];
let timeoutId1, timeoutId2;
const letterSpace = dotDuration * 3;
const wordSpace = dotDuration * 7;

IambicKeyer.initialize(dotKey, dashKey, dotDuration);
IambicKeyer.onsignalstart = signal => {
    clearTimeout(timeoutId1);
    clearTimeout(timeoutId2);
    signals.push(signal);
};
IambicKeyer.onsignalend = () => {
    timeoutId1 = setTimeout(() => {
        const morseCode = signals.join('');
        const character = Converter.toCharacter(morseCode) ?? '[?]';
        output.textContent += character.toUpperCase();
        signals.length = 0;
    }, letterSpace);
    timeoutId2 = setTimeout(() => {
        output.textContent += ' ';
    }, wordSpace);
};
document.getElementById('clear-output').addEventListener('click', () => output.textContent = '');

//受信練習------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// this.#normalizedText = getNormalizedText(text);

class Player {
    static #isPlaying = false;
    static #processTimeoutId;
    static stop() {
        if (this.#isPlaying) {
            Player.#isBeepCanceled = true;
            Beep.cancel();
            clearTimeout(this.#processTimeoutId);
            this.#isPlaying = false;
        }
    }

    static #isBeepCanceled = false;
    #signalDuration;
    #signalSpace;
    #letterSpace;
    #wordSpace;
    #signals;
    #wordIndex;
    #letterIndex;
    #signalIndex;
    constructor(dotDuration) {
        this.#setDurationAndSpace(dotDuration);
    }
    set(text) {
        this.#signals = textToSignals(text);
        this.#resetIndex();

        function textToSignals(text) {
            return text
                .trim()
                .split(/\s+/) // 空白で単語に分割
                .map(word =>
                    word.split('') // 1文字ずつ
                        .map(char => charToSignals(char)) // 文字を信号配列に変換
                );
        }

        function charToSignals(char) {
            const signalStr = Converter.toMorseCode(char);
            return signalStr.split('');
        }
    }
    play() {
        this.#resetIndex();
        Player.#isPlaying = true;
        Player.#isBeepCanceled = false;
        this.#process();
    }
    #resetIndex() {
        this.#wordIndex = this.#letterIndex = this.#signalIndex = 0;
    }
    async #process() {
        const signal = this.#signals[this.#wordIndex][this.#letterIndex][this.#signalIndex];
        const signalDuration = this.#signalDuration[signal];
        await Beep.play(signalDuration);
        if (Player.#isBeepCanceled) {
            return;
        }

        const space = (() => {
            this.#signalIndex++;
            if (this.#signals[this.#wordIndex][this.#letterIndex][this.#signalIndex]) { return this.#signalSpace; }
            
            this.#signalIndex = 0;
            this.#letterIndex++;
            if (this.#signals[this.#wordIndex][this.#letterIndex]) { return this.#letterSpace; }

            this.#letterIndex = 0;
            this.#wordIndex++;
            if (this.#signals[this.#wordIndex]) { return this.#wordSpace; }

            return null;
        })();


        if (space) {
            Player.#processTimeoutId = setTimeout(() => this.#process(), space);
        } else {
            Player.#isPlaying = false;
        }

    }
    #setDurationAndSpace(dotDuration) {
        this.#signalDuration = { '.': dotDuration, '-': dotDuration * 3 };
        this.#signalSpace = dotDuration;
        this.#letterSpace = dotDuration * 3;
        this.#wordSpace = dotDuration * 7;
    }
}

// Converter.setMode(Converter.MODE['EN_ONLY']);
// Player.set('abc de');

const player = new Player(dotDuration);
document.getElementById('play-example').addEventListener('click', () => {
    const text = document.getElementById('example-text').value;
    player.set(text);
    player.play();
});

function getNormalizedText(text) {
    return text
        .toLowerCase()
        .replaceAll(/[\u3041-\u3096]/g, c => shiftCharacter(c, 0x60))
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

let words;
async function getRandomWord() {
    words ??= await getData('./data/words.json');
    return getRandomItem(words);
}

let bookNames;
let bookCache = {};
async function getBook(bookName) {
    bookNames ??= await getData('./data/book-names.json');
    bookName ??= getRandomItem(bookNames);
    const book = await (async () => {
        if (Object.hasOwn(bookCache, bookName)) {
            return bookCache[bookName];
        } else {
            const serialNo = bookNames.indexOf(bookName) + 1;
            const fileName = `${String(serialNo).padStart(2, '0')}_${bookName.replaceAll(' ', '-')}.json`;
            const book = await getData(`./data/book/${fileName}`);
            bookCache[bookName] = book;
            return book;
        }
    })();
    const reference = { bookName };
    return [book, reference];
}
async function getChapter(bookName, chapterNo) {
    const [bookAsChapters, reference] = await getBook(bookName);
    chapterNo ??= getRandomIndex(bookAsChapters) + 1;
    const chapter = bookAsChapters[chapterNo - 1];
    reference.chapterNo = chapterNo;
    return [chapter, reference];
}
async function getVerse(bookName, chapterNo, verseNo) {
    const [chapterAsVerses, reference] = await getChapter(bookName, chapterNo);
    verseNo ??= getRandomIndex(chapterAsVerses) + 1;
    const verse = chapterAsVerses[verseNo - 1];
    reference.verseNo = verseNo;
    return [verse, reference];
}
async function getText(wordCount, bookName, chapterNo, verseNo) {
    const [verse, reference] = await getVerse(bookName, chapterNo, verseNo);
    const words = verse.split(' ');
    const text = getRandomSubarray(words, wordCount).join(' ');
    return [text, reference];
}

{
    const player2 = new Player(dotDuration);
    const useSymbol = false; //記号を含めるか
    const wordNum = 1; //単語数(１のときは重複を除外した配列を使う)

    let text2;
    let normalizedText;

    function createReferenceText(reference) {
        const { bookName, chapterNo, verseNo } = reference;
        let referenceText = bookName;
        if (chapterNo) { referenceText += ` ${chapterNo}`; }
        if (verseNo) { referenceText += `:${verseNo}`; }
        return referenceText;
    }

    document.getElementById('practice-reception').addEventListener('click', async () => {
        document.getElementById('answer').style.visibility = 'hidden';

        if (wordNum === 1) {
            const word = await getRandomWord();
            player2.set(word);
            text2 = word;
            normalizedText = getNormalizedText(word);
            document.getElementById('answer').textContent = normalizedText;
        } else {
            const [text, reference] = await getText(wordNum);
            player2.set(text);
            text2 = text;
            normalizedText = getNormalizedText(text);
            const referenceText = createReferenceText(reference);
            document.getElementById('answer').textContent = `${normalizedText} (${referenceText})`;
        }
        player2.play();
    });

    document.getElementById('listen-again').addEventListener('click', () => {
        if (!text2) { return; }
        player2.play();
    });

    document.getElementById('show-answer').addEventListener('click', () => {
        document.getElementById('answer').style.visibility = 'visible';
    });
}

//イベントリスナー追加------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.getElementById('convert-mode').addEventListener('change', e => {
    const mode = e.target.value;
    Converter.setMode(Converter.MODE[e.target.value]);
});

//初期化------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.getElementById('convert-mode').append(...Object.entries(Converter.MODE).map(([value, [text]]) => value === defaultConvertMode ? new Option(text, value, true, true) : new Option(text, value)));
// document.getElementById('convert-mode').append(...Object.keys(Converter.MODE).map(convertMode => convertMode === defaultConvertMode ? new Option(text, value, true, true) : new Option(text, value)));

document.getElementById('convert-mode').dispatchEvent(new Event('change'));



//キャンバス
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
}
resize();
window.addEventListener('resize', resize);

let drawing = false;
let lastX, lastY;

function getPos(touch) {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e.touches[0]);
    lastX = pos.x;
    lastY = pos.y;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e.touches[0]);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
}, { passive: false });

canvas.addEventListener('touchend', e => {
    drawing = false;
});

document.getElementById('clear-canvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景が白必要な場合は再度塗る
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

async function getData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) { throw new Error(`Response status: ${response.status}`); }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

function getRandomIndex(array) {
    return Math.floor(Math.random() * array.length);
}
function getRandomItem(array) {
    const index = getRandomIndex(array);
    return array[index];
}
function getRandomSubarray(array, range) {
    if (range <= 0) { return null; }
    if (range >= array.length) { return array; }
    const start = Math.floor(Math.random() * (array.length - range + 1));
    const end = start + range;
    return array.slice(start, end);
}
