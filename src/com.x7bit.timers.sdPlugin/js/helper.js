const getStringSetting = (settings, name, defValue = '') => {
	return settings.hasOwnProperty(name) ? String(settings[name]) : defValue;
};

const getIntegerSetting = (settings, name, defValue = 0) => {
	if (settings.hasOwnProperty(name)) {
		const value = parseInt(settings[name]);
		return isNaN(value) ? defValue : value;
	} else {
		return defValue;
	}
};

const getBooleanSetting = (settings, name, defValue = false) => {
	return settings.hasOwnProperty(name) ? !!settings[name] : defValue;
};
