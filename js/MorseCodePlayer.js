import Beep from './Beep.js';
import MorseCodeConverter from './MorseCodeConverter.js'

export default class MorseCodePlayer {
    static #isPlaying = false;
    static #processTimeoutId;
    static stop() {
        if (!this.#isPlaying) { return; }
        this.#isPlaying = false;
        Beep.stop();
        clearTimeout(this.#processTimeoutId);
    }

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
    setText(text) {
        if (MorseCodePlayer.#isPlaying) { return; }
        this.#hasText = true;
        const morseCode = MorseCodeConverter.textToMorseCode(text);
        if (!morseCode) { return false; }
        this.#signals = MorseCodeConverter.structureMorseCode(morseCode);
        this.#resetIndex();
        return true;
    }
    get hasText() { return this.#hasText; }
    play() {
        if (MorseCodePlayer.#isPlaying) { return; }
        MorseCodePlayer.#isPlaying = true;
        this.#resetIndex();
        this.#process();
    }
    #resetIndex() {
        this.#wordIndex = this.#letterIndex = this.#signalIndex = 0;
    }
    async #process() {
        const signal = this.#signals[this.#wordIndex][this.#letterIndex][this.#signalIndex];
        if (signal) {
            const signalDuration = this.#signalDuration[signal];
            const result = await Beep.play(signalDuration);
            if (result !== Beep.COMPLETED) { return; }
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
