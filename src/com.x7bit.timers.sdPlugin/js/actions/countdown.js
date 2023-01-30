/// <reference path="../../libs/js/stream-deck.js" />
/// <reference path="../common/settings.js" />

class CountdownTimer {

	constructor(context, settings) {
		this.context = context;
		this.isRenderFrozen = false;
		this.intervalId = null;
		this.canvasTimer = new CanvasCountdownTimer(context);

		this.loadState(settings, true);

		const timerStartMs = getIntegerSetting(settings, 'timerStartMs', null);
		const pauseStartMs = getIntegerSetting(settings, 'pauseStartMs', null);
		const isRunning = getBooleanSetting(settings, 'isRunning');

		if (timerStartMs !== null) {
			this.timerStartMs = timerStartMs;
			this.pauseStartMs = pauseStartMs;
			this.isRunning = isRunning;
			this.drawTimer();
			if (isRunning) {
				this.addInterval();
			}
		} else {
			this.timerStartMs = null;
			this.pauseStartMs = null;
			this.isRunning = false;
		}
	}

	loadState(settings, isInit) {
		this.hours = getIntegerSetting(settings, 'hours', 1);
		this.minutes = getIntegerSetting(settings, 'minutes');
		this.seconds = getIntegerSetting(settings, 'seconds');

		const goalSec = this.hours * 3600 + this.minutes * 60 + this.seconds;
		if (isInit) {
			this.goalSec = goalSec;
			this.alarmAudio = new AudioHandler(settings);
		} else {
			if (this.goalSec !== goalSec) {
				this.goalSec = goalSec;
				this.drawTimer();
			}
			this.alarmAudio.loadState(settings, false);
		}
	}

	saveState() {
		const payload = {
			hours: this.hours.toString(),
			minutes: this.minutes.toString(),
			seconds: this.seconds.toString(),
			timerStartMs: this.timerStartMs,
			pauseStartMs: this.pauseStartMs,
			isRunning: this.isRunning,
		};
		$SD.setSettings(this.context, payload);
	}

	shortPress(nowMs) {
		if (this.isRunning) {
			this.pause(nowMs);
		} else {
			if (this.alarmAudio.isPlaying) {
				this.alarmAudio.stop();
				this.reset();
			} else {
				this.start(nowMs);
			}
		}
	}

	longPress(nowMs) {
		this.reset();
	}

	isStarted() {
		return !!this.timerStartMs;
	}

	getElapsedSec(nowMs = null) {
		const startMs = (
			this.isRunning ?
			nowMs ?? Date.now() :
			this.pauseStartMs ?? this.timerStartMs
		);
		return Math.round((startMs - this.timerStartMs) / 1000);
	}

	start(nowMs) {
		if (!this.isRunning) {
			if (this.goalSec > 0) {
				if (this.isStarted()) {
					const pauseElapsedMs = nowMs - this.pauseStartMs;
					this.timerStartMs += pauseElapsedMs;
				} else {
					this.timerStartMs = nowMs;
				}
				this.pauseStartMs = null;
				this.isRunning = true;
				this.drawTimer(nowMs);
				this.addInterval();
				this.saveState();
			} else {
				$SD.showAlert(this.context);
			}
		}
	}

	pause(nowMs) {
		if (this.isRunning) {
			this.pauseStartMs = nowMs;
			this.isRunning = false;
			this.drawTimer(nowMs);
			this.remInterval();
			this.saveState();
		}
	}

	reset() {
		this.timerStartMs = null;
		this.pauseStartMs = null;
		this.isRunning = false;
		this.isRenderFrozen = false;
		this.remInterval();
		$SD.setImage(this.context);
		this.saveState();
	}

	addInterval() {
		if (this.isRunning) {
			if (!this.intervalId) {
				this.intervalId = setInterval(() => this.drawTimer(), 1000);
			}
		}
	}

	remInterval() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	drawTimer(nowMs = null) {
		if (this.isStarted()) {
			const elapsedSec = this.getElapsedSec(nowMs);
			if (elapsedSec < this.goalSec) {
				if (!this.isRenderFrozen) {
					this.canvasTimer.drawTimer(elapsedSec, this.goalSec, this.isRunning);
				}
			} else {
				this.reset();
				$SD.showOk(this.context);
				this.alarmAudio.play();
			}
		} else {
			$SD.setImage(this.context);
		}
	}

	drawClear() {
		this.canvasTimer.drawClear();
	}
};

class CanvasCountdownTimer {

	constructor(context) {
		this.context = context;
		this.canvas = document.createElement('canvas');
		this.canvas.width = 144;
		this.canvas.height = 144;
		this.ctx = this.canvas.getContext('2d');
	}

	drawTimer(elapsedSec, goalSec, isRunning) {
		const img = document.getElementById(isRunning ? 'timer-bg-running' : 'timer-bg-pause');
		this.ctx.clearRect(0, 0, 144, 144);
		this.ctx.drawImage(img, 0, 0, 144, 144);
		this.drawTimerInner(elapsedSec, goalSec, isRunning);
		$SD.setImage(this.context, this.canvas.toDataURL('image/png'));
	}

	drawTimerInner(elapsedSec, goalSec, isRunning) {
		//Foreground Text
		const remainingText = this.getRemainingText(elapsedSec, goalSec);
		const fSize = this.getFontSize(remainingText.length);
		const fSizeThird = fSize / 3;
		this.ctx.fillStyle = isRunning ? '#5881e0' : '#606060';
		this.ctx.font = `${fSize}px arial`;
		this.ctx.textBaseline = 'middle';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(remainingText, 72, (140 + fSizeThird) / 2);
		//Foreground Circles
		if (isRunning) {
			for (let i = 0; i < 3 && i <= elapsedSec; i++) {
				const circleOffset = (Math.abs(((elapsedSec + 3 - i) % 4) - 2) - 1) * 14;
				this.ctx.beginPath();
				this.ctx.arc(72 + circleOffset, 96 + fSizeThird, 6, 0, 2 * Math.PI, false);
				this.ctx.fillStyle = this.getCircleColor(i);
				this.ctx.fill();
				if (i == 1 && circleOffset !== 0) {
					break;
				}
			}
		}
	}

	drawClear() {
		this.ctx.clearRect(0, 0, 144, 144);
		$SD.setImage(this.context, this.canvas.toDataURL('image/png'));
	}

	getRemainingText(elapsedSec, goalSec) {
		const totalSec = goalSec - elapsedSec;
		const hours = Math.floor(totalSec / 3600);
		const mins = Math.floor((totalSec % 3600) / 60);
		const secs = totalSec % 60;
		return (
			goalSec < 3600 ?
			`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` :
			`${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
		);
	}

	getFontSize(len) {
		if (len <= 5) {
			return 38;
		}
		return len > 7 ? 32 - len / 2 : 32;
	}

	getCircleColor(index) {
		switch (index) {
			case 0:
				return '#3d6ee0';
			case 1:
				return '#162a52';
			default:
				return '#0f1d35';
		}
	}
};
