/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />

$PI.onConnected((jsn) => {
	const { actionInfo /*, appInfo, connection, messageType, port, uuid*/ } = jsn;
	const { payload /*, context*/ } = actionInfo;
	const { settings } = payload;
	const form = document.getElementById('property-inspector');

	//Form Set
	$PI.loadLocalization('../../../');
	Utils.setFormValue(settings, form);

	//Links Buttons Listeners
	document.getElementById('readme-button').onclick = (event) => {
		event.preventDefault();
		$PI.openUrl('https://github.com/x7bit/streamdeck-timers-collection/blob/main/README.md');
	};
	document.getElementById('changelog-button').onclick = (event) => {
		event.preventDefault();
		$PI.openUrl('https://github.com/x7bit/streamdeck-timers-collection/blob/main/changelog.md');
	};
});
