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
  keyDownTs: null,

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
      this.timer = new Timer(this.hours, this.minutes, jsn.context);
      this.timer.printRemainingText();
    }
  },

  onDidReceiveSettings: function(jsn) {
    this.hours = jsn.payload.settings.hours ?? 8;
    this.minutes = jsn.payload.settings.minutes ?? 0;
    const goalTs = this.hours * 3600000 + this.minutes * 60000;
    if (this.timer.goalTs !== goalTs) {
      this.timer.goalTs = goalTs;
      this.timer.printRemainingText();
    }
  },

  onWillDisappear: function(jsn) {
    this.timer.remInterval(null, true);
  },

  onKeyDown: function (jsn) {
    this.keyDownTs = Date.now();
  },

  onKeyUp: function (jsn) {
    const nowTs = Date.now();
    const keyElapsed = nowTs - this.keyDownTs;
    if (keyElapsed < 1500) {  // Short Press
      if (this.timer.isRunning) {
        this.timer.pause(nowTs);
      } else {
        this.timer.start(nowTs);
      }
    } else {  // Long Press
      this.timer.reset();
    }
  },

};

class Timer {
  goalTs;
  timerStartTs;
  pauseStartTs;
  isRunning;
  intervalId;
  context;

  constructor(hours, minutes, context) {
    this.goalTs = hours * 3600000 + minutes * 60000;
    this.timerStartTs = null;
    this.pauseStartTs = null;
    this.isRunning = false;
    this.intervalId = null;
    this.context = context;
  }

  getElapsedTs(nowTs = null) {
    const startTs = this.isRunning ? nowTs ?? Date.now() : this.pauseStartTs ?? this.timerStartTs;
    return startTs - this.timerStartTs;
  }

  start(nowTs) {
    if (!this.isRunning) {
      const pauseElapsed = nowTs - this.pauseStartTs;
      this.timerStartTs += pauseElapsed;
      this.pauseStartTs = null;
      this.isRunning = true;
      this.addInterval(nowTs);
    }
  }

  pause(nowTs) {
    if (this.isRunning) {
      this.pauseStartTs = nowTs;
      this.isRunning = false;
      this.remInterval(nowTs, true);
    }
  }

  reset() {
    this.timerStartTs = null;
    this.pauseStartTs = null;
    this.isRunning = false;
    this.remInterval(null, true);
  }

  addInterval(nowTs = null, updateImmediately = false) {
    if (this.isRunning) {
      if (updateImmediately) {
        this.printRemainingText(nowTs);
      }

      setTimeout(() => {
        this.printRemainingText();
      }, 500);
      this.intervalId = setInterval(() => {
        this.printRemainingText();
      }, 1000);
    }
  }

  remInterval(nowTs = null, updateImmediately = false) {
    if (updateImmediately) {
      this.printRemainingText(nowTs);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  printRemainingText(nowTs = null) {
    const elapsedTs = this.getElapsedTs(nowTs);
    const totalSecs = Math.round((this.goalTs - elapsedTs) / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const remainingText = `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    $SD.api.setTitle(this.context, remainingText);
  }
};
