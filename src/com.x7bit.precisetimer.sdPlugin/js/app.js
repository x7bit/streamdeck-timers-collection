$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
  debugLog('Connected Plugin:', jsn);

  // Subscribe to the willAppear and other events
  $SD.on('com.x7bit.precisetimer.action.willAppear', jsonObj =>
    action.onWillAppear(jsonObj)
  );
  $SD.on('com.x7bit.precisetimer.action.willDisappear', jsonObj =>
    action.onWillDisappear(jsonObj)
  );
  $SD.on('com.x7bit.precisetimer.action.didReceiveSettings', jsonObj =>
    action.onDidReceiveSettings(jsonObj)
  );
  $SD.on('com.x7bit.precisetimer.action.keyDown', (jsonObj) =>
    action.onKeyDown(jsonObj)
  );
  $SD.on('com.x7bit.precisetimer.action.keyUp', jsonObj =>
    action.onKeyUp(jsonObj)
  );
};

const action = {
  timer: null,
  keyDownMs: null,
  resetTimeoutId : null,

  onWillAppear(jsn) {
    if (this.timer) {
      if (this.timer.context !== jsn.context) {
        this.timer.reset();
        this.timer.context = jsn.context;
      } else {
        this.timer.isRenderFrozen = false;
        this.timer.drawRemainingText();
      }
    } else {
      const hours = this.getIntegerSetting(jsn, 'hours');
      const minutes = this.getIntegerSetting(jsn, 'minutes');
      const seconds = this.getIntegerSetting(jsn, 'seconds');
      this.timer = new CountdownTimer(hours, minutes, seconds, jsn.context);
    }
  },

  onWillDisappear(jsn) {
    if (this.timer) {
      this.timer.isRenderFrozen = true;
    }
  },

  onDidReceiveSettings(jsn) {
    const hours = this.getIntegerSetting(jsn, 'hours');
    const minutes = this.getIntegerSetting(jsn, 'minutes');
    const seconds = this.getIntegerSetting(jsn, 'seconds');

    const goalSec = hours * 3600 + minutes * 60 + seconds;
    if (this.timer.goalSec !== goalSec) {
      this.timer.goalSec = goalSec;
      this.timer.drawRemainingText();
    }
  },

  onKeyDown(jsn) {
    this.keyDownMs = Date.now();
    this.resetTimeoutId = setTimeout(() => {
      this.drawClearImage(jsn);
      $SD.api.showAlert(jsn.context);
    }, 2000);
    this.timer.isRenderFrozen = true;
  },

  onKeyUp(jsn) {
    clearTimeout(this.resetTimeoutId);
    this.resetTimeoutId = null;
    this.timer.isRenderFrozen = false;

    const nowMs = Date.now();
    const keyElapsedMs = nowMs - this.keyDownMs;
    if (keyElapsedMs < 2000) {  // Short Press
      if (this.timer.isRunning) {
        this.timer.pause(nowMs);
      } else {
        if (this.timer.alarmTimeoutId) {
          this.timer.alarmStop();
          this.timer.reset();
        } else {
          this.timer.start(nowMs);
        }
      }
    } else {  // Long Press
      this.timer.reset();
    }
  },

  getIntegerSetting(jsn, name, defValue = 0) {
    const settings = jsn.payload.settings ?? {};
    if (settings.hasOwnProperty(name)) {
      const value = parseInt(settings[name]);
      return isNaN(value) ? defValue : value;
    } else {
      return defValue;
    }
  },

  drawClearImage(jsn) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 144;
    this.canvas.height = 144;
    this.ctx = this.canvas.getContext('2d');

    const img = document.getElementById('clear-bg');
    this.ctx.drawImage(img, 0, 0, 144, 144);
    $SD.api.setImage(jsn.context, this.canvas.toDataURL('image/png'));
  },
};

class CountdownTimer {

  constructor(hours, minutes, seconds, context) {
    this.goalSec = hours * 3600 + minutes * 60 + seconds;
    this.timerStartMs = null;
    this.pauseStartMs = null;
    this.isRunning = false;
    this.isRenderFrozen = false;
    this.intervalId = null;
    this.canvasTimer = new CanvasTimer();
    this.context = context;
    this.alarmAudio = document.getElementById('audio-alarm');
    this.alarmTimeoutId = null;
  }

