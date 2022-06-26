$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
  debugLog('Connected Plugin:', jsn);

  // Subscribe to the willAppear and other events
  $SD.on('com.x7bit.workdaytimer.action.willAppear', jsonObj =>
    action.onWillAppear(jsonObj)
  );
  $SD.on('com.x7bit.workdaytimer.action.didReceiveSettings', jsonObj =>
    action.onDidReceiveSettings(jsonObj)
  );
  $SD.on('com.x7bit.workdaytimer.action.willDisappear', jsonObj =>
    action.onWillDisappear(jsonObj)
  );
  $SD.on('com.x7bit.workdaytimer.action.keyDown', (jsonObj) =>
    action.onKeyDown(jsonObj)
  );
  $SD.on('com.x7bit.workdaytimer.action.keyUp', jsonObj =>
    action.onKeyUp(jsonObj)
  );
};

const action = {
  hours: null,
  minutes: null,
  timer: null,
  keyDownMs: null,

  onWillAppear: function (jsn) {
    this.hours = jsn.payload.settings.hours ?? 8;
    this.minutes = jsn.payload.settings.minutes ?? 0;

    if (this.timer) {
      if (this.timer.context !== jsn.context) {
        this.timer.reset();
        this.timer.context = jsn.context;
      } else {
        if (this.timer.isRunning) {
          this.timer.addInterval(null, true);
        } else {
          this.timer.printRemainingText();
        }
      }
    } else {
      this.timer = new CountdownTimer(this.hours, this.minutes, jsn.context);
      this.timer.printRemainingText();
    }
  },

  onDidReceiveSettings: function(jsn) {
    this.hours = jsn.payload.settings.hours ?? 8;
    this.minutes = jsn.payload.settings.minutes ?? 0;
    const goalSec = this.hours * 3600 + this.minutes * 60;
    if (this.timer.goalSec !== goalSec) {
      this.timer.goalSec = goalSec;
      this.timer.printRemainingText();
    }
  },

  onWillDisappear: function(jsn) {
    this.timer.remInterval(null, true);
  },

  onKeyDown: function (jsn) {
    this.keyDownMs = Date.now();
  },

  onKeyUp: function (jsn) {
    const nowMs = Date.now();
    const keyElapsedMs = nowMs - this.keyDownMs;
    if (keyElapsedMs < 1500) {  // Short Press
      const nowSec = Math.round(nowMs / 1000);
      if (this.timer.isRunning) {
        this.timer.pause(nowSec);
      } else {
        this.timer.start(nowSec);
      }
    } else {  // Long Press
      this.timer.reset();
    }
  },

};

class CountdownTimer {
  goalSec;
  timerStartSec;
  pauseStartSec;
  isRunning;
  intervalId;
  context;

  constructor(hours, minutes, context) {
    this.goalSec = hours * 3600 + minutes * 60;
    this.timerStartSec = null;
    this.pauseStartSec = null;
    this.isRunning = false;
    this.intervalId = null;
    this.context = context;
  }

  getElapsedSec(nowSec = null) {
    const startSec = (
      this.isRunning ?
      nowSec ?? Math.round(Date.now() / 1000) :
      this.pauseStartSec ?? this.timerStartSec
    );
    return startSec - this.timerStartSec;
  }

  start(nowSec) {
    if (!this.isRunning) {
      const pauseElapsedSec = nowSec - this.pauseStartSec;
      this.timerStartSec += pauseElapsedSec;
      this.pauseStartSec = null;
      this.isRunning = true;
      this.addInterval(nowSec);
    }
  }

  pause(nowSec) {
    if (this.isRunning) {
      this.pauseStartSec = nowSec;
      this.isRunning = false;
      this.remInterval(nowSec, true);
    }
  }

  reset() {
    this.timerStartSec = null;
    this.pauseStartSec = null;
    this.isRunning = false;
    this.remInterval(null, true);
  }

  addInterval(nowSec = null, updateImmediately = false) {
    if (this.isRunning) {
      if (updateImmediately) {
        this.printRemainingText(nowSec);
      }

      setTimeout(() => {
        this.printRemainingText();
      }, 500);
      this.intervalId = setInterval(() => {
        this.printRemainingText();
      }, 1000);
    }
  }

  remInterval(nowSec = null, updateImmediately = false) {
    if (updateImmediately) {
      this.printRemainingText(nowSec);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  printRemainingText(nowSec = null) {
    const elapsedSec = this.getElapsedSec(nowSec);
    const totalSec = this.goalSec - elapsedSec;
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const remainingText = `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    $SD.api.setTitle(this.context, remainingText);
  }
};
