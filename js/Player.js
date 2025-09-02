import Beep from './Beep.js';
import Converter from './Converter.js';

export default class Player {
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
