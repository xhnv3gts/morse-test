import Beep from './js/Beep.js';
import IambicKeyer from './js/IambicKeyer.js';
import MorseCodeConverter from './js/MorseCodeConverter.js';

//設定
const dotDuration = 50;
const defaultConvertMode = MorseCodeConverter.DECODING_MODE.EN_ONLY;
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
    // clearTimeout(timeoutId1);
    // clearTimeout(timeoutId2);
    signals.push(signal);
};
// IambicKeyer.onsignalend = () => {
//     timeoutId1 = setTimeout(() => {
//     }, letterSpace);
//     timeoutId2 = setTimeout(() => {
//         output.textContent += ' ';
//     }, wordSpace);
// };
IambicKeyer.onlettercommit = () => {
    const morseCode = signals.join('');
    const character = MorseCodeConverter.morseCodeToText(morseCode, defaultConvertMode) ?? '[?]';
    output.textContent += character.toUpperCase();
    signals.length = 0;
}
IambicKeyer.onwordcommit = () => {
    output.textContent += ' ';
}
document.getElementById('clear-output').addEventListener('click', () => output.textContent = '');

//イベントリスナー追加------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// document.getElementById('decoding-mode').addEventListener('change', e => {
//     const mode = e.target.value;
//     MorseCodeConverter.setDecodingMode(e.target.value);
// });

//初期化------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

document.getElementById('decoding-mode').append(...Object.values(MorseCodeConverter.DECODING_MODE).map(value => {
    const text = {
        [MorseCodeConverter.DECODING_MODE.EN_FIRST]: '欧文優先',
        [MorseCodeConverter.DECODING_MODE.EN_ONLY]: '欧文のみ',
        [MorseCodeConverter.DECODING_MODE.JA_FIRST]: '和文優先',
        [MorseCodeConverter.DECODING_MODE.JA_ONLY]: '和文のみ',
    }[value];
    return value === defaultConvertMode ? new Option(text, value, true, true) : new Option(text, value);
}));

document.getElementById('decoding-mode').dispatchEvent(new Event('change'));
