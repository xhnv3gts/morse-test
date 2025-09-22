import Beep from './Beep.js';

export default class IambicKeyer {
    static onsignalstart;
    static onsignalend;
    static onlettercommit;
    static onwordcommit;
    static #keyToSignal = {};
    static #signalDuration;
    static #signalSpace;
    static #letterSpace;
    static #wordSpace;
    static #currentSignal;
    static #nextSignal;
    static #isHolding = {};
    static #timeoutId1;
    static #timeoutId2;
    static initialize(dotKey, dashKey, dotDuration) {
        this.#keyToSignal = { [dotKey]: '.', [dashKey]: '-' };
        this.#signalDuration = { '.': dotDuration, '-': dotDuration * 3 };
        this.#signalSpace = dotDuration;
        this.#letterSpace = dotDuration * 3;
        this.#wordSpace = dotDuration * 7;
    }
    static async #process(signal) {
        clearTimeout(this.#timeoutId1);
        clearTimeout(this.#timeoutId2);
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
        
        this.#timeoutId1 = setTimeout(() => this.onlettercommit?.(), this.#letterSpace);
        this.#timeoutId2 = setTimeout(() => this.onwordcommit?.(), this.#wordSpace);
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
