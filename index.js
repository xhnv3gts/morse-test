import Beep from './js/Beep.js';
import IambicKeyer from './js/IambicKeyer.js';
import Converter from './js/Converter.js';

//設定
const dotDuration = 50;
const defaultConvertMode = Converter.DECODING_MODE.EN_ONLY;
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

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        Player.stop();
    }
});

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
        const character = Converter.morseCodeToText(morseCode) ?? '[?]';
        output.textContent += character.toUpperCase();
        signals.length = 0;
    }, letterSpace);
    timeoutId2 = setTimeout(() => {
        output.textContent += ' ';
    }, wordSpace);
};
document.getElementById('clear-output').addEventListener('click', () => output.textContent = '');

//受信練習------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
import BibleData from './js/BibleData.js';
import { getData } from './js/utils.js';

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
        const morseCode = Converter.textToMorseCode(text);
        this.#signals = morseCode.split(Converter.WORD_SEPARATOR).map(mcWord => {
            return mcWord.split(Converter.CHARACTER_SEPARATOR).map(mcCharacter => {
                return mcCharacter.split('')
            })
        })
        // this.#signals = textToSignals(text);
        this.#resetIndex();
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

const player = new Player(dotDuration);
document.getElementById('play-example').addEventListener('click', () => {
    const text = document.getElementById('example-text').value;
    player.set(text);
    player.play();
});


{
    const player2 = new Player(dotDuration);
    const useSymbol = false; //記号を含めるか
    const wordNum = 2; //単語数(１のときは重複を除外した配列を使う)

    let text2;

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
            const word = await BibleData.getRandomWord();
            player2.set(word);
            text2 = word;
            document.getElementById('answer').textContent = word;
        } else {
            const [text, reference] = await BibleData.getText(wordNum);
            console.log(text);
            player2.set(text);
            text2 = text;
            const referenceText = createReferenceText(reference);
            document.getElementById('answer').textContent = `${text} (${referenceText})`;
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
    Converter.setDecodingMode(e.target.value);
});

//初期化------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

document.getElementById('convert-mode').append(...Object.values(Converter.DECODING_MODE).map(value => {
    const text = {
        [Converter.DECODING_MODE.EN_FIRST]: '欧文優先',
        [Converter.DECODING_MODE.EN_ONLY]: '欧文のみ',
        [Converter.DECODING_MODE.JA_FIRST]: '和文優先',
        [Converter.DECODING_MODE.JA_ONLY]: '和文のみ',
    }[value];
    return value === defaultConvertMode ? new Option(text, value, true, true) : new Option(text, value);
}));

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

// let morseCodeGV;
// document.getElementById('test1').addEventListener('click', () => {
//     morseCodeGV = Converter.textToMorseCode('abc de f');
//     document.getElementById('log').textContent = morseCodeGV;
// })


// document.getElementById('test2').addEventListener('click', () => {
//     const text = Converter.morseCodeToText('.- ...-|. -..');
//     document.getElementById('log').textContent = text;
// })
