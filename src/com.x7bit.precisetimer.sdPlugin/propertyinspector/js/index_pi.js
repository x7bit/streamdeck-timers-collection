const onlyNumbers = (val) => {
  return val.replace(/[^0-9]/g, '');
};

const onlyNumbersMinMax = (val, min, max) => {
  val = parseInt(val) || 0;
  val = Math.min(val, max);
  val = Math.max(val, min);
  return val;
};

const hoursInput = document.getElementById('hours');
hoursInput.oninput = () => hoursInput.value = onlyNumbers(hoursInput.value);
hoursInput.onchange = () => hoursInput.value = onlyNumbersMinMax(hoursInput.value, 0, 15);

const minutesInput = document.getElementById('minutes');
minutesInput.oninput = () => minutesInput.value = onlyNumbers(minutesInput.value);
minutesInput.onchange = () => minutesInput.value = onlyNumbersMinMax(minutesInput.value, 0, 59);

const secondsInput = document.getElementById('seconds');
secondsInput.oninput = () => secondsInput.value = onlyNumbers(secondsInput.value);
secondsInput.onchange = () => secondsInput.value = onlyNumbersMinMax(secondsInput.value, 0, 59);

const readmeButton = document.getElementById('readme-button');
readmeButton.onclick = () => $SD.api.openUrl($SD.uuid, 'https://github.com/x7bit/streamdeck-precise-timer/blob/main/README.md');

const changelogButton = document.getElementById('changelog-button');
changelogButton.onclick = () => $SD.api.openUrl($SD.uuid, 'https://github.com/x7bit/streamdeck-precise-timer/blob/main/changelog.md');