/// <reference path="../../../libs/js/property-inspector.js" />
/// <reference path="../../../libs/js/utils.js" />
/// <reference path="../../../js/common-pi/localize.js" />
/// <reference path="../../../js/common-pi/audio-pi.js" />
/// <reference path="../../../js/common/audio.js" />

$PI.onConnected((jsn) => {
	$PI.loadLocalization('../../../');

	const { actionInfo /*, appInfo, connection, messageType, port, uuid*/ } = jsn;
	const { payload /*, context*/ } = actionInfo;
	const { settings } = payload;
	const form = document.getElementById('property-inspector');
	const audio = new AudioHandler(settings, customAudioError);

	//Form Set
	Utils.setFormValue(settings, form);
	toogleAudioControls(settings.audioId);
	setFilePicker(settings);
	$PI.on('localizationLoaded', () => localizeUI());

	//Inputs Listener
	form.querySelectorAll('input').forEach(input => input.oninput = Utils.debounce(150, (event) => {
		const settings = getSettingsWithCustomFile(form);
		if (event.target.name.startsWith('audio')) {
			audio.loadSettingsPI(settings, customAudioError);
		}
		$PI.setSettings(settings);
	}));

	//Audio Select Listener
	document.getElementById('audio-select').oninput = () => {
		const settings = getSettingsWithCustomFile(form);
		toogleAudioControls(settings.audioId);
		audio.loadSettingsPI(settings, customAudioError);
		$PI.setSettings(settings);
	};

	//Audio FilePicker Listener
	document.getElementById('audio-file').oninput = (event) => {
		const settings = getSettingsWithCustomFile(form);
		settings.customFile = getCustomFile(event.target.value);
		setFilePicker(settings);
		audio.loadSettingsPI(settings, customAudioError);
		$PI.setSettings(settings);
	};

	//Audio Preview Button Listener
	document.getElementById('play-stop-button').onclick = (event) => {
		event.preventDefault();
		playStop(audio);
	};

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
