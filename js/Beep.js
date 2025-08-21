export default class Beep {
    static #isPlaying = false;
    static #audioCtx = new AudioContext();
    static #oscillatorNode;
    static #waveform = 'sawtooth';
    static #frequency = 900;
    static #gainNode = new GainNode(this.#audioCtx, { gain: 0 });
    static #volume = 0;
    static #VOLUME_SCALE_FACTOR = 0.0006;
    static play(duration) {
        if (this.#isPlaying) { return Promise.resolve(); }
        this.#isPlaying = true;
        return new Promise(resolve => {
            const oscillatorNode = this.#oscillatorNode = new OscillatorNode(this.#audioCtx, { type: this.#waveform, frequency: this.#frequency });
            oscillatorNode.onended = () => {
                this.#isPlaying = false;
                resolve();
            };
            oscillatorNode.connect(this.#gainNode).connect(this.#audioCtx.destination);
            oscillatorNode.start();
            oscillatorNode.stop(this.#audioCtx.currentTime + duration / 1000);
        });
    }
    static cancel() {
        if (this.#isPlaying) { this.#oscillatorNode.stop(); }
    }
    static setWaveform(waveform) {
        this.#waveform = waveform;
        if (this.#isPlaying) { this.#oscillatorNode.type = waveform; }
    }
    static setFrequency(frequency) {
        this.#frequency = frequency;
        if (this.#isPlaying) { this.#oscillatorNode.frequency.value = frequency; }
    }
    static setVolume(volume) {
        this.#volume = (!Number.isInteger(volume) || volume < 0) ? 0 : (volume > 100) ? 100 : volume;
        this.#gainNode.gain.value = this.#volume * this.#VOLUME_SCALE_FACTOR;
    }
    static getSettings() {
        return { waveform: this.#waveform, frequency: this.#frequency, volume: this.#volume };
    }
}



    // static #timeoutId2;
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