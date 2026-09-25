(function (global) {
  'use strict';

  var PSEUDOCODE = [
    { id: 'l1', text: 'for i in 1..n-1:' },
    { id: 'l2', text: '  key = arr[i]' },
    { id: 'l3', text: '  j = i - 1' },
    { id: 'l4', text: '  while j >= 0 and arr[j] > key:' },
    { id: 'l5', text: '    arr[j+1] = arr[j]' },
    { id: 'l6', text: '    j = j - 1' },
    { id: 'l7', text: '  arr[j+1] = key' }
  ];

  function generateTrace(inputArray) {
    var tb = new SV.TraceBuilder(inputArray);
    var n = inputArray.length;

    if (n <= 1) {
      if (n === 1) tb.markSorted([0], 'A single element is already sorted.', 'l1');
      tb.complete();
      return { trace: tb.trace, finalArray: tb.array };
    }

    tb.markSorted([0], 'The first element trivially forms a sorted portion of size 1.', 'l1');

    for (var i = 1; i < n; i++) {
      var key = tb.array[i];
      tb.select(i, 'Pick up key = ' + key + ' (index ' + i + ') to insert into the sorted portion.', 'l2',
        { keyIndex: i, activeRange: [0, i] });

      var j = i - 1;
      var shiftedTo = i;

      while (j >= 0) {
        tb.compare(j, i,
          'Compare key ' + key + ' with ' + tb.array[j] + ' at index ' + j + '.',
          'l4',
          { keyIndex: i, activeRange: [0, i] });

        if (tb.array[j] > key) {
          tb.shift(j, j + 1,
            tb.array[j] + ' > key, so shift it one position right.',
            'l5',
            { keyIndex: i, activeRange: [0, i] });
          shiftedTo = j;
          j--;
        } else {
          break;
        }
      }

      if (shiftedTo !== i || tb.array[j + 1] !== key) {
        tb.write(j + 1, key,
          'Insert key ' + key + ' into its correct position at index ' + (j + 1) + '.',
          'l7',
          { keyIndex: j + 1, activeRange: [0, i] });
      }

      var sortedRange = [];
      for (var k = 0; k <= i; k++) sortedRange.push(k);
      tb.markSorted(sortedRange, 'The sorted portion now spans indices 0 to ' + i + '.', 'l7');
    }

    tb.complete();
    return { trace: tb.trace, finalArray: tb.array };
  }

  global.SV = global.SV || {};
  global.SV.algorithms = global.SV.algorithms || {};
  global.SV.algorithms.insertion = {
    key: 'insertion',
    name: 'Insertion Sort',
    description: 'Builds up a sorted portion one element at a time, taking each new "key" element and shifting larger elements right until it finds its correct position.',
    complexity: { best: 'O(n)', average: 'O(n\u00B2)', worst: 'O(n\u00B2)', space: 'O(1)', stable: 'Yes', inPlace: 'Yes' },
    pseudocode: PSEUDOCODE,
    generateTrace: generateTrace
  };
})(window);
