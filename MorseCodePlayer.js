import Beep from './Beep.js';
import Converter from './Converter.js';
import MorseCode from './MorseCode.js';

export default class MorseCodePlayer {
    static #isPlaying = false;
    static #processTimeoutId;
    static stop() {
        if (this.#isPlaying) {
            MorseCodePlayer.#isBeepCanceled = true;
            Beep.stop();
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
    #hasText = false;
    set(text) {
        this.#hasText = true;
        const morseCode = MorseCode.fromText(text);
        this.#signals = morseCode.toSignals();
        // this.#signals = textToSignals(text);
        this.#resetIndex();
    }
    get hasText() { return this.#hasText; }
    play() {
        this.#resetIndex();
        MorseCodePlayer.#isPlaying = true;
        MorseCodePlayer.#isBeepCanceled = false;
        this.#process();
    }
    #resetIndex() {
        this.#wordIndex = this.#letterIndex = this.#signalIndex = 0;
    }
    async #process() {
        const signal = this.#signals[this.#wordIndex][this.#letterIndex][this.#signalIndex];
        if (signal) {
        const signalDuration = this.#signalDuration[signal];
        await Beep.play(signalDuration);
        if (MorseCodePlayer.#isBeepCanceled) {
            return;
        }
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
            MorseCodePlayer.#processTimeoutId = setTimeout(() => this.#process(), space);
        } else {
            MorseCodePlayer.#isPlaying = false;
        }

    }
    #setDurationAndSpace(dotDuration) {
        this.#signalDuration = { '.': dotDuration, '-': dotDuration * 3 };
        this.#signalSpace = dotDuration;
        this.#letterSpace = dotDuration * 3;
        this.#wordSpace = dotDuration * 7;
    }
}
