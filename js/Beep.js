export default class Beep {
    static #isPlaying = false;
    static #closeAudioCtxTimeoutId;
    static #CLOSE_AUDIO_CTX_TIMEOUT = 5000;
    static #audioCtx;
    static #oscillatorNode;
    static #waveform = 'sawtooth';
    static #frequency = 880;
    static #gainNode;
    static #gain = 0;
    static #volume = 0;
    static #VOLUME_SCALE_FACTOR = 0.0006;
    static play(duration) {
        if (this.#isPlaying) { return Promise.resolve(); }
        this.#isPlaying = true;
        clearTimeout(this.#closeAudioCtxTimeoutId);

        if (!this.#audioCtx) { this.#initializeAudioCtx(); }
        return new Promise(resolve => {
            const oscillatorNode = this.#oscillatorNode = new OscillatorNode(this.#audioCtx, { type: this.#waveform, frequency: this.#frequency });
            oscillatorNode.onended = () => {
                this.#isPlaying = false;
                this.#closeAudioCtxTimeoutId = setTimeout(async () => {
                    await this.#audioCtx.close();
                    this.#audioCtx = null;
                }, this.#CLOSE_AUDIO_CTX_TIMEOUT);
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
        this.#gain = this.#volume * this.#VOLUME_SCALE_FACTOR;
        if (this.#gainNode) { this.#gainNode.gain.value = this.#gain; }
    }
    static getSettings() {
        return { waveform: this.#waveform, frequency: this.#frequency, volume: this.#volume };
    }
    static #initializeAudioCtx() {
        this.#audioCtx = new AudioContext();
        this.#audioCtx.onstatechange = async e => {
            if (e.target.state === 'interrupted') {
                this.#gainNode.gain.value = 0;
                await e.target.resume(); //再開しないとstopが効かない
                this.#oscillatorNode.stop();
                this.#gainNode.gain.value = this.#gain;
            }
        };
        this.#gainNode = new GainNode(this.#audioCtx, { gain: this.#gain });
    }
}
