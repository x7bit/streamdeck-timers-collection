# Precise Timer

The `Timers Collection` is a Javascript plugin for [Stream Deck](https://developer.elgato.com/documentation/stream-deck/).

`Timers Collection` requires Stream Deck 5.0 or later.

## Description

Precise and pauseable timers collection, especially suitable for long periods. Since the default timer (from the *Stream Deck* category) is quite inaccurate for periods of many hours, the `Timers Collection` plugin was developed with the idea of using it for long periods, such as workdays. To do this, the plugin saves the system time when the timer starts, and calculates the difference. This ensures that the measurement is accurate even when the timer is set to many hours.

## Features:

- Pauseable: press the key to pause/resume it
- Resettable: press the key for more than 2 seconds to reset it
- Configurable: every timer (except chronometer) can be set on the *Property Inspector*
- Persistent: immune to restarts, both of the computer and the Stream Deck application
- Multiple: allows multiple instances
- Cross-platform: macOS, Windows

## Timers List

- Chronometer
- Countdown Timer
- Interval Timer (with optional break periods between intervals)
- Pomodoro Timer (incoming on next release)

## Controls
- Short click: pause o resume the timer (or stop the sound if playing)
- Long click (2 seconds or more): reset the timer
- Double click (only interval timer): advance to the next period

## Localization

The `Timers Collection` plugin is localized to *English* and *Spanish*. If you want to help localize it to other languages, please take the [en.json](https://github.com/x7bit/streamdeck-timers-collection/blob/main/src/com.x7bit.timers.sdPlugin/en.json) as template.

## Deploy

Please read this guide and download the *Distribution Tool*:

- https://developer.elgato.com/documentation/stream-deck/sdk/packaging/

Put it on the root dir of this project and execute:

`DistributionTool -b -i src\com.x7bit.timers.sdPlugin -o release_dir`

The installable file `com.x7bit.timers.streamDeckPlugin` will be created.

## Thanks

- **[QuakeBert](https://www.reddit.com/user/QuakeBert/)**: for the suggestion of using the `timers.js` from [this repo](https://github.com/elgatosf/streamdeck-timerfix/blob/master/com.streamdeck.timerfix.sdPlugin/js/timers.js)
- **[elgatosf](https://github.com/elgatosf)**: for provide the plugin template and SDK repos:
    - https://github.com/elgatosf/streamdeck-plugin-template
    - https://github.com/elgatosf/streamdeck-javascript-sdk