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
        } else if (this.timer.isStarted) {
          this.timer.printRemainingText();
        } else {
          $SD.api.setImage(this.context);
        }
      }
    } else {
      this.timer = new CountdownTimer(this.hours, this.minutes, jsn.context);
    }
  },

  onDidReceiveSettings: function(jsn) {
    this.hours = jsn.payload.settings.hours ?? 8;
    this.minutes = jsn.payload.settings.minutes ?? 0;
    const goalSec = this.hours * 3600 + this.minutes * 60;
    if (this.timer.goalSec !== goalSec) {
      this.timer.goalSec = goalSec;
      if (this.timer.isStarted) {
        this.timer.printRemainingText();
      }
    }
  },

  onWillDisappear: function(jsn) {
    this.timer.remInterval(null, true);
  },

  onKeyDown: function (jsn) {
    this.keyDownMs = Date.now();
    if (this.timer.isRunning) {
      this.timer.remInterval();
    }
  },

  onKeyUp: function (jsn) {
    const nowMs = Date.now();
    const keyElapsedMs = nowMs - this.keyDownMs;
    if (keyElapsedMs < 2000) {  // Short Press
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
  isStarted;
  isRunning;
  intervalId;
  canvasTimer;
  context;

  constructor(hours, minutes, context) {
    this.goalSec = hours * 3600 + minutes * 60;
    this.timerStartSec = null;
    this.pauseStartSec = null;
    this.isStarted = false;
    this.isRunning = false;
    this.intervalId = null;
    this.canvasTimer = new CanvasTimer();
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
      if (this.goalSec > 0) {
        const pauseElapsedSec = nowSec - this.pauseStartSec;
        this.timerStartSec += pauseElapsedSec;
        this.pauseStartSec = null;
        this.isStarted = true;
        this.isRunning = true;
        this.addInterval(nowSec, true);
      } else {
        $SD.api.showAlert(this.context);
      }
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
    this.isStarted = false;
    this.isRunning = false;
    this.remInterval();
    $SD.api.setImage(this.context);
  }

  addInterval(nowSec = null, updateImmediately = false) {
    if (this.isRunning) {
      if (updateImmediately) {
        this.printRemainingText(nowSec);
      }

      setTimeout(() => {
        this.printRemainingText();
      }, 10);
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
    if (totalSec > 0) {
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const remainingText = `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      this.canvasTimer.drawRemainingText(this.context, remainingText, this.isRunning);
    } else {
      this.reset();
      $SD.api.showOk(this.context);
      document.getElementById('audio-alarm').play();
    }
  }
};

class CanvasTimer {
  canvas;
  ctx;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 144;
    this.canvas.height = 144;
    this.ctx = this.canvas.getContext('2d');
    this.bColor = '#0a1423';
    this.frColor = '#5881e0';  //#3d6ee0
    this.fpColor = '#606060';
  }

  drawRemainingText(context, remainingText, isRunning) {
    //Background
    const img = document.getElementById('timer-running');
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    //Foreground
    const fSize = remainingText.length > 8 ? 30 - remainingText.length / 2 : 32;
    this.ctx.fillStyle = isRunning ? this.frColor : this.fpColor;
    this.ctx.font = `${fSize}px arial`;
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      remainingText,
      this.ctx.canvas.width / 2,
      (this.ctx.canvas.height + fSize / 3) / 2
    );
    //Draw Canvas
    $SD.api.setImage(context, this.canvas.toDataURL());
  }
};
