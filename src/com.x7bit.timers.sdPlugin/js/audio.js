/// <reference path="helper.js" />

class AudioHandler {

  constructor(settings) {
    this.loadState(settings, true);
  }

  loadState(settings, isInit) {
    if (isInit) {
      this.audioTimeoutId = null;
    } else if (this.isPlaying()) {
      this.stop();
    }

    const id = getStringSetting(settings, 'audio-id', 'gong');
    const volume = getIntegerSetting(settings, 'audio-volume', 100) / 100;
    const loops = getIntegerSetting(settings, 'audio-loops', 1);

    if (isInit || this.id !== id) {
      this.id = id;
      this.audio = id === 'none' ? null : new Audio(`${path}/${id}.mp3`);
    }

    if (isInit || this.volume !== volume) {
      this.volume = volume;
      if (this.audio) {
        this.audio.volume = volume;
      }
    }

    if (isInit || this.loops !== loops) {
      this.loops = loops;
      if (this.audio) {
        this.audio.loop = loops > 1;
      }
    }
  }

  isPlaying() {
    return this.audioTimeoutId !== null;
  }

  play() {
    if (this.audio) {
      this.audio.play();
      this.audioTimeoutId = setTimeout(() => {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audioTimeoutId = null;
      }, this.audio.duration * this.loops * 1000);
    }
	}

	stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audioTimeoutId = null;
    }
	}

}