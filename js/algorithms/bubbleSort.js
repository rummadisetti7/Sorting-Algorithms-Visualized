/**
 * bubbleSort.js
 * Pure algorithm logic: takes an array, returns { trace, finalArray }.
 * Never touches the DOM.
 */
(function (global) {
  'use strict';

  var PSEUDOCODE = [
    { id: 'l1', text: 'for i in 0..n-1:' },
    { id: 'l2', text: '  for j in 0..n-i-2:' },
    { id: 'l3', text: '    if arr[j] > arr[j+1]:' },
    { id: 'l4', text: '      swap(arr[j], arr[j+1])' },
    { id: 'l5', text: '  mark arr[n-i-1] as sorted' }
  ];

  function generateTrace(inputArray) {
    var tb = new SV.TraceBuilder(inputArray);
    var n = inputArray.length;

    if (n <= 1) {
      if (n === 1) tb.markSorted([0], 'A single element is already sorted.', 'l1');
      tb.complete();
      return { trace: tb.trace, finalArray: tb.array };
    }

    for (var i = 0; i < n; i++) {
      var swappedThisPass = false;
      for (var j = 0; j < n - i - 1; j++) {
        tb.compare(j, j + 1,
          'Compare ' + tb.array[j] + ' and ' + tb.array[j + 1] + '.',
          'l3',
          { activeRange: [0, n - i - 1] });

        if (tb.array[j] > tb.array[j + 1]) {
          tb.swap(j, j + 1,
            tb.array[j] + ' > ' + tb.array[j + 1] + ', so swap them.',
            'l4',
            { activeRange: [0, n - i - 1] });
          swappedThisPass = true;
        }
      }
      tb.markSorted([n - i - 1],
        'End of pass ' + (i + 1) + ': the largest remaining element has reached its final position.',
        'l5');

      if (!swappedThisPass) {
        // Nothing moved this pass - everything left is already sorted.
        var remaining = [];
        for (var k = 0; k < n - i - 1; k++) remaining.push(k);
        if (remaining.length) {
          tb.markSorted(remaining, 'No swaps were needed this pass, so the rest of the array is already sorted.', 'l1');
        }
        break;
      }
    }

    tb.complete();
    return { trace: tb.trace, finalArray: tb.array };
  }

  global.SV = global.SV || {};
  global.SV.algorithms = global.SV.algorithms || {};
  global.SV.algorithms.bubble = {
    key: 'bubble',
    name: 'Bubble Sort',
    description: 'Repeatedly compares adjacent elements and swaps them when they are in the wrong order. After each pass, the largest remaining element "bubbles" up to its final position.',
    complexity: { best: 'O(n)', average: 'O(n\u00B2)', worst: 'O(n\u00B2)', space: 'O(1)', stable: 'Yes', inPlace: 'Yes' },
    pseudocode: PSEUDOCODE,
    generateTrace: generateTrace
  };
})(window);
