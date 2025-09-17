import Beep from './js/Beep.js';
import BibleData from './js/BibleData.js';
import MorseCodePlayer from './js/MorseCodePlayer.js';
import MorseCode from './js/MorseCode.js';
import { getSettings, registerShortcutKey } from './js/utils.js';


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const settings2 = {
    'common': {
        'Beep': {
            'volume': 50
        }
    },
    'receividng-practice.html': {
        'Beep': {
            'volume': 30
        },
        'dotDuration': 50
    }
};
const commonSettings = settings2.common;
const localSettings = settings2[window.location.pathname.split('/').at(-1) || 'index.html'];
const me2 = deepMerge(commonSettings, localSettings);
console.log(me2);

function deepMerge(target, source) {
    if (source === undefined) {
        return target;
    }

    // source がオブジェクトなら再帰的に処理
    if (typeof source === 'object' && source !== null && !Array.isArray(source)) {
        if (typeof target !== 'object' || target === null || Array.isArray(target)) {
            target = {};
        }
        for (const key of Object.keys(source)) {
            target[key] = deepMerge(target[key], source[key]);
        }
        return target;
    }

    // source が配列なら上書き（JSON なので配列のマージ規則は通常「置き換え」）
    if (Array.isArray(source)) {
        return [...source];
    }

    // プリミティブ値ならそのまま上書き
    return source;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const settings = await getSettings('./data/settings.json');

if (settings.Beep?.waveform !== undefined) { Beep.setWaveform(settings.Beep.waveform); }
if (settings.Beep?.frequency !== undefined) { Beep.setFrequency(settings.Beep.frequency); }
if (settings.Beep?.volume !== undefined) { Beep.setVolume(settings.Beep.volume); }
document.getElementById('volume').value = Beep.volume;

// settings.shortcutKeys?.forEach(({ modifierKey, key, buttonId }) => {

// })();
settings.shortcutKeys?.forEach(registerShortcutKey);
// registerShortcutKey({ modifierKey: 'ctrlKey', key: 'ArrowUp', keyText: '↑', buttonId: 'practice-receiving' });
// registerShortcutKey({ modifierKey: 'ctrlKey', key: 'ArrowUp', keyText: '↑', buttonId: 'practice-receiving' });
// registerShortcutKey({ modifierKey: 'ctrlKey', key: 'ArrowUp', keyText: '↑', buttonId: 'practice-receiving' });

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        MorseCodePlayer.stop();
    }
});
document.getElementById('volume').addEventListener('input', e => Beep.setVolume(e.target.valueAsNumber));

BibleData.setDirectoryPath('./data/kjv/');
const player = new MorseCodePlayer(settings.dotDuration);
const useSymbol = false; //記号を含めるか
const wordNum = 1; //単語数(１のときは重複を除外した配列を使う)
const maxWords = 1;

const answerDisplay = document.getElementById('answer');
document.getElementById('practice-receiving').addEventListener('click', async () => {
    answerDisplay.style.visibility = 'hidden';
    if (wordNum === 1) {
        const word = await BibleData.getRandomWord();
        player.set(word);
        answerDisplay.textContent = word;
    } else {
        const { text, reference } = await BibleData.getText(wordNum);
        player.set(text);
        const referenceText = `${reference.bookName} ${reference.chapterNo}:${reference.verseNo}`;
        answerDisplay.textContent = `${text} (${referenceText})`;
    }
    player.play();
});
document.getElementById('listen-again').addEventListener('click', () => {
    if (!player.hasText) { return; }
    player.play();
});
document.getElementById('show-answer').addEventListener('click', () => {
    answerDisplay.style.visibility = 'visible';
});


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

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', e => {
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
});

canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
});

canvas.addEventListener('pointerup', () => {
    drawing = false;
});

canvas.addEventListener('pointerleave', () => {
    drawing = false;
});

document.getElementById('clear-canvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景が白必要な場合は再度塗る
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});
