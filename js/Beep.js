export default class Beep {
    static #audioCtx;
    static #timeoutId2;
    static #frequency = 770;
    static #gain;
    static play(duration) {
        return new Promise(resolve => {
            if (!this.#audioCtx) { this.#audioCtx = new AudioContext(); }
            const oscillator = new OscillatorNode(this.#audioCtx, { type: 'sawtooth', frequency: this.#frequency });
            oscillator.onended = () => resolve();
            const gainNode = new GainNode(this.#audioCtx, { gain: this.#gain });
            oscillator.connect(gainNode).connect(this.#audioCtx.destination);
            oscillator.start();
            oscillator.stop(this.#audioCtx.currentTime + duration / 1000);
        });
    }
    // static async play(duration) {
    //     try {
    //         // if (this.#audioCtx && this.#audioCtx.state === 'suspended') { this.#audioCtx.close(); }
    //         // if (!this.#audioCtx) { this.#audioCtx = new AudioContext(); }
    //         // this.#audioCtx.close();
    //         // this.#audioCtx = new AudioContext();
    //         clearTimeout(this.#timeoutId2);
    //         let audioCtx = new AudioContext();
    //         // document.getElementById('log').append(this.#audioCtx.state[0]);
    //         // document.getElementById('log').append(1);
    //         // if (this.#audioCtx.state === 'suspended') {
    //         //     document.getElementById('log').append(2);
    //         //     await this.#audioCtx.resume();
    //         // }
    //         // document.getElementById('log').append(this.#audioCtx.state[0]);
    //         // document.getElementById('log').append(3);
    //         return new Promise(resolve => {
    //             // document.getElementById('log').append(4);
    //             const oscillator = new OscillatorNode(audioCtx, { type: 'sawtooth', frequency: this.#frequency });
    //             const timeoutId = setTimeout(async () => {
    //                 document.getElementById('log').append('[timeout-resolve]');
    //                 await audioCtx.close();
    //                 audioCtx = null;
    //                 resolve();
    //             }, duration + 100);
    //             oscillator.onended = () => {
    //                 // document.getElementById('log').append('[onended]');
    //                 this.#timeoutId2 = setTimeout(async () => {
    //                     await audioCtx.close();
    //                     audioCtx = null;
    //                 }, 1000);
    //                 clearTimeout(timeoutId);
    //                 resolve();
    //             }
    //             const gainNode = new GainNode(audioCtx, { gain: this.#gain });
    //             oscillator.connect(gainNode).connect(audioCtx.destination);
    //             oscillator.start();
    //             oscillator.stop(audioCtx.currentTime + duration / 1000);
    //             // document.getElementById('log').append(5);
                
    //         });
    //     } catch {
    //         // document.getElementById('log').append('[innercatch]');
    //     }
    // }
    static setVolume(volume) {
        this.#gain = volume * 0.0006;
    }
}