  isStarted() {
    return !!this.timerStartMs;
  }

  getElapsedSec(nowMs = null) {
    const startMs = (
      this.isRunning ?
      nowMs ?? Date.now() :
      this.pauseStartMs ?? this.timerStartMs
    );
    return Math.round((startMs - this.timerStartMs) / 1000);
  }

  start(nowMs) {
    if (!this.isRunning) {
      if (this.goalSec > 0) {
        if (this.isStarted()) {
          const pauseElapsedMs = nowMs - this.pauseStartMs;
          this.timerStartMs += pauseElapsedMs;
        } else {
          this.timerStartMs = nowMs;
        }
        this.pauseStartMs = null;
        this.isRunning = true;
        this.drawRemainingText(nowMs);
        this.addInterval();
      } else {
        $SD.api.showAlert(this.context);
      }
    }
  }

  pause(nowMs) {
    if (this.isRunning) {
      this.pauseStartMs = nowMs;
      this.isRunning = false;
      this.drawRemainingText(nowMs);
      this.remInterval();
    }
  }

  reset() {
    this.timerStartMs = null;
    this.pauseStartMs = null;
    this.isRunning = false;
    this.isRenderFrozen = false;
    this.remInterval();
    $SD.api.setImage(this.context);
  }

  addInterval() {
    if (this.isRunning) {
      if (!this.intervalId) {
        this.intervalId = setInterval(() => this.drawRemainingText(), 1000);
      }
    }
  }

  remInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  drawRemainingText(nowMs = null) {
    if (this.isStarted()) {
      const elapsedSec = this.getElapsedSec(nowMs);
      if (elapsedSec < this.goalSec) {
        if (!this.isRenderFrozen) {
          this.canvasTimer.drawTimer(this.context, elapsedSec, this.goalSec, this.isRunning);
        }
      } else {
        this.reset();
        $SD.api.showOk(this.context);
        this.alarmPlay();
      }
    } else {
      $SD.api.setImage(this.context);
    }
  }

  alarmPlay() {
    this.alarmAudio.play();
    this.alarmTimeoutId = setTimeout(() => {
      this.alarmTimeoutId = null;
    }, 5906);
  }

  alarmStop() {
    this.alarmAudio.pause();
    this.alarmAudio.currentTime = 0;
    this.alarmTimeoutId = null;
  }
};

class CanvasTimer {

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 144;
    this.canvas.height = 144;
    this.ctx = this.canvas.getContext('2d');
  }

  drawTimer(context, elapsedSec, goalSec, isRunning) {
    //Background
    const img = document.getElementById(isRunning ? 'timer-bg-running' : 'timer-bg-pause');
    this.ctx.drawImage(img, 0, 0, 144, 144);
    //Foreground Text
    const remainingText = this.getRemainingText(elapsedSec, goalSec);
    const fSize = this.getFontSize(remainingText.length);
    const fSizeThird = fSize / 3;
    this.ctx.fillStyle = isRunning ? '#5881e0' : '#606060';
    this.ctx.font = `${fSize}px arial`;
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(remainingText, 72, (144 + fSizeThird) / 2);
    //Foreground Circles
    if (isRunning) {
      for (let i = 0; i < 3 && i <= elapsedSec; i++) {
        const circleOffset = (Math.abs(((elapsedSec + 3 - i) % 4) - 2) - 1) * 14;
        this.ctx.beginPath();
        this.ctx.arc(72 + circleOffset, 96 + fSizeThird, 6, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = this.getCircleColor(i);
        this.ctx.fill();
        if (i == 1 && circleOffset !== 0) {
          break;
        }
      }
    }
    //Draw Canvas
    $SD.api.setImage(context, this.canvas.toDataURL('image/png'));
  }

  getRemainingText(elapsedSec, goalSec) {
    const totalSec = goalSec - elapsedSec;
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return (
      goalSec < 3600 ?
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` :
      `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    );
  }

  getFontSize(len) {
    if (len <= 5) {
      return 38;
    }
    return len > 7 ? 32 - len / 2 : 32;
  }

  getCircleColor(index) {
    switch (index) {
      case 0:
        return '#3d6ee0';
      case 1:
        return '#162a52';
      default:
        return '#0f1d35';
    }
  }
};
