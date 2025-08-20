import Beep from './Beep.js';

class Signal {
    #signal;
    constructor(signal) {
        this.#signal = signal;
    }
    toString() { return this.#signal; }
    get oppositeSignal() { return new Signal({ '.': '-', '-': '.' }[this.#signal]); }
    equals(signal) { return this.toString() === signal.toString(); }
}

export default class IambicKeyer {
    static onsignalstart;
    static onsignalend;
    static #keyToSignal = {};
    static #signalDuration;
    static #signalSpacing;
    static #currentSignal;
    static #nextSignal;
    static #isHolding = {};
    static initialize(dotKey, dashKey, dotDuration) {
        this.#keyToSignal = { [dotKey]: new Signal('.'), [dashKey]: new Signal('-') };
        this.#signalDuration = { '.': dotDuration, '-': dotDuration * 3 };
        this.#signalSpacing = dotDuration;
    }
    static async #process(signal) {
        this.onsignalstart?.(signal);

        const currentSignal = this.#currentSignal = signal;
        const oppositeSignal = currentSignal.oppositeSignal;
        this.#nextSignal = this.#isHolding[oppositeSignal] ? oppositeSignal : null;

        const signalDuration = this.#signalDuration[currentSignal];
        await Beep.play(signalDuration);

        this.onsignalend?.();

        setTimeout(() => {
            const nextSignal = this.#nextSignal ?? (this.#isHolding[currentSignal] ? currentSignal : null);
            if (nextSignal) {
                this.#process(nextSignal);
            } else {
                this.#currentSignal = null;
            }
        }, this.#signalSpacing);
    }
    static {
        const isRegisteredKey = key => Object.hasOwn(this.#keyToSignal, key);
        window.addEventListener('keydown', e => {
            if (e.repeat || !isRegisteredKey(e.key)) { return; }
            const signal = this.#keyToSignal[e.key];
            this.#isHolding[signal] = true;
            if (!this.#currentSignal) {
                this.#process(signal);
            } else if (!signal.equals(this.#currentSignal)) {
                this.#nextSignal = signal;
            }
        });
        window.addEventListener('keyup', e => {
            if (!isRegisteredKey(e.key)) { return; }
            const signal = this.#keyToSignal[e.key];
            this.#isHolding[signal] = false;
        });
    }
}
