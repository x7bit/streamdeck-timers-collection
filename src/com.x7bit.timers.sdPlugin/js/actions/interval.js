/// <reference path="../../libs/js/stream-deck.js" />
/// <reference path="../common/audio.js" />
/// <reference path="../common/settings.js" />

class IntervalTimer {

	constructor(context, settings) {
		this.context = context;
		this.round = getIntegerSetting(settings, 'round', 1);
		this.isBreak = getBooleanSetting(settings, 'break');
		this.prevPressMs = getIntegerSetting(settings, 'prevPressMs');
		this.isRenderFrozen = false;
		this.intervalId = null;
		this.canvasTimer = new CanvasIntervalTimer(context);

		this.loadSettingsPI(settings, true);

		const timerStartMs = getIntegerSetting(settings, 'timerStartMs', null);
		this.timerStartMs = timerStartMs ? timerStartMs : null;
		this.pauseStartMs = timerStartMs ? getIntegerSetting(settings, 'pauseStartMs', null) : null;
		this.isRunning = timerStartMs ? getBooleanSetting(settings, 'isRunning') : false;

		if (timerStartMs !== null) {
			this.drawTimer();
			if (isRunning) {
				this.addInterval();
			}
		}
	}

	loadSettingsPI(settings, isInit) {
		this.hours = getIntegerSetting(settings, 'hours', 1);
		this.minutes = getIntegerSetting(settings, 'minutes');
		this.seconds = getIntegerSetting(settings, 'seconds');
		this.breakMinutes = getIntegerSetting(settings, 'breakMinutes');
		this.breakSeconds = getIntegerSetting(settings, 'breakSeconds');

		const goalSec = this.hours * 3600 + this.minutes * 60 + this.seconds;
		const breakGoalSec = this.breakMinutes * 60 + this.breakSeconds;
		if (isInit) {
			this.goalSec = goalSec;
			this.breakGoalSec = breakGoalSec;
			this.alarmAudio = new AudioHandler(settings);
		} else {
			if (this.goalSec !== goalSec || this.breakGoalSec !== breakGoalSec) {
				this.goalSec = goalSec;
				this.breakGoalSec = breakGoalSec;
				this.drawTimer();
			}
			this.alarmAudio.loadSettingsPI(settings, false);
		}
	}

	saveState() {
		const payload = {
			round: this.round,
			break: this.isBreak,
			hours: this.hours.toString(),
			minutes: this.minutes.toString(),
			seconds: this.seconds.toString(),
			breakMinutes: this.breakMinutes.toString(),
			breakSeconds: this.breakSeconds.toString(),
			timerStartMs: this.timerStartMs,
			pauseStartMs: this.pauseStartMs,
			prevPressMs: this.prevPressMs,
			isRunning: this.isRunning,
		};
		$SD.setSettings(this.context, Object.assign(payload, this.alarmAudio.getSaveState()));
	}

	shortPress(nowMs) {
		if (this.alarmAudio.isPlaying) {
			this.alarmAudio.stop();
		} else {
			if ((nowMs - this.prevPressMs) < 500) {  //Double click
				this.prevPressMs = 0;
				this.gotoNextPeriod(nowMs);
				this.shortPressCore(nowMs);
			} else {  //Single click
				this.prevPressMs = nowMs;
				this.shortPressCore(nowMs);
			}
		}
	}

	longPress(nowMs) {
		this.reset();
	}

	shortPressCore(nowMs) {
		if (this.isRunning) {
			this.pause(nowMs);
		} else {
			this.start(nowMs);
		}
	}

	gotoNextPeriod(nowMs = null) {
		nowMs = nowMs ?? Date.now();
		this.timerStartMs = nowMs;
		this.pauseStartMs = this.isRunning ? null : nowMs;
		if (this.isBreak || this.breakGoalSec <= 0) {
			this.round++;
			this.isBreak = false;
		} else {
			this.isBreak = true;
		}
		const goalSec = this.isBreak ? this.breakGoalSec : this.goalSec;
		this.canvasTimer.drawTimer(0, goalSec, this.round, this.isBreak, this.isRunning);
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
		this.round = 1;
		this.isBreak = false;
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
			const goalSec = this.isBreak ? this.breakGoalSec : this.goalSec;
			if (elapsedSec < goalSec) {
				if (!this.isRenderFrozen) {
					this.canvasTimer.drawTimer(elapsedSec, goalSec, this.round, this.isBreak, this.isRunning);
				}
			} else {
				this.gotoNextPeriod(nowMs);
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

class CanvasIntervalTimer {

	constructor(context) {
		this.context = context;
		this.canvas = document.createElement('canvas');
		this.canvas.width = 144;
		this.canvas.height = 144;
		this.ctx = this.canvas.getContext('2d');
	}

	drawTimer(elapsedSec, goalSec, round, isBreak, isRunning) {
		const img = document.getElementById(isRunning ? 'timer-bg-running' : 'timer-bg-pause');
		this.ctx.clearRect(0, 0, 144, 144);
		this.ctx.drawImage(img, 0, 0, 144, 144);
		this.drawTimerInner(elapsedSec, goalSec, round, isBreak, isRunning);
		$SD.setImage(this.context, this.canvas.toDataURL('image/png'));
	}

	drawTimerInner(elapsedSec, goalSec, round, isBreak, isRunning) {
		//Foreground Text (remaining)
		const remainingText = this.getRemainingText(elapsedSec, goalSec);
		const fSizeRem = this.getRemainingFontSize(remainingText.length);
		const fSizeRemThird = fSizeRem / 3;
		const posYRem = ((144 + fSizeRemThird) / 2) + 4;
		this.ctx.fillStyle = isRunning ? '#5881e0' : '#606060';
		this.ctx.font = `${fSizeRem}px arial`;
		this.ctx.textBaseline = 'middle';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(remainingText, 72, posYRem);
		//Foreground Text (round)
		const roundText = `${(isBreak ? 'Break' : 'Round')} ${round}`;
		const fSizeRnd = this.getRoundFontSize(round);
		const fSizeRndThird = fSizeRnd / 3;
		this.ctx.fillStyle = isRunning ? '#5881e0' : '#606060';
		this.ctx.font = `${fSizeRnd}px arial`;
		this.ctx.textBaseline = 'middle';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(roundText, 72, posYRem - fSizeRem + fSizeRndThird);
		//Foreground Circles
		if (isRunning) {
			for (let i = 0; i < 3 && i <= elapsedSec; i++) {
				const circleOffset = (Math.abs(((elapsedSec + 3 - i) % 4) - 2) - 1) * 14;
				this.ctx.beginPath();
				this.ctx.arc(72 + circleOffset, 100 + fSizeRemThird, 6, 0, 2 * Math.PI, false);
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

	getRemainingFontSize(len) {
		if (len <= 5) {
			return 38;
		}
		return len > 7 ? 32 - len / 2 : 32;
	}

	getRoundFontSize(round) {
		if (round <= 9) {
			return 23;
		}
		return 21;
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
