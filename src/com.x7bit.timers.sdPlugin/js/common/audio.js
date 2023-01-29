/// <reference path="settings.js" />

class AudioHandler {

	/**
	 * 
	 * @param {Object} settings
	 * @param {?Function} customErrorFunc
	 */
	constructor(settings, customErrorFunc = null) {
		this.audio = null;
		this.loops = 1;
		this.remLoops = 0;
		this.customFile = null;
		this.isPlaying = false;
		this.loadState(settings, customErrorFunc);
	}

	/**
	 * 
	 * @param {Object} settings
	 * @param {?Function} customErrorFunc
	 */
	loadState(settings, customErrorFunc = null) {
		const id = getStringSetting(settings, 'audioId', 'gong');
		const isCustom = id === 'custom';
		this.customFile = getStringSetting(settings, 'customFile');
		this.loops = getIntegerSetting(settings, 'audioLoops', 1);
		if (id === 'none' || (isCustom && !this.customFile)) {
			this.stopIfPlaying();
			this.audio = null;
			return;
		}
		const customSrc = `file:///${this.customFile}`;
		if (!this.audio || (!isCustom && this.audio.id !== id) || (isCustom && this.audio.src !== customSrc)) {
			this.stopIfPlaying();
			this.audio = isCustom ? new Audio(customSrc) : document.getElementById(id);
			if (isCustom && customErrorFunc) {
				this.audio.onerror = customErrorFunc;
			}
		}
		this.audio.volume = getIntegerSetting(settings, 'audioVolume', 100) / 100;
	}

	play() {
		if (this.audio && !isNaN(this.audio.duration)) {
			this.stopIfPlaying();
			this.remLoops = this.loops;
			this.audio.ontimeupdate = () => {
				if (this.audio.currentTime === 0) {
					this.remLoops--;
				}
				if (this.remLoops <= 0) {
					this.stop();
				}
			};
			this.audio.loop = true;
			this.isPlaying = true;
			this.audio.play();
		}
	}

	stop() {
		if (this.audio && !isNaN(this.audio.duration)) {
			this.audio.pause();
			this.audio.ontimeupdate = null;
			this.audio.currentTime = 0;
			this.audio.loop = false;
			this.remLoops = 0;
			this.isPlaying = false;
		}
	}

	stopIfPlaying() {
		if (this.isPlaying) {
			this.stop();
		}
	}

}