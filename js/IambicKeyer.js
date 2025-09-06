import Beep from './Beep.js';

export default class IambicKeyer {
    static onsignalstart;
    static onsignalend;
    static #keyToSignal = {};
    static #signalDuration;
    static #signalSpace;
    static #currentSignal;
    static #nextSignal;
    static #isHolding = {};
    static initialize(dotKey, dashKey, dotDuration) {
        this.#keyToSignal = { [dotKey]: '.', [dashKey]: '-' };
        this.#signalDuration = { '.': dotDuration, '-': dotDuration * 3 };
        this.#signalSpace = dotDuration;
    }
    static async #process(signal) {
        this.onsignalstart?.(signal);

        const currentSignal = this.#currentSignal = signal;
        const oppositeSignal = { '.': '-', '-': '.' }[currentSignal];
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
        }, this.#signalSpace);
    }
    static {
        const isRegisteredKey = key => Object.hasOwn(this.#keyToSignal, key);
        window.addEventListener('keydown', e => {
            if (e.repeat || !isRegisteredKey(e.key)) { return; }
            const signal = this.#keyToSignal[e.key];
            this.#isHolding[signal] = true;
            if (!this.#currentSignal) {
                this.#process(signal);
            } else if (signal !== this.#currentSignal) {
                this.#nextSignal = signal;
            }
        });
        window.addEventListener('keyup', e => {
            if (!isRegisteredKey(e.key)) { return; }
            const signal = this.#keyToSignal[e.key];
            this.#isHolding[signal] = false;
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.#isHolding['.'] = false;
                this.#isHolding['-'] = false;
            }
        });
    }
}
