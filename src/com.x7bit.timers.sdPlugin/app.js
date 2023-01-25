/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />
/// <reference path="js/chrono.js" />
/// <reference path="js/countdown.js" />
/// <reference path="js/interval.js" />

class Instance {

	constructor(uuid, context, payload) {
		this.context = context;
		this.keyDownMs = null;
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
			this.timer.drawClearImage();
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

const instances = new Map();
const actions = new Map();
const uuids = [
	'com.x7bit.timers.chrono',
	'com.x7bit.timers.countdown',
	'com.x7bit.timers.interval',
];

for (const uuid of uuids) {
	const action = new Action(uuid);

	action.onWillAppear(({ action, context, device, event, payload }) => {
		if (!instances.has(context)) {
			instances.set(context, new Instance(uuid, context, payload));
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

	actions.set(uuid, action);
}
