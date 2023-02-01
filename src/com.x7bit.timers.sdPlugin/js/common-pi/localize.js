/**
 * 
 * @param {string} str
 * @returns {string}
 */
const localize = (str) => {
	return (
		typeof str === 'string' && str.length && window.hasOwnProperty('$localizedStrings') && $localizedStrings.hasOwnProperty(str) ?
		$localizedStrings[str] : str
	);
};

/**
 * 
 */
const localizeUI = () => {
	document.getElementById('property-inspector').querySelectorAll('[data-localize]').forEach(el => {
		const str = el.innerText.trim();
		const strLoc = localize(str);
		if (str !== strLoc) {
			el.innerHTML = el.innerHTML.replace(str, strLoc);
		}
	});
};
