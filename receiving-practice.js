import Beep from './js/Beep.js';
import BibleData from './js/BibleData.js';
import MorseCodePlayer from './js/MorseCodePlayer.js';
import { getSettings, registerShortcutKey, getRandomSubarray } from './js/utils.js';

const settings = await getSettings();

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


const bookNameSelect = document.getElementById('book-name');
const bookNames = await BibleData.getBookNames();
bookNameSelect.append(new Option('(指定しない)', ''));
bookNames.forEach(bookName => {
    const option = new Option(bookName);
    bookNameSelect.append(option);
});

await updataChapterNoSelect(document.getElementById('book-name').value);

async function updataChapterNoSelect(bookName) {
    const chapterNoSelect = document.getElementById('chapter-no');
    chapterNoSelect.innerHTML = '';
    chapterNoSelect.append(new Option('(指定しない)', ''));

    // const bookName = document.getElementById('book-name').value;
    if (bookName) {
        chapterNoSelect.disabled = false;
        const chapterCount = await BibleData.getChapterCount(bookName);
        for (let i = 1; i <= chapterCount; i++) {
            chapterNoSelect.append(new Option(i));
        }
    } else {
        chapterNoSelect.disabled = true;   
    }

    updataVerseNoSelect(bookName, Number(chapterNoSelect.value));
}
async function updataVerseNoSelect(bookName, chapterNo) {
    const verseNoSelect = document.getElementById('verse-no');
    verseNoSelect.innerHTML = '';
    verseNoSelect.append(new Option('(指定しない)', ''));

    // const bookName = document.getElementById('book-name').value;
    if (chapterNo) {
        verseNoSelect.disabled = false;
        const verseCount = await BibleData.getVerseCount(bookName, chapterNo);
        for (let i = 1; i <= verseCount; i++) {
            verseNoSelect.append(new Option(i));
        }
    } else {
        verseNoSelect.disabled = true;   
    }
}


bookNameSelect.addEventListener('change', e => {
    console.log(e.target.value);
    updataChapterNoSelect(e.target.value);
});
document.getElementById('chapter-no').addEventListener('change', e => {
    console.log(e.target.value);

    updataVerseNoSelect(bookNameSelect.value, e.target.value);
});


const player = new MorseCodePlayer(settings.dotDuration);
const useSymbol = false; //記号を含めるか
const wordNum = 2; //単語数(１のときは重複を除外した配列を使う)
const maxWords = 2;

const answerDisplay = document.getElementById('answer');
document.getElementById('practice-receiving').addEventListener('click', async () => {
    answerDisplay.style.visibility = 'hidden';
    if (wordNum === 1) {
        const word = await BibleData.getRandomWord();
        player.setText(word);
        answerDisplay.textContent = word;
    } else {
        const bookName = bookNameSelect.value || null;
        const chapterNo = Number(document.getElementById('chapter-no').value) || null;
        const verseNo = Number(document.getElementById('verse-no').value) || null;
        const { verse, reference } = await BibleData.getVerse(bookName, chapterNo, verseNo);
        const words = verse.split(' ');
        const text = getRandomSubarray(words, maxWords).join(' ');
        player.setText(text);
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
