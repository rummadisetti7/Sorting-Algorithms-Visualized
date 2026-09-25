/**
 * state.js
 *
 * Owns all application state: which algorithm is selected, the working
 * array, the generated execution trace, the current position within that
 * trace, and playback (play/pause) status. Nothing here touches the DOM -
 * it only notifies subscribed listeners when something changes, so the UI
 * layer can re-render.
 */
(function (global) {
  'use strict';

  var MIN_ARRAY_SIZE = 5;
  var MAX_ARRAY_SIZE = 50;
  var DEFAULT_ARRAY_SIZE = 20;
  var MIN_VALUE = 5;
  var MAX_VALUE = 100;

  // Speed presets, expressed as milliseconds between steps (lower = faster).
  var SPEED_PRESETS = [900, 600, 350, 180, 80];
  var DEFAULT_SPEED_INDEX = 2;

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function randomArray(size) {
    var arr = [];
    for (var i = 0; i < size; i++) {
      arr.push(Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE);
    }
    return arr;
  }

  function AppState() {
    this.algorithmKey = 'bubble';
    this.originalArray = randomArray(DEFAULT_ARRAY_SIZE);
    this.trace = [];
    this.currentIndex = 0;
    this.playing = false;
    this.timerId = null;
    this.speedIndex = DEFAULT_SPEED_INDEX;
    this._listeners = [];
    this._rebuildTrace();
  }

  AppState.prototype.subscribe = function (fn) {
    this._listeners.push(fn);
    return function unsubscribe() {
      var idx = this._listeners.indexOf(fn);
      if (idx !== -1) this._listeners.splice(idx, 1);
    }.bind(this);
  };

  AppState.prototype._emit = function (eventName) {
    for (var i = 0; i < this._listeners.length; i++) {
      this._listeners[i](eventName, this);
    }
  };

  AppState.prototype._rebuildTrace = function () {
    this.pause();
    var algorithm = global.SV.algorithms[this.algorithmKey];
    var result = algorithm.generateTrace(this.originalArray);
    this.trace = result.trace;
    this.currentIndex = 0;
  };

  AppState.prototype.getAlgorithm = function () {
    return global.SV.algorithms[this.algorithmKey];
  };

  AppState.prototype.getCurrentStep = function () {
    if (!this.trace.length) return null;
    return this.trace[this.currentIndex];
  };

  AppState.prototype.setAlgorithm = function (key) {
    if (!global.SV.algorithms[key] || key === this.algorithmKey) return;
    this.algorithmKey = key;
    this._rebuildTrace();
    this._emit('algorithm-changed');
  };

  AppState.prototype.setArray = function (arr) {
    this.pause();
    this.originalArray = arr.slice();
    this._rebuildTrace();
    this._emit('array-changed');
  };

  AppState.prototype.randomizeArray = function (size) {
    var n = clamp(size || this.originalArray.length, MIN_ARRAY_SIZE, MAX_ARRAY_SIZE);
    this.setArray(randomArray(n));
  };

  AppState.prototype.resizeArray = function (size) {
    this.randomizeArray(size);
  };

  /**
   * Parse a user-supplied comma/space separated list of numbers.
   * Returns { ok: true, array } or { ok: false, error }.
   */
  AppState.prototype.parseCustomArray = function (text) {
    if (!text || !text.trim()) {
      return { ok: false, error: 'Please enter at least one number.' };
    }
    var parts = text.split(/[\s,]+/).filter(function (p) { return p.length > 0; });
    if (parts.length < 1) {
      return { ok: false, error: 'Please enter at least one number.' };
    }
    if (parts.length > MAX_ARRAY_SIZE) {
      return { ok: false, error: 'Please enter at most ' + MAX_ARRAY_SIZE + ' numbers.' };
    }
    var values = [];
    for (var i = 0; i < parts.length; i++) {
      var n = Number(parts[i]);
      if (!isFinite(n) || isNaN(n)) {
        return { ok: false, error: '"' + parts[i] + '" is not a valid number.' };
      }
      values.push(Math.round(n));
    }
    return { ok: true, array: values };
  };

  AppState.prototype.goTo = function (index) {
    if (!this.trace.length) return;
    this.currentIndex = clamp(index, 0, this.trace.length - 1);
    this._emit('step-changed');
  };

  AppState.prototype.next = function () {
    if (this.currentIndex >= this.trace.length - 1) {
      this.pause();
      return false;
    }
    this.currentIndex++;
    this._emit('step-changed');
    return true;
  };

  AppState.prototype.previous = function () {
    if (this.currentIndex <= 0) return false;
    this.currentIndex--;
    this._emit('step-changed');
    return true;
  };

  AppState.prototype.first = function () {
    this.pause();
    this.goTo(0);
  };

  AppState.prototype.last = function () {
    this.pause();
    this.goTo(this.trace.length - 1);
  };

  AppState.prototype.reset = function () {
    this.pause();
    this._rebuildTrace();
    this._emit('reset');
  };

  AppState.prototype.isAtEnd = function () {
    return this.currentIndex >= this.trace.length - 1;
  };

  AppState.prototype.setSpeedIndex = function (index) {
    this.speedIndex = clamp(index, 0, SPEED_PRESETS.length - 1);
    if (this.playing) {
      // Restart the timer at the new interval.
      this.pause();
      this.play();
    }
    this._emit('speed-changed');
  };

  AppState.prototype.play = function () {
    if (this.playing) return;
    if (this.isAtEnd()) this.goTo(0);
    this.playing = true;
    this._emit('play-state-changed');
    var self = this;
    this.timerId = global.setInterval(function () {
      var advanced = self.next();
      if (!advanced) self.pause();
    }, SPEED_PRESETS[this.speedIndex]);
  };

  AppState.prototype.pause = function () {
    if (this.timerId !== null) {
      global.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.playing) {
      this.playing = false;
      this._emit('play-state-changed');
    }
  };

  AppState.prototype.togglePlay = function () {
    if (this.playing) this.pause();
    else this.play();
  };

  global.SV = global.SV || {};
  global.SV.AppState = AppState;
  global.SV.constants = {
    MIN_ARRAY_SIZE: MIN_ARRAY_SIZE,
    MAX_ARRAY_SIZE: MAX_ARRAY_SIZE,
    DEFAULT_ARRAY_SIZE: DEFAULT_ARRAY_SIZE,
    MIN_VALUE: MIN_VALUE,
    MAX_VALUE: MAX_VALUE,
    SPEED_PRESETS: SPEED_PRESETS,
    DEFAULT_SPEED_INDEX: DEFAULT_SPEED_INDEX
  };
})(window);
