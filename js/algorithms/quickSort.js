(function (global) {
  'use strict';

  var PSEUDOCODE = [
    { id: 'l1', text: 'quickSort(arr, lo, hi):' },
    { id: 'l2', text: '  pivot = arr[hi]' },
    { id: 'l3', text: '  i = lo - 1' },
    { id: 'l4', text: '  for j in lo..hi-1:' },
    { id: 'l5', text: '    if arr[j] < pivot: i++; swap(arr[i], arr[j])' },
    { id: 'l6', text: '  swap(arr[i+1], arr[hi])   // place pivot' },
    { id: 'l7', text: '  quickSort(arr, lo, i)' },
    { id: 'l7b', text: '  quickSort(arr, i+2, hi)' }
  ];

  function generateTrace(inputArray) {
    var tb = new SV.TraceBuilder(inputArray);
    var n = inputArray.length;

    if (n <= 1) {
      if (n === 1) tb.markSorted([0], 'A single element is already sorted.', 'l1');
      tb.complete();
      return { trace: tb.trace, finalArray: tb.array };
    }

    function partition(lo, hi) {
      var pivotValue = tb.array[hi];
      tb.pivot(hi,
        'Choose ' + pivotValue + ' (index ' + hi + ') as the pivot for range [' + lo + '..' + hi + '].',
        'l2',
        { pivotIndex: hi, activeRange: [lo, hi] });

      var i = lo - 1;
      for (var j = lo; j < hi; j++) {
        tb.compare(j, hi,
          'Compare ' + tb.array[j] + ' with pivot ' + pivotValue + '.',
          'l4',
          { pivotIndex: hi, activeRange: [lo, hi] });

        if (tb.array[j] < pivotValue) {
          i++;
          if (i !== j) {
            tb.swap(i, j,
              tb.array[j] + ' < pivot, so swap it into the "smaller than pivot" region.',
              'l5',
              { pivotIndex: hi, activeRange: [lo, hi] });
          }
        }
      }

      tb.swap(i + 1, hi,
        'Place pivot ' + pivotValue + ' at its correct sorted position, index ' + (i + 1) + '.',
        'l6',
        { pivotIndex: hi, activeRange: [lo, hi] });

      tb.markSorted([i + 1], 'Pivot ' + pivotValue + ' is now in its final sorted position.', 'l6');
      return i + 1;
    }

    function sort(lo, hi) {
      tb.stats.recursiveCalls++;
      if (lo > hi) return;
      if (lo === hi) {
        tb.markSorted([lo], 'Range [' + lo + '..' + hi + '] has a single element, so it is already sorted.', 'l1');
        return;
      }
      tb.rangeEvent('partition', [lo, hi],
        'Partitioning range [' + lo + '..' + hi + ']. Elements smaller than the pivot move to its left.',
        'l1',
        { activeRange: [lo, hi] });

      var p = partition(lo, hi);
      sort(lo, p - 1);
      sort(p + 1, hi);
    }

    sort(0, n - 1);
    tb.complete();
    return { trace: tb.trace, finalArray: tb.array };
  }

  global.SV = global.SV || {};
  global.SV.algorithms = global.SV.algorithms || {};
  global.SV.algorithms.quick = {
    key: 'quick',
    name: 'Quick Sort',
    description: 'A divide-and-conquer algorithm that picks a pivot, partitions the array so smaller elements land left of it and larger ones right, then recursively sorts each side.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n\u00B2)', space: 'O(log n)', stable: 'No', inPlace: 'Yes' },
    pseudocode: PSEUDOCODE,
    generateTrace: generateTrace
  };
})(window);
