'use strict';

(function (root, factory) {
  // optional AMD https://github.com/umdjs/umd/blob/master/amdWeb.js
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['requestAnimationFrame'], factory);
  } else {
      // Browser globals
      root.ticktack = factory();
  }
}(this, function () {
  var callbacks, registeredCallbacks, tick, getTimeObject, runCallbacks, timeObject, runCallback, initLoop, setTimeObject;

  // Initializing callback objects
  callbacks = {};
  registeredCallbacks = [];

  /**
   * runCallbacks : loops callbacks and calls them
   * @param   {Object} obj object produced by getTimeObject, will be passed to the callback
   * @returns {void}
   */
  runCallbacks = function() {
    var i, j, name;
    for (i in registeredCallbacks) {
      name = registeredCallbacks[i];
      if ((timeObject[name] && timeObject[name].hasChanged ) || name === 'tick') {
        for (j in callbacks[name]) {
          runCallback(callbacks[name][j], name);
        }
      }
    }
  };

  /**
   * runCallback: execute callback with the correct timeobject arguments
   * @param   {Function} callback   callback function
   * @param   {[type]}   eventName  name of the event
   * @returns {void}
   */
  runCallback = function (callback, eventName) {
    callback.call(timeObject[eventName], timeObject, timeObject[eventName]);
  };

  /**
   * getTimeObject : produces an object containing all values and relative values for every digit in Date()
   * @param   {Object} previousDigits object previously obtained by getTimeObject to know what values did change
   * @returns {Object}                value and progress for every digit in Date()
   */
  getTimeObject = function (previousDigits) {
    var now, timeInMilliseconds, digit, digits, d;

    now = new Date();
    timeInMilliseconds = now.getTime() - now.getTimezoneOffset() * 60000;

    digits = {
      'year': {
        method: 'getFullYear',
        value: 0,
        progress: 0,
        getProgress: function() {
            var daysInYear, jan1;
            daysInYear = now.getFullYear() % 4 === 0 ? 366 : 365;
            jan1 = new Date(now.getFullYear(), 0, 1);
            return Math.ceil((now - jan1) / 86400000) / daysInYear;
        }
      },
      'month': {
        method: 'getMonth',
        value: 0,
        progress: 0,
        getProgress: function(value) {
          return now.getDate() / new Date(now.getFullYear(), value, 0).getDate();
        }
      },
      'day': {
        method: 'getDay',
        value: 0,
        progress: 0,
        getProgress: function() {
          return now.getHours() / 24;
        }
      },
      'hour': {
        method: 'getHours',
        value: 0,
        progress: 0,
        getProgress: function(value) {
          return (timeInMilliseconds / 1000 / 60 / 60) % 24 - value;
        }
      },
      'minute': {
        method: 'getMinutes',
        value: 0,
        progress: 0,
        getProgress: function(value) {
          return (timeInMilliseconds / 1000 / 60) % 60 - value;
        }
      },
      'second': {
        method: 'getSeconds',
        value: 0,
        progress: 0,
        getProgress: function(value) {
          return (timeInMilliseconds / 1000) % 60 - value;
        }
      },
      'millisecond': {
        method: 'getMilliseconds',
        value: 0
      }
    };

    for (digit in digits) {
      if ( !digits.hasOwnProperty(digit) ) {
        continue;
      }

      d = digits[digit];
      // sets the value using the appropriate Date method
      d.value = now[d.method]();
      if (d.getProgress) {
        // calculates the relative progress
        d.progress = d.getProgress(d.value);
      }
      // compares with previous digits object to track changes
      if (previousDigits && previousDigits[digit]) {
        d.hasChanged = d.value !== previousDigits[digit].value;
      }
    }

    return digits;
  };


  setTimeObject = function() {
    // get new data structure
    timeObject = getTimeObject(timeObject);
  };

  /**
   * tick : loop used for RAF also applies the callbacks
   * @returns {void}
   */
  tick = function () {
    window.requestAnimationFrame(tick);

    setTimeObject();
    // runs callbacks
    runCallbacks();
  };

  /**
   * initLoop: initialize the RAF Loop
   * @returns {void}
   */
  initLoop = function () {
    setTimeObject();
    window.requestAnimationFrame(tick);
    // makes sure initLoop is called only once
    initLoop = function () {};
  };

  // public methods
  return {
    /**
     * on : registers a callback on a names-pace
     * @param   {String}   eventName the name matching the digits returned by getTimeObject
     * @param   {Function} callback  callback function
     * @returns {void}
     */
    on: function (eventName, callback) {
      if (typeof callbacks[eventName] === 'undefined') {
        registeredCallbacks.push(eventName);
        callbacks[eventName] = [];
      }

      callbacks[eventName].push(callback);

      window.requestAnimationFrame(function () {
        // Makes sure an hour event is called instantly, in just in 54 minutes
        runCallback(callback, eventName);
      });

      initLoop();
    }
  };
}));
