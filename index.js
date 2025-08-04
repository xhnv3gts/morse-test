'use strict';

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

{
    const useSymbol = false; //記号を含めるか
    const wordNum = 1; //単語数(１のときは重複を除外した配列を使う)

    const dotDuration = 100;
    const dashDuration = dotDuration * 3;
    const signalGap = dotDuration;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

    const sentences = [];
    (() => { //折り畳み用ブロック
        //１章
        sentences[0] = 'In the beginning God created the heaven and the earth.';
        sentences[1] = 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.';
        sentences[2] = 'And God said, Let there be light: and there was light.';
        sentences[3] = 'And God saw the light, that it was good: and God divided the light from the darkness.';
        sentences[4] = 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.';
        sentences[5] = 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.';
        sentences[6] = 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.';
        sentences[7] = 'And God called the firmament Heaven. And the evening and the morning were the second day.';
        sentences[8] = 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.';
        sentences[9] = 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.';
        sentences[10] = 'And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.';
        sentences[11] = 'And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.';
        sentences[12] = 'And the evening and the morning were the third day.';
        sentences[13] = 'And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years: 1:15 And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.';
        sentences[14] = 'And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.';
        sentences[15] = 'And God set them in the firmament of the heaven to give light upon the earth, 1:18 And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.';
        sentences[16] = 'And the evening and the morning were the fourth day.';
        sentences[17] = 'And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.';
        sentences[18] = 'And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that it was good.';
        sentences[19] = 'And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.';
        sentences[20] = 'And the evening and the morning were the fifth day.';
        sentences[21] = 'And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.';
        sentences[22] = 'And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that it was good.';
        sentences[23] = 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.';
        sentences[24] = 'So God created man in his own image, in the image of God created he him; male and female created he them.';
        sentences[25] = 'And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.';
        sentences[26] = 'And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.';
        sentences[27] = 'And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein there is life, I have given every green herb for meat: and it was so.';
        sentences[28] = 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.';
        //２章
    })();
    const noDuplicateWords = Array.from(new Set(sentences.join(' ').replaceAll(/[,.:;]/g, '').toLowerCase().split(' ')));

    let recentlyNormalizedText = null;

    document.getElementById('practice-reception').addEventListener('click', () => {
        // document.getElementById('answer').style.visibility = 'hidden';
        let word, sentenceIndex;
        if (wordNum === 1) {
            word = noDuplicateWords[getRandomInt(0, noDuplicateWords.length - 1)];
            sentenceIndex = '---- ';
        } else {
            sentenceIndex = getRandomInt(0, sentences.length - 1);
            const sentence = sentences[sentenceIndex];
            const words = sentence.split(' ');
            const limitedWordNum = wordNum > words.length ? words.length : wordNum;
            const wordIndexStart = getRandomInt(0, words.length - limitedWordNum);
            const wordIndexEnd = wordIndexStart + limitedWordNum;
            const wordTmp = words.slice(wordIndexStart, wordIndexEnd).join(' ');
            word = useSymbol ? wordTmp : wordTmp.replaceAll(/[,.:;]/g, '');
        }

        const normalizedText = getNormalizedText(word);
        recentlyNormalizedText = normalizedText;
        document.getElementById('answer').textContent = `${sentenceIndex}: ${normalizedText}`;
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
        if (!recentlyNormalizedText) { return; }
        const normalizedText = recentlyNormalizedText;
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


    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

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
// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');

// // サイズ調整（CSSによる表示サイズに合わせる）
// function resizeCanvas() {
//     canvas.width = canvas.offsetWidth;
//     canvas.height = canvas.offsetHeight;

//     // 白背景を描く（描画内容に含めたい場合）
//     ctx.fillStyle = 'white';
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
// }
// resizeCanvas();
// window.addEventListener('resize', resizeCanvas);

// // 線設定
// ctx.lineCap = 'round';
// ctx.lineWidth = 4;
// ctx.strokeStyle = 'black';

// let drawing = false;
// let lastX = 0;
// let lastY = 0;

// function getCanvasTouchPos(touch) {
//     const rect = canvas.getBoundingClientRect();
//     return {
//         x: touch.clientX - rect.left,
//         y: touch.clientY - rect.top
//     };
// }

// canvas.addEventListener('touchstart', (e) => {
//     e.preventDefault();
//     const touch = e.touches[0];
//     const pos = getCanvasTouchPos(touch);
//     lastX = pos.x;
//     lastY = pos.y;
//     drawing = true;
// }, { passive: false });

// canvas.addEventListener('touchmove', (e) => {
//     if (!drawing) return;
//     e.preventDefault();
//     const touch = e.touches[0];
//     const pos = getCanvasTouchPos(touch);

//     ctx.beginPath();
//     ctx.moveTo(lastX, lastY);
//     ctx.lineTo(pos.x, pos.y);
//     ctx.stroke();

//     lastX = pos.x;
//     lastY = pos.y;
// }, { passive: false });

// canvas.addEventListener('touchend', () => {
//     drawing = false;
// });
// canvas.addEventListener('touchcancel', () => {
//     drawing = false;
// });

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
    document.body.append('touchstart');
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
    document.body.append('touchmove');
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
