/**
 * traceBuilder.js
 *
 * A small shared helper that every sorting algorithm uses to record its
 * execution as a flat, ordered list of "steps". Algorithms never touch the
 * DOM - they only call methods on a TraceBuilder, which snapshots the array
 * and running statistics after every logical operation.
 *
 * This is what keeps sorting logic and rendering logic completely decoupled:
 * the visualizer only ever consumes the plain step objects produced here.
 */
(function (global) {
  'use strict';

  /**
   * @param {number[]} initialArray
   */
  function TraceBuilder(initialArray) {
    this.array = initialArray.slice();
    this.trace = [];
    this.stats = {
      comparisons: 0,
      swaps: 0,
      shifts: 0,
      writes: 0,
      merges: 0,
      recursiveCalls: 0
    };
    // Indices that are in their final, confirmed-sorted position.
    this.sortedIndices = new Set();
  }

  /**
   * Internal: push a fully-formed step, snapshotting current array + stats.
   * @param {string} type
   * @param {number[]} indices
   * @param {string} message
   * @param {string} codeLine
   * @param {object} meta
   */
  TraceBuilder.prototype._push = function (type, indices, message, codeLine, meta) {
    this.trace.push({
      type: type,
      array: this.array.slice(),
      indices: indices || [],
      message: message || '',
      codeLine: codeLine || null,
      stats: {
        comparisons: this.stats.comparisons,
        swaps: this.stats.swaps,
        shifts: this.stats.shifts,
        writes: this.stats.writes,
        merges: this.stats.merges,
        recursiveCalls: this.stats.recursiveCalls
      },
      meta: Object.assign({
        comparing: null,
        swapping: null,
        pivotIndex: null,
        minIndex: null,
        keyIndex: null,
        activeRange: null,
        mergeRange: null,
        leftRange: null,
        rightRange: null,
        sortedIndices: Array.from(this.sortedIndices).sort(function (a, b) { return a - b; })
      }, meta || {})
    });
  };

  /** Record a comparison between two indices (no mutation). */
  TraceBuilder.prototype.compare = function (i, j, message, codeLine, meta) {
    this.stats.comparisons++;
    this._push('compare', [i, j], message, codeLine, Object.assign({ comparing: [i, j] }, meta));
  };

  /** Swap two indices in place and record it. */
  TraceBuilder.prototype.swap = function (i, j, message, codeLine, meta) {
    var tmp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = tmp;
    this.stats.swaps++;
    this._push('swap', [i, j], message, codeLine, Object.assign({ swapping: [i, j] }, meta));
  };

  /** Record selection of a "current" element (min candidate, key, etc). */
  TraceBuilder.prototype.select = function (index, message, codeLine, meta) {
    this._push('select', [index], message, codeLine, meta);
  };

  /** Shift a value from `from` to `to` (used by insertion sort). */
  TraceBuilder.prototype.shift = function (from, to, message, codeLine, meta) {
    this.array[to] = this.array[from];
    this.stats.shifts++;
    this._push('shift', [from, to], message, codeLine, meta);
  };

  /** Directly place a value at an index (used by insertion + merge sort). */
  TraceBuilder.prototype.write = function (index, value, message, codeLine, meta) {
    this.array[index] = value;
    this.stats.writes++;
    this._push('insert', [index], message, codeLine, meta);
  };

  /** Announce a pivot choice (quick sort). */
  TraceBuilder.prototype.pivot = function (index, message, codeLine, meta) {
    this._push('pivot', [index], message, codeLine, Object.assign({ pivotIndex: index }, meta));
  };

  /** Announce the start of work on a sub-range (partition / split). */
  TraceBuilder.prototype.rangeEvent = function (type, range, message, codeLine, meta) {
    this._push(type, [], message, codeLine, Object.assign({ activeRange: range }, meta));
  };

  /** Record a merge-step write (merge sort placing an element). */
  TraceBuilder.prototype.mergeWrite = function (index, value, mergeRange, message, codeLine, meta) {
    this.array[index] = value;
    this.stats.writes++;
    this.stats.merges++;
    this._push('merge', [index], message, codeLine, Object.assign({ mergeRange: mergeRange }, meta));
  };

  /** Mark one or more indices as permanently sorted. */
  TraceBuilder.prototype.markSorted = function (indices, message, codeLine, meta) {
    var self = this;
    indices.forEach(function (i) { self.sortedIndices.add(i); });
    this._push('sorted', indices, message, codeLine, meta);
  };

  /** Final "algorithm complete" step. */
  TraceBuilder.prototype.complete = function (message) {
    for (var i = 0; i < this.array.length; i++) this.sortedIndices.add(i);
    this._push('complete', [], message || 'Array is fully sorted.', null, {});
  };

  /** Generic escape hatch for algorithm-specific step types. */
  TraceBuilder.prototype.custom = function (type, indices, message, codeLine, meta) {
    this._push(type, indices, message, codeLine, meta);
  };

  global.SV = global.SV || {};
  global.SV.TraceBuilder = TraceBuilder;
})(window);
