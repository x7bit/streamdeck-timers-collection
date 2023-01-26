/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

$PI.onConnected((jsn) => {
	$PI.loadLocalization('../../../');

	const form = document.getElementById('property-inspector');
	const { actionInfo, appInfo, connection, messageType, port, uuid } = jsn;
	const { payload, context } = actionInfo;
	const { settings } = payload;

	Utils.setFormValue(settings, form);

	form.addEventListener('input', Utils.debounce(150, () => {
		$PI.setSettings(Utils.getFormValue(form));
	}));

	//Links
	const readmeButton = document.getElementById('readme-button');
	const changelogButton = document.getElementById('changelog-button');
	readmeButton.onclick = (event) => {
		event.preventDefault();
		$PI.openUrl('https://github.com/x7bit/streamdeck-precise-timer/blob/main/README.md');
	};
	changelogButton.onclick = (event) => {
		event.preventDefault();
		$PI.openUrl('https://github.com/x7bit/streamdeck-precise-timer/blob/main/changelog.md');
	};
});
