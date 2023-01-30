/// <reference path="../actions/chrono.js" />
/// <reference path="../actions/countdown.js" />
/// <reference path="../actions/interval.js" />

class Instance {

	constructor(uuid, context, payload) {
		this.context = context;
		this.keyDownMs = 0;
		this.longPressTimeoutId = null;

		const settings = payload.settings ?? {};
		switch (uuid) {
			case 'com.x7bit.timers.chrono':
				this.timer = new ChronoTimer(context, settings);
				break;
			case 'com.x7bit.timers.countdown':
				this.timer = new CountdownTimer(context, settings);
				break;
			case 'com.x7bit.timers.interval':
				this.timer = new IntervalTimer(context, settings);
				break;
			default:
				this.timer = null;
				break;
		}
	}

	onWillAppear() {
		this.timer.isRenderFrozen = false;
		this.timer.drawTimer();
	}

	onWillDisappear() {
		this.timer.isRenderFrozen = true;
		this.timer.saveState();
	}

	onDidReceiveSettings(payload) {
		this.timer.loadState(payload.settings ?? {}, false);
	}

	onKeyDown() {
		this.keyDownMs = Date.now();
		this.longPressTimeoutId = setTimeout(() => {
			this.timer.drawClear();
			$SD.showAlert(this.context);
		}, 2000);
		this.timer.isRenderFrozen = true;
	}

	onKeyUp() {
		clearTimeout(this.longPressTimeoutId);
		this.longPressTimeoutId = null;
		this.timer.isRenderFrozen = false;

		const nowMs = Date.now();
		const keyElapsedMs = nowMs - this.keyDownMs;
		if (keyElapsedMs < 2000) {
			this.timer.shortPress(nowMs);
		} else {
			this.timer.longPress();
		}
	}
}
