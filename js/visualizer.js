/**
 * visualizer.js
 *
 * Pure rendering layer. Knows nothing about sorting algorithms - it only
 * knows how to turn a step object (array + meta) into bars on screen.
 * Bar DOM elements are created once per array and reused across steps so
 * CSS transitions can animate height/position changes smoothly.
 */
(function (global) {
  'use strict';

  function Visualizer(containerEl) {
    this.container = containerEl;
    this.bars = [];
    this.maxValue = 1;
    this.minValue = 0;
  }

  Visualizer.prototype.build = function (array) {
    this.container.innerHTML = '';
    this.bars = [];

    var values = array.length ? array : [0];
    this.maxValue = Math.max.apply(null, values.map(Math.abs).concat([1]));
    this.minValue = Math.min.apply(null, values.concat([0]));

    var showLabels = array.length <= 30;
    this.container.classList.toggle('bars--dense', !showLabels);

    for (var i = 0; i < array.length; i++) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      bar.setAttribute('data-index', String(i));

      var fill = document.createElement('div');
      fill.className = 'bar__fill';

      var label = document.createElement('div');
      label.className = 'bar__label';
      if (showLabels) label.textContent = String(array[i]);

      bar.appendChild(fill);
      bar.appendChild(label);
      this.container.appendChild(bar);
      this.bars.push({ el: bar, fill: fill, label: label });
    }
  };

  Visualizer.prototype._heightPercent = function (value) {
    var range = this.maxValue - Math.min(0, this.minValue);
    if (range <= 0) range = 1;
    var base = Math.min(0, this.minValue);
    return Math.max(4, ((value - base) / range) * 100);
  };

  Visualizer.prototype.render = function (step) {
    if (!step) return;
    var array = step.array;
    var meta = step.meta || {};

    var sortedSet = new Set(meta.sortedIndices || []);
    var comparing = meta.comparing || [];
    var swapping = meta.swapping || [];
    var activeRange = meta.activeRange || null;
    var mergeRange = meta.mergeRange || null;

    for (var i = 0; i < this.bars.length; i++) {
      var entry = this.bars[i];
      var value = array[i];

      entry.fill.style.height = this._heightPercent(value) + '%';
      if (entry.label.textContent !== '') entry.label.textContent = String(value);

      var classes = ['bar'];
      if (sortedSet.has(i)) classes.push('bar--sorted');
      if (comparing.indexOf(i) !== -1) classes.push('bar--comparing');
      if (swapping.indexOf(i) !== -1) classes.push('bar--swapping');
      if (meta.pivotIndex === i) classes.push('bar--pivot');
      if (meta.minIndex === i) classes.push('bar--min');
      if (meta.keyIndex === i) classes.push('bar--key');
      if (activeRange && (i < activeRange[0] || i > activeRange[1]) && !mergeRange) {
        classes.push('bar--inactive');
      }
      if (mergeRange && (i < mergeRange[0] || i > mergeRange[1])) {
        classes.push('bar--inactive');
      }
      if (meta.leftRange && i >= meta.leftRange[0] && i <= meta.leftRange[1] && mergeRange) {
        classes.push('bar--merge-left');
      }
      if (meta.rightRange && i >= meta.rightRange[0] && i <= meta.rightRange[1] && mergeRange) {
        classes.push('bar--merge-right');
      }

      entry.el.className = classes.join(' ');
    }
  };

  global.SV = global.SV || {};
  global.SV.Visualizer = Visualizer;
})(window);
