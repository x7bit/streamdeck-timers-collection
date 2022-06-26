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
  settings: {},
  timer: null,
  keyDownTs: null,

  onWillAppear: function (jsn) {
    this.settings = jsn.payload.settings;

    if (this.timer) {
      if (this.timer.context !== jsn.context) {
        this.timer.reset();
        this.timer.context = jsn.context;
      } else {
        if (this.timer.isRunning) {
          this.timer.addInterval(true);
        } else {
          $SD.api.setTitle(jsn.context, this.timer.pauseTime);
        }
      }
    } else {
      this.timer = new Timer(jsn.context);
      $SD.api.setTitle(jsn.context, this.timer.pauseTime);
    }
  },

  onDidReceiveSettings: function(jsn) {
    this.settings = jsn.payload.settings;
    //TODO
  },

  onWillDisappear: function(jsn) {
    this.timer.remInterval();
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
      this.doSomeThing(jsn, 'onKeyUp: short press', 'green');
    } else {  // Long Press
      this.timer.reset();
    }
  },

};

class Timer {
  context;
  timerStartTs;
  pauseStartTs;
  pauseTime;
  isRunning;
  intervalId;

  constructor(context) {
    this.context = context;
    this.timerStartTs = null;
    this.pauseStartTs = null;
    this.pauseTime = '0:00:00';
    this.isRunning = false;
    this.intervalId = null;
  }

  start(nowTs) {
    if (!this.isRunning) {
      const pauseElapsed = nowTs - this.pauseStartTs;
      this.timerStartTs += pauseElapsed;
      this.pauseStartTs = null;
      this.pauseTime = null;
      this.isRunning = true;
      this.addInterval();
    }
  }

  pause(nowTs) {
    if (this.isRunning) {
      this.pauseStartTs = nowTs;
      this.pauseTime = this.getTimeFromElapsed(nowTs - this.timerStartTs);
      this.isRunning = false;
      this.remInterval();
    }
  }

  reset() {
    this.timerStartTs = null;
    this.pauseStartTs = null;
    this.pauseTime = '0:00:00';
    this.isRunning = false;
    this.remInterval();
    $SD.api.setTitle(this.context, this.pauseTime);
  }

  addInterval(updateImmediately = false) {
    if (this.isRunning) {
      if (updateImmediately) {
        $SD.api.setTitle(this.context, this.getTimeFromElapsed(Date.now() - this.timerStartTs));
      }

      this.intervalId = setInterval(() =>
        $SD.api.setTitle(this.context, this.getTimeFromElapsed(Date.now() - this.timerStartTs))
      , 1000);
    }
  }

  remInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getTimeFromElapsed(elapsed) {
    const totalSecs = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};
