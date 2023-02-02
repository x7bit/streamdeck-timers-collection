/**
 * 
 * @param {Object} settings
 * @param {string} name
 * @param {string} defValue
 * @returns {?string} Default ''
 */
const getStringSetting = (settings, name, defValue = '') => {
	return settings.hasOwnProperty(name) && settings[name] ? String(settings[name]) : defValue;
};

/**
 * 
 * @param {Object} settings
 * @param {string} name
 * @param {number} defValue
 * @returns {?number} Default 0
 */
const getIntegerSetting = (settings, name, defValue = 0) => {
	if (settings.hasOwnProperty(name)) {
		const value = parseInt(settings[name]);
		return isNaN(value) ? defValue : value;
	} else {
		return defValue;
	}
};

/**
 * 
 * @param {Object} settings
 * @param {string} name
 * @param {boolean} defValue
 * @returns {boolean} Default false
 */
const getBooleanSetting = (settings, name, defValue = false) => {
	return settings.hasOwnProperty(name) ? !!settings[name] : defValue;
};
