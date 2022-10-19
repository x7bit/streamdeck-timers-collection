# Precise Timer

The `Precise Timer` is a Javascript plugin for [Stream Deck](https://developer.elgato.com/documentation/stream-deck/).

`Precise Timer` requires Stream Deck 4.1 or later.

## Description

Precise and pauseable timer, especially suitable for long periods. Since the default timer (from the *Stream Deck* category) is quite inaccurate for periods of many hours, the `Precise Timer` plugin was developed with the idea of using it for long periods, such as workdays. To do this, the plugin saves the system time when the timer starts, and calculates the difference. This ensures that the measurement is accurate even when the timer is set to many hours.

## Features:

- Pauseable: press the key to pause/resume it
- Resettable: press the key for more than 2 seconds to reset it
- Configurable: you can configure hours, minutes and seconds in the *Property Inspector*
- Persistent: immune to restarts, both of the computer and the Stream Deck application
- Multiple: allows multiple instances
- Cross-platform: macOS, Windows

## Localization

The `Precise Timer` plugin is localized to *English* and *Spanish*. If you want to help localize it to other languages, these are the strings to translate:

- `Precise Timer`
- `Precise and pauseable timer, especially suitable for long periods`
- `Hours`
- `Minutes`
- `Seconds`

## Deploy

Please read this guide and download the *Distribution Tool*:

- https://developer.elgato.com/documentation/stream-deck/sdk/packaging/

Put it on the root dir of this project and execute:

`DistributionTool -b -i src\com.x7bit.precisetimer.sdPlugin -o release_dir`

The installable file `com.x7bit.precisetimer.streamDeckPlugin` will be created.

## Thanks

- **[QuakeBert](https://www.reddit.com/user/QuakeBert/)**: for the suggestion of using the `timers.js` from [this repo](https://github.com/elgatosf/streamdeck-timerfix/blob/master/com.streamdeck.timerfix.sdPlugin/js/timers.js)
- **[elgatosf](https://github.com/elgatosf)**: for provide the plugin template and timerfix repos:
    - https://github.com/elgatosf/streamdeck-plugintemplate
    - https://github.com/elgatosf/streamdeck-timerfix