/// <reference path="settings.js" />

class AudioHandler {

	/**
	 * 
	 * @param {Object} settings
	 * @param {?Function} customErrorFunc
	 */
	constructor(settings, customErrorFunc = null) {
		this.audio = null;
		this.remLoops = 0;
		this.isPlaying = false;
		this.loadState(settings, customErrorFunc);
	}

	/**
	 * 
	 * @param {Object} settings
	 * @param {?Function} customErrorFunc
	 */
	loadState(settings, customErrorFunc = null) {
		this.id = getStringSetting(settings, 'audioId', 'gong');
		this.loops = getIntegerSetting(settings, 'audioLoops', 1);
		this.volume = getIntegerSetting(settings, 'audioVolume', 100);
		this.customFile = getStringSetting(settings, 'customFile', null);
		const isCustom = this.id === 'custom';
		if (this.id === 'none' || (isCustom && !this.customFile)) {
			this.stopIfPlaying();
			this.audio = null;
			return;
		}
		const customSrc = `file:///${this.customFile}`;
		if (!this.audio || (!isCustom && this.audio.id !== this.id) || (isCustom && this.audio.src !== customSrc)) {
			this.stopIfPlaying();
			this.audio = isCustom ? new Audio(customSrc) : document.getElementById(this.id);
			if (isCustom && customErrorFunc) {
				this.audio.onerror = customErrorFunc;
			}
		}
		this.audio.volume = this.volume / 100;
	}

	getSaveState() {
		return {
			audioId: this.id,
			audioLoops: this.loops,
			audioVolume: this.volume,
			customFile: this.customFile,
		};
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