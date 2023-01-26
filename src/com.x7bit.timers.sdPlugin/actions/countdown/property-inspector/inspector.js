/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />
/// <reference path="../../../js/audio.js" />

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

	//Audio Preview
	const audio = new AudioHandler(settings);
	const playButton = document.getElementById('play-button');
	const stopButton = document.getElementById('stop-button');
	playButton.onclick = (event) => {
		event.preventDefault();
		audio.loadState(Utils.getFormValue(form));
		audio.play();
	};
	stopButton.onclick = (event) => {
		event.preventDefault();
		audio.stop();
	};

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
