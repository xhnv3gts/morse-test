import Beep from './js/Beep.js';
import BibleData from './js/BibleData.js';
import MorseCodePlayer from './js/MorseCodePlayer.js';
import { getSettings, registerShortcutKey, getRandomSubarray } from './js/utils.js';


const settings = await getSettings();

await BibleData.initialize();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) { MorseCodePlayer.stop(); }
});

{
    if (settings.Beep?.waveform !== undefined) { Beep.setWaveform(settings.Beep.waveform); }
    if (settings.Beep?.frequency !== undefined) { Beep.setFrequency(settings.Beep.frequency); }
    if (settings.Beep?.volume !== undefined) { Beep.setVolume(settings.Beep.volume); }
    document.getElementById('volume').addEventListener('input', e => Beep.setVolume(e.target.valueAsNumber));
    document.getElementById('volume').value = Beep.volume;
} {
    document.getElementById('book-name').addEventListener('change', async e => {
        const select = document.getElementById('chapter-no');
        initializeSelect(select);
        const bookName = e.target.value;
        if (bookName) {
            const chapterCount = BibleData.getChapterCount(bookName);
            select.append(...Array.from({ length: chapterCount }, (_, i) => new Option(i + 1)));
            select.disabled = false;
        } else {
            select.disabled = true;
        }
        select.dispatchEvent(new Event('change'));
    });
    document.getElementById('chapter-no').addEventListener('change', async e => {
        const select = document.getElementById('verse-no');
        initializeSelect(select);
        const chapterNo = Number(e.target.value);
        if (chapterNo) {
            const bookName = document.getElementById('book-name').value;
            const verseCount = BibleData.getVerseCount(bookName, chapterNo);
            select.append(...Array.from({ length: verseCount }, (_, i) => new Option(i + 1)));
            select.disabled = false;
        } else {
            select.disabled = true;
        }
    });

    const bookNames = BibleData.getBookNames();
    document.getElementById('book-name').append(createNoSelectionOption(), ...bookNames.map(bookName => new Option(bookName)));
    document.getElementById('book-name').dispatchEvent(new Event('change'));

    function initializeSelect(select) {
        while (select.lastChild) { select.removeChild(select.lastChild); }
        select.append(createNoSelectionOption());
    }
    function createNoSelectionOption() {
        return new Option('(指定しない)', '');
    }
} {
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
            const bookName = document.getElementById('book-name').value || null;
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
}


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



settings.shortcutKeys?.forEach(registerShortcutKey);
