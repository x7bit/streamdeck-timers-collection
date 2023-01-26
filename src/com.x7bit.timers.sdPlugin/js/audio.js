/// <reference path="helper.js" />

class AudioHandler {

	constructor(settings) {
		this.audio = null;
		this.loops = 1;
		this.remLoops = 0;
		this.loadState(settings, true);
	}

	loadState(settings) {
		const id = getStringSetting(settings, 'audio-id', 'gong');
		if (id === 'none') {
			this.audio = null;
			return;
		}
		if (!this.audio || this.audio.id !== id) {
			if (this.isPlaying()) {
				this.stop();
			}
			this.audio = document.getElementById(id);
			this.audio.loop = true;
		}
		this.audio.volume = getIntegerSetting(settings, 'audio-volume', 100) / 100;
		this.loops = getIntegerSetting(settings, 'audio-loops', 1);
	}

	isPlaying() {
		return this.audio && (!this.audio.paused || this.remLoops > 0);
	}

	play() {
		if (this.audio) {
			this.stop();
			this.remLoops = this.loops;
			this.audio.ontimeupdate = () => {
				if (this.audio.currentTime == 0) {
					this.remLoops--;
				}
				if (this.remLoops <= 0) {
					this.stop();
				}
			};
			this.audio.play();
		}
	}

	stop() {
		if (this.isPlaying()) {
			this.audio.pause();
			this.audio.ontimeupdate = null;
			this.audio.currentTime = 0;
			this.remLoops = 0;
		}
	}

}