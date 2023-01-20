/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />


const instances = new Map();
const action = new Action('com.x7bit.timers.countdown');

action.onWillAppear(({ action, context, device, event, payload }) => {
	if (!instances.has(context)) {
		instances.set(context, new Instance(context, payload));
	}
	instances.get(context).onWillAppear();
});

action.onWillDisappear(({ action, context, device, event, payload }) => {
	if (instances.has(context)) {
		instances.get(context).onWillDisappear();
	}
});

action.onDidReceiveSettings(({ action, context, device, event, payload }) => {
	if (instances.has(context)) {
		instances.get(context).onDidReceiveSettings(payload);
	}
});

action.onKeyDown(({ action, context, device, event, payload }) => {
	if (instances.has(context)) {
		instances.get(context).onKeyDown();
	}
});

action.onKeyUp(({ action, context, device, event, payload }) => {
	if (instances.has(context)) {
		instances.get(context).onKeyUp();
	}
});

//

class Instance {

	constructor(context, payload) {
		this.context = context;
		this.timer = null;
		this.keyDownMs = null;
		this.resetTimeoutId = null;

		const settings = payload.settings ?? {};
		const hours = this.getIntegerSetting(settings, 'hours', 1);
		const minutes = this.getIntegerSetting(settings, 'minutes');
		const seconds = this.getIntegerSetting(settings, 'seconds');
		const timerStartMs = this.getIntegerSetting(settings, 'timerStartMs', null);
		const pauseStartMs = this.getIntegerSetting(settings, 'pauseStartMs', null);
		const isRunning = this.getBooleanSetting(settings, 'isRunning');

		this.timer = new CountdownTimer(hours, minutes, seconds, context);
		if (timerStartMs !== null) {
			this.timer.timerStartMs = timerStartMs;
			this.timer.pauseStartMs = pauseStartMs;
			this.timer.isRunning = isRunning;
			this.timer.drawRemainingText();
			if (isRunning) {
				this.timer.addInterval();
			}
		}
	}

	onWillAppear() {
		this.timer.isRenderFrozen = false;
		this.timer.drawRemainingText();
	}

	onWillDisappear() {
		this.timer.isRenderFrozen = true;
		this.timer.saveState();
	}

	onDidReceiveSettings(payload) {
		const settings = payload.settings ?? {};
		const hours = this.getIntegerSetting(settings, 'hours');
		const minutes = this.getIntegerSetting(settings, 'minutes');
		const seconds = this.getIntegerSetting(settings, 'seconds');
		const goalSec = hours * 3600 + minutes * 60 + seconds;
		if (this.timer.goalSec !== goalSec) {
			this.timer.hours = hours;
			this.timer.minutes = minutes;
			this.timer.seconds = seconds;
			this.timer.goalSec = goalSec;
			this.timer.drawRemainingText();
		}
	}

	onKeyDown() {
		this.keyDownMs = Date.now();
		this.resetTimeoutId = setTimeout(() => {
			this.drawClearImage();
			$SD.showAlert(this.context);
		}, 2000);
		this.timer.isRenderFrozen = true;
	}

	onKeyUp() {
		clearTimeout(this.resetTimeoutId);
		this.resetTimeoutId = null;
		this.timer.isRenderFrozen = false;

		const nowMs = Date.now();
		const keyElapsedMs = nowMs - this.keyDownMs;
		if (keyElapsedMs < 2000) {  // Short Press
			if (this.timer.isRunning) {
				this.timer.pause(nowMs);
			} else {
				if (this.timer.alarmTimeoutId) {
					this.timer.alarmStop();
					this.timer.reset();
				} else {
					this.timer.start(nowMs);
				}
			}
		} else {  // Long Press
			this.timer.reset();
		}
	}

	getIntegerSetting(settings, name, defValue = 0) {
		if (settings.hasOwnProperty(name)) {
			const value = parseInt(settings[name]);
			return isNaN(value) ? defValue : value;
		} else {
			return defValue;
		}
	}

	getBooleanSetting(settings, name, defValue = false) {
		return settings.hasOwnProperty(name) ? !!settings[name] : defValue;
	}

	drawClearImage() {
		const canvas = document.createElement('canvas');
		canvas.width = 144;
		canvas.height = 144;

		const ctx = canvas.getContext('2d');
		const img = document.getElementById('clear-bg');
		ctx.drawImage(img, 0, 0, 144, 144);
		$SD.setImage(this.context, canvas.toDataURL('image/png'));
	}
}

class CountdownTimer {

	constructor(hours, minutes, seconds, context) {
		this.hours = hours;
		this.minutes = minutes;
		this.seconds = seconds;
		this.context = context;
		this.goalSec = hours * 3600 + minutes * 60 + seconds;
		this.timerStartMs = null;
		this.pauseStartMs = null;
		this.isRunning = false;
		this.isRenderFrozen = false;
		this.intervalId = null;
		this.canvasTimer = new CanvasTimer();
		this.alarmAudio = document.getElementById('audio-alarm');
		this.alarmTimeoutId = null;
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
				this.drawRemainingText(nowMs);
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
			this.drawRemainingText(nowMs);
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
				this.intervalId = setInterval(() => this.drawRemainingText(), 1000);
			}
		}
	}

	remInterval() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	drawRemainingText(nowMs = null) {
		if (this.isStarted()) {
			const elapsedSec = this.getElapsedSec(nowMs);
			if (elapsedSec < this.goalSec) {
				if (!this.isRenderFrozen) {
					this.canvasTimer.drawTimer(this.context, elapsedSec, this.goalSec, this.isRunning);
				}
			} else {
				this.reset();
				$SD.showOk(this.context);
				this.alarmPlay();
			}
		} else {
			$SD.setImage(this.context);
		}
	}

	alarmPlay() {
		this.alarmAudio.play();
		this.alarmTimeoutId = setTimeout(() => {
			this.alarmTimeoutId = null;
		}, 5906);
	}

	alarmStop() {
		this.alarmAudio.pause();
		this.alarmAudio.currentTime = 0;
		this.alarmTimeoutId = null;
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
};

class CanvasTimer {

	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas.width = 144;
		this.canvas.height = 144;
		this.ctx = this.canvas.getContext('2d');
	}

	drawTimer(context, elapsedSec, goalSec, isRunning) {
		//Background
		const img = document.getElementById(isRunning ? 'timer-bg-running' : 'timer-bg-pause');
		this.ctx.drawImage(img, 0, 0, 144, 144);
		//Foreground Text
		const remainingText = this.getRemainingText(elapsedSec, goalSec);
		const fSize = this.getFontSize(remainingText.length);
		const fSizeThird = fSize / 3;
		this.ctx.fillStyle = isRunning ? '#5881e0' : '#606060';
		this.ctx.font = `${fSize}px arial`;
		this.ctx.textBaseline = 'middle';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(remainingText, 72, (144 + fSizeThird) / 2);
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
		//Draw Canvas
		$SD.setImage(context, this.canvas.toDataURL('image/png'));
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
