(function (global) {
  'use strict';

  var PSEUDOCODE = [
    { id: 'l1', text: 'mergeSort(arr, lo, hi):' },
    { id: 'l2', text: '  if lo >= hi: return' },
    { id: 'l3', text: '  mid = (lo + hi) / 2' },
    { id: 'l4', text: '  mergeSort(arr, lo, mid)' },
    { id: 'l4b', text: '  mergeSort(arr, mid+1, hi)' },
    { id: 'l5', text: '  merge(arr, lo, mid, hi)' },
    { id: 'l6', text: '  while left and right remain:' },
    { id: 'l7', text: '    take smaller of the two fronts' },
    { id: 'l9', text: '  copy any remaining elements' }
  ];

  function generateTrace(inputArray) {
    var tb = new SV.TraceBuilder(inputArray);
    var n = inputArray.length;

    if (n <= 1) {
      if (n === 1) tb.markSorted([0], 'A single element is already sorted.', 'l2');
      tb.complete();
      return { trace: tb.trace, finalArray: tb.array };
    }

    function merge(lo, mid, hi) {
      var leftArr = tb.array.slice(lo, mid + 1);
      var rightArr = tb.array.slice(mid + 1, hi + 1);

      tb.rangeEvent('merge', [lo, hi],
        'Merging the two sorted subarrays [' + lo + '..' + mid + '] and [' + (mid + 1) + '..' + hi + '].',
        'l5',
        { mergeRange: [lo, hi], leftRange: [lo, mid], rightRange: [mid + 1, hi] });

      var i = 0, j = 0, k = lo;
      while (i < leftArr.length && j < rightArr.length) {
        tb.compare(lo + i, mid + 1 + j,
          'Compare ' + leftArr[i] + ' (left) with ' + rightArr[j] + ' (right).',
          'l7',
          { mergeRange: [lo, hi], leftRange: [lo, mid], rightRange: [mid + 1, hi] });

        if (leftArr[i] <= rightArr[j]) {
          tb.mergeWrite(k, leftArr[i], [lo, hi],
            leftArr[i] + ' is smaller or equal, so place it at index ' + k + '.',
            'l7',
            { leftRange: [lo, mid], rightRange: [mid + 1, hi] });
          i++;
        } else {
          tb.mergeWrite(k, rightArr[j], [lo, hi],
            rightArr[j] + ' is smaller, so place it at index ' + k + '.',
            'l7',
            { leftRange: [lo, mid], rightRange: [mid + 1, hi] });
          j++;
        }
        k++;
      }
      while (i < leftArr.length) {
        tb.mergeWrite(k, leftArr[i], [lo, hi],
          'Copy remaining left element ' + leftArr[i] + ' to index ' + k + '.',
          'l9',
          { leftRange: [lo, mid], rightRange: [mid + 1, hi] });
        i++; k++;
      }
      while (j < rightArr.length) {
        tb.mergeWrite(k, rightArr[j], [lo, hi],
          'Copy remaining right element ' + rightArr[j] + ' to index ' + k + '.',
          'l9',
          { leftRange: [lo, mid], rightRange: [mid + 1, hi] });
        j++; k++;
      }

      if (lo === 0 && hi === n - 1) {
        var all = [];
        for (var idx = 0; idx < n; idx++) all.push(idx);
        tb.markSorted(all, 'The full array is now merged and sorted.', 'l5');
      }
    }

    function sort(lo, hi) {
      tb.stats.recursiveCalls++;
      if (lo >= hi) {
        if (lo === hi) {
          tb.rangeEvent('split', [lo, hi],
            'Range [' + lo + '..' + hi + '] has a single element, so it is already sorted.',
            'l2',
            { activeRange: [lo, hi] });
        }
        return;
      }
      var mid = Math.floor((lo + hi) / 2);
      tb.rangeEvent('split', [lo, hi],
        'Split range [' + lo + '..' + hi + '] into [' + lo + '..' + mid + '] and [' + (mid + 1) + '..' + hi + '].',
        'l3',
        { activeRange: [lo, hi], leftRange: [lo, mid], rightRange: [mid + 1, hi] });

      sort(lo, mid);
      sort(mid + 1, hi);
      merge(lo, mid, hi);
    }

    sort(0, n - 1);
    tb.complete();
    return { trace: tb.trace, finalArray: tb.array };
  }

  global.SV = global.SV || {};
  global.SV.algorithms = global.SV.algorithms || {};
  global.SV.algorithms.merge = {
    key: 'merge',
    name: 'Merge Sort',
    description: 'A divide-and-conquer algorithm that recursively splits the array in half, sorts each half, and then merges the two sorted halves back together.',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: 'Yes', inPlace: 'No' },
    pseudocode: PSEUDOCODE,
    generateTrace: generateTrace
  };
})(window);
