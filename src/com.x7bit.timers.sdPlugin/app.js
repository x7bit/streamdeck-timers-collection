/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />
/// <reference path="js/common/instance.js" />

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
