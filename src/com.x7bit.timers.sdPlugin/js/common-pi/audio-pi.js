/// <reference path="../../libs/js/utils.js" />
/// <reference path="../common/audio.js" />
/// <reference path="localize.js" />

const global = { customFile: null };

/**
 * 
 * @param {Element|string} form
 * @returns {Object}
 */
const getSettingsWithCustomFile = (form) => {
	return { ...Utils.getFormValue(form), ...{ customFile: global.customFile } };
};

/**
 * 
 * @param {string} fileRaw
 * @returns {string}
 */
const getCustomFile = (fileRaw) => {
	return decodeURIComponent(fileRaw.replace(/^C:\\fakepath\\/, ''));
};

/**
 * 
 * @param {string} audioId
 */
const toogleAudioControls = (audioId) => {
	const audioFilePickerWrapper = document.getElementById('audio-file-wrapper');
	const audioControlsWrapper = document.getElementById('audio-controls-wrapper');
	if (audioId === 'custom') {
		if (audioFilePickerWrapper.classList.contains('hidden')) {
			audioFilePickerWrapper.classList.remove('hidden');
		}
	} else {
		if (!audioFilePickerWrapper.classList.contains('hidden')) {
			audioFilePickerWrapper.classList.add('hidden');
		}
	}
	if (audioId === 'none') {
		if (!audioControlsWrapper.classList.contains('hidden')) {
			audioControlsWrapper.classList.add('hidden');
		}
	} else {
		if (audioControlsWrapper.classList.contains('hidden')) {
			audioControlsWrapper.classList.remove('hidden');
		}
	}
};

/**
 * 
 * @param {Object} settings
 */
const setFilePicker = (settings) => {
	const customFile = settings.customFile ?? null;
	global.customFile = customFile;
	document.getElementById('audio-file-label').textContent = customFile ? customFile.split('/').pop() : localize('No file selected...');
};

/**
 * 
 * @param {AudioHandler} audio
 */
const playStop = (audio) => {
	if (audio.isPlaying) {
		audio.stop();
	} else {
		audio.play();
	}
};

/**
 * 
 */
const customAudioError = () => {
	document.getElementById('audio-file-label').textContent = localize('File error');
}
