/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

$PI.onConnected((jsn) => {
	$PI.loadLocalization('../../../');

	const form = document.querySelector('#property-inspector');
	const { actionInfo, appInfo, connection, messageType, port, uuid } = jsn;
	const { payload, context } = actionInfo;
	const { settings } = payload;

	Utils.setFormValue(settings, form);

	form.addEventListener(
		'input',
		Utils.debounce(150, () => {
			const value = Utils.getFormValue(form);
			$PI.setSettings(value);
		})
	);
});

document.querySelector('#readme-button').addEventListener('click', () => {
	$PI.openUrl('https://github.com/x7bit/streamdeck-precise-timer/blob/main/README.md');
});

document.querySelector('#changelog-button').addEventListener('click', () => {
	$PI.openUrl('https://github.com/x7bit/streamdeck-precise-timer/blob/main/changelog.md');
});