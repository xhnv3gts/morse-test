//グローバル変数------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const dotDuration = 50;
const dashDuration = dotDuration * 3;
const signalGap = dotDuration;
const letterGap = dotDuration * 3;
const wordGap = dotDuration * 7;

const defaultConvertMode = 'EN_ONLY';

//クラス------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
class Signal {
    #signal;
    #isDot;
    #isDash;
    constructor(signal) {
        this.#signal = signal;
        this.#isDot = signal === '.';
        this.#isDash = signal === '-';
    }
    toString() {
        return this.#signal;
    }
    get isDot() { return this.#isDot; }
    get isDash() { return this.#isDash; }
    get duration() { return this.#isDot ? dotDuration : dashDuration; }
    get invertedSignal() { return new Signal({ '.': '-', '-': '.' }[this.#signal]); }
    equals(signal) {
        return this.toString() === signal.toString();
    }
}

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

class Beep {
    static #audioCtx;
    static #frequency = 770;
    static #gain;
    static play(duration) {
        return new Promise(resolve => {
            if (!this.#audioCtx) { this.#audioCtx = new AudioContext(); }
            const oscillator = new OscillatorNode(this.#audioCtx, { type: 'sawtooth', frequency: this.#frequency });
            oscillator.onended = () => resolve();
            const gainNode = new GainNode(this.#audioCtx, { gain: this.#gain });
            oscillator.connect(gainNode).connect(this.#audioCtx.destination);
            oscillator.start();
            oscillator.stop(this.#audioCtx.currentTime + duration / 1000);
        });
    }
    static setVolume(volume) {
        this.#gain = volume * 0.0006;
    }
}

class SignalBuffer {
    static #signals = [];
    static get morseCode() { return this.#signals.join(''); }
    static append(signal) {
        this.#signals.push(signal);
    }
    static clear() {
        this.#signals = [];
    }
}

class Timer {
    #handler;
    #delay;
    #params;
    #timeoutId;
    constructor(handler, delay) {
        this.#handler = handler;
        this.#delay = delay;
        this.#params = [];
    }
    setParams(...params) {
        this.#params = params;
    }
    start() {
        this.#timeoutId = setTimeout(this.#handler, this.#delay, ...this.#params);
    }
    reset() {
        clearTimeout(this.#timeoutId);
        this.#params = [];
        this.#timeoutId = null;
    }
}

// class Processor {
//     static initialize() {

//     }
// }
let currentSignal = null;
let interruptSignal = null;
const isHolding = { '.': false, '-': false };

const keyToSignal = {
    'ArrowLeft': new Signal('.'),
    'ArrowUp': new Signal('-')
};
window.addEventListener('keydown', e => {
    if (e.repeat) { return; }
    const signal = keyToSignal[e.key];
    if (signal) {
        isHolding[signal] = true;
        if (!currentSignal) { execute(signal); }
        else if (!signal.equals(currentSignal)) { interruptSignal = signal; }
    }
    switch (e.key) {
        case 'Delete': //todo
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
window.addEventListener('keyup', e => {
    const signal = keyToSignal[e.key];
    if (signal) { isHolding[signal] = false; }
});

const signalTimer = new Timer(() => {
    const nextSignal = interruptSignal ? interruptSignal : isHolding[currentSignal] ? currentSignal : null;
    currentSignal = null;
    interruptSignal = null;
    if (nextSignal) { execute(nextSignal); }
}, signalGap);

const letterTimer = new Timer(() => {
    const character = Converter.toCharacter(SignalBuffer.morseCode) ?? '[?]';
    document.getElementById('output').textContent += character.toUpperCase();
    SignalBuffer.clear();
}, letterGap);

const wordTimer = new Timer(() => {
    document.getElementById('output').textContent += ' ';
}, wordGap);

const timers = [signalTimer, letterTimer, wordTimer];

async function execute(signal) {
    currentSignal = signal;
    const { invertedSignal } = signal;
    if (isHolding[invertedSignal]) { interruptSignal = invertedSignal; }
    timers.forEach(timer => timer.reset());
    await Beep.play(signal.duration);
    SignalBuffer.append(signal);
    timers.forEach(timer => timer.start());
}

document.getElementById('play-example').addEventListener('click', () => {
    const text = document.getElementById('example-text').value;
    const normalizedText = getNormalizedText(text);
    const characters = [...normalizedText];
    play();

    async function play(index = 0) {
        if (index >= characters.length) { return; }
        const character = characters[index];
        const signals = Converter.toMorseCode(character);
        if (signals) {
            for (const signal of signals) {
                const duration = signal === '.' ? dotDuration : dashDuration;
                await Beep.play(duration);
                await wait(signalGap);
            }
            if (characters[index + 1]) {
                await wait(letterGap);
                play(index + 1);
            }
        } else {
            setTimeout(play, wordGap, index + 1);
        }
    }
});

function wait(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

class Player {
    #isPlaying = false;
    set(morseCode) {

    }
    play() {
        this.#isPlaying = true;
        const signal = signals[wordIndex][letterIndex][signalIndex];
        const word = signals[wordIndex];
        if (word) {
            const letter = word[letterIndex];
            if (letter) {
                const signal = letter[signalIndex];
                if (signal) {
                    playBeep(signal);
                    wait(signalGap);
                }
            } else {
                wait(letterGap);
                play();
            }
        }

        words.slice(wordIndex).forEach((word, wordIndex) => {

        });

        signalIndex++;
        gap = signalGap;
        if (signalIndex === signals.length) {
            signalIndex = 0;
            letterIndex++;
            gap = letterGap;
            if (letterIndex === letters.length) {
                letterIndex = 0;
                wordIndex++;
                gap = wordGap;
                if (wordIndex === words.length) {
                    // break;
                }
            }
        }

        const words = ['apple', 'banana'];
        let wordIndex = 0, letterIndex = 0, signalIndex = 0;

        for (; wordIndex < words.length; wordIndex++) {
            const letters = words[wordIndex];
            for (; letterIndex < letters.length; letterIndex++) {
                const signals = letters[j];
                for (; signalIndex < signals.length; signalIndex++) {
                    if (gap) { wait(gap); }
                    const signal = signals[j];
                    playBeep(signal);
                    gap = signalGap;
                }
                gap = letterGap;
            }
            gap = wordGap;
        }

        const signal2 = signals[wordIndex][letterIndex][++signalIndex] ?? signals[wordIndex][++letterIndex][signalIndex = 0] ?? signals[++wordIndex][letterIndex = 0][signalIndex = 0];
    }
}

// class Player {
//     #wordIndex = 0;
//     #letterIndex = 0;
//     #signalIndex = 0;
//     #words = [];
//     set(text) {
//         this.#words = text;
//     }
//     async play(text) {
//         let gap = null;

//         const signal = signals[this.#wordIndex][this.#letterIndex][this.#signalIndex];

//         for (; this.#wordIndex < this.#words.length; this.#wordIndex++) {
//             const letters = this.#words[this.#wordIndex];
//             for (; this.#letterIndex < letters.length; this.#letterIndex++) {
//                 const signals = letters[this.#letterIndex];
//                 for (; this.#signalIndex < signals.length; this.#signalIndex++) {
//                     if (gap) { wait(gap); }
//                     const signal = signals[this.#signalIndex];
//                     playBeep(signal);
//                     gap = signalGap;
//                 }
//                 gap = letterGap;
//             }
//             gap = wordGap;
//         }
//     }
//     pause() {

//     }
//     stop() {
//         this.#wordIndex = this.#letterIndex = this.#signalIndex = 0;
//     }

//     #processStep() {
//         if (paused) return;

//         if (wordIndex >= words.length) {
//             console.log("終了");
//             return;
//         }

//         const letters = words[wordIndex];
//         const signals = letters[letterIndex];

//         if (signalIndex < signals.length) {
//             // 信号処理
//             playBeep(signals[signalIndex]);
//             signalIndex++;
//             wait(signalGap);

//         } else {
//             // 信号が終わった → 次の文字へ
//             signalIndex = 0;
//             letterIndex++;
//             if (letterIndex < letters.length) {
//                 wait(letterGap);
//             } else {
//                 // 文字が終わった → 次の単語へ
//                 letterIndex = 0;
//                 wordIndex++;
//                 if (wordIndex < words.length) {
//                     wait(wordGap);
//                 }
//             }
//         }

//         // 次のステップをスケジュール
//         setTimeout(processStep, 0);
//     }
// }

{
    const words = [];
    const letters = [];
    let wordIndex = 0;
    let letterIndex = 0;
    async function play(sentence) {

    }
}


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
    const useSymbol = false; //記号を含めるか
    const wordNum = 1; //単語数(１のときは重複を除外した配列を使う)

    const dotDuration = 100;
    const dashDuration = dotDuration * 3;
    const signalGap = dotDuration;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

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
            normalizedText = getNormalizedText(word);
            document.getElementById('answer').textContent = normalizedText;
        } else {
            const [text, reference] = await getText(wordNum);
            normalizedText = getNormalizedText(text);
            const referenceText = createReferenceText(reference);
            document.getElementById('answer').textContent = `${normalizedText} (${referenceText})`;
        }
        const characters = [...normalizedText];
        play();

        async function play(index = 0) {
            if (index >= characters.length) { return; }
            const character = characters[index];
            const signals = Converter.toMorseCode(character);
            if (signals) {
                for (const signal of signals) {
                    const duration = signal === '.' ? dotDuration : dashDuration;
                    await Beep.play(duration);
                    await wait(signalGap);
                }
                if (characters[index + 1]) {
                    await wait(letterGap);
                    play(index + 1);
                }
            } else {
                setTimeout(play, wordGap, index + 1);
            }
        }
    });

    document.getElementById('listen-again').addEventListener('click', () => {
        // if (!recentlyNormalizedText) { return; }
        // const normalizedText = recentlyNormalizedText;
        if (!normalizedText) { return; }
        const characters = [...normalizedText];
        play();

        async function play(index = 0) {
            if (index >= characters.length) { return; }
            const character = characters[index];
            const signals = Converter.toMorseCode(character);
            if (signals) {
                for (const signal of signals) {
                    const duration = signal === '.' ? dotDuration : dashDuration;
                    await Beep.play(duration);
                    await wait(signalGap);
                }
                if (characters[index + 1]) {
                    await wait(letterGap);
                    play(index + 1);
                }
            } else {
                setTimeout(play, wordGap, index + 1);
            }
        }
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
document.getElementById('volume').addEventListener('input', e => Beep.setVolume(e.target.valueAsNumber));
document.getElementById('clear-output').addEventListener('click', () => document.getElementById('output').textContent = '');

//初期化------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.getElementById('convert-mode').append(...Object.entries(Converter.MODE).map(([value, [text]]) => value === defaultConvertMode ? new Option(text, value, true, true) : new Option(text, value)));
// document.getElementById('convert-mode').append(...Object.keys(Converter.MODE).map(convertMode => convertMode === defaultConvertMode ? new Option(text, value, true, true) : new Option(text, value)));

document.getElementById('convert-mode').dispatchEvent(new Event('change'));
document.getElementById('volume').dispatchEvent(new Event('input'));

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
