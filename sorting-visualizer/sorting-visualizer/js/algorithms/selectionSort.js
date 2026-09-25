(function (global) {
  'use strict';

  var PSEUDOCODE = [
    { id: 'l1', text: 'for i in 0..n-1:' },
    { id: 'l2', text: '  min = i' },
    { id: 'l3', text: '  for j in i+1..n-1:' },
    { id: 'l4', text: '    if arr[j] < arr[min]:' },
    { id: 'l5', text: '      min = j' },
    { id: 'l6', text: '  swap(arr[i], arr[min])' }
  ];

  function generateTrace(inputArray) {
    var tb = new SV.TraceBuilder(inputArray);
    var n = inputArray.length;

    if (n <= 1) {
      if (n === 1) tb.markSorted([0], 'A single element is already sorted.', 'l1');
      tb.complete();
      return { trace: tb.trace, finalArray: tb.array };
    }

    for (var i = 0; i < n - 1; i++) {
      var minIndex = i;
      tb.select(minIndex, 'Assume ' + tb.array[minIndex] + ' (index ' + minIndex + ') is the minimum of the unsorted portion.', 'l2',
        { minIndex: minIndex, activeRange: [i, n - 1] });

      for (var j = i + 1; j < n; j++) {
        tb.compare(j, minIndex,
          'Compare ' + tb.array[j] + ' with current minimum ' + tb.array[minIndex] + '.',
          'l4',
          { minIndex: minIndex, activeRange: [i, n - 1] });

        if (tb.array[j] < tb.array[minIndex]) {
          minIndex = j;
          tb.select(minIndex,
            'Found a smaller element: ' + tb.array[minIndex] + '. Minimum index updates to ' + minIndex + '.',
            'l5',
            { minIndex: minIndex, activeRange: [i, n - 1] });
        }
      }

      if (minIndex !== i) {
        tb.swap(i, minIndex,
          'Swap ' + tb.array[i] + ' and ' + tb.array[minIndex] + ' to place the minimum at index ' + i + '.',
          'l6',
          { activeRange: [i, n - 1] });
      }

      tb.markSorted([i], 'Index ' + i + ' now holds its final, sorted value.', 'l6');
    }
    tb.markSorted([n - 1], 'Only one element remains, so it is already in place.', 'l1');

    tb.complete();
    return { trace: tb.trace, finalArray: tb.array };
  }

  global.SV = global.SV || {};
  global.SV.algorithms = global.SV.algorithms || {};
  global.SV.algorithms.selection = {
    key: 'selection',
    name: 'Selection Sort',
    description: 'Repeatedly finds the minimum element in the unsorted portion of the array and swaps it into place at the front of that portion.',
    complexity: { best: 'O(n\u00B2)', average: 'O(n\u00B2)', worst: 'O(n\u00B2)', space: 'O(1)', stable: 'No', inPlace: 'Yes' },
    pseudocode: PSEUDOCODE,
    generateTrace: generateTrace
  };
})(window);
