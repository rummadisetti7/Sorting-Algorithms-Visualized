/**
 * ui.js
 *
 * The only layer that touches the DOM for controls, stats, explanations
 * and pseudocode. It subscribes to AppState changes and asks the
 * Visualizer to redraw bars; it never contains sorting logic itself.
 */
(function (global) {
  'use strict';

  var TYPE_LABELS = {
    compare: 'Compare',
    swap: 'Swap',
    select: 'Select',
    shift: 'Shift',
    insert: 'Insert',
    pivot: 'Pivot',
    partition: 'Partition',
    merge: 'Merge',
    split: 'Split',
    sorted: 'Sorted',
    complete: 'Complete'
  };

  var STAT_FIELDS = {
    bubble: [['comparisons', 'Comparisons'], ['swaps', 'Swaps']],
    selection: [['comparisons', 'Comparisons'], ['swaps', 'Swaps']],
    insertion: [['comparisons', 'Comparisons'], ['shifts', 'Shifts']],
    merge: [['comparisons', 'Comparisons'], ['merges', 'Merge writes'], ['recursiveCalls', 'Recursive calls']],
    quick: [['comparisons', 'Comparisons'], ['swaps', 'Swaps'], ['recursiveCalls', 'Recursive calls']]
  };

  function el(id) { return document.getElementById(id); }

  function UI(state, visualizer) {
    this.state = state;
    this.visualizer = visualizer;
    this._cacheDom();
    this._bindEvents();
    this.state.subscribe(this._onStateEvent.bind(this));
    this._prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  UI.prototype._cacheDom = function () {
    this.dom = {
      algorithmSelect: el('algorithm-select'),
      arraySize: el('array-size'),
      arraySizeValue: el('array-size-value'),
      randomizeBtn: el('randomize-btn'),
      customInput: el('custom-array-input'),
      applyCustomBtn: el('apply-custom-array-btn'),
      customError: el('custom-array-error'),

      barsContainer: el('bars-container'),
      statsBar: el('stats-bar'),
      progressFill: el('progress-fill'),

      btnFirst: el('btn-first'),
      btnPrev: el('btn-prev'),
      btnPlay: el('btn-play'),
      btnNext: el('btn-next'),
      btnLast: el('btn-last'),
      btnReset: el('btn-reset'),
      speedSlider: el('speed-slider'),

      stepMessage: el('step-message'),
      stepCode: el('step-code'),

      algoName: el('algo-name'),
      algoDescription: el('algo-description'),
      cBest: el('c-best'),
      cAverage: el('c-average'),
      cWorst: el('c-worst'),
      cSpace: el('c-space'),
      cStable: el('c-stable'),
      cInplace: el('c-inplace'),
      pseudocodeBlock: el('pseudocode-block')
    };
  };

  UI.prototype._bindEvents = function () {
    var self = this;
    var state = this.state;

    this.dom.algorithmSelect.addEventListener('change', function (e) {
      state.setAlgorithm(e.target.value);
    });

    this.dom.arraySize.addEventListener('input', function (e) {
      self.dom.arraySizeValue.textContent = e.target.value;
    });
    this.dom.arraySize.addEventListener('change', function (e) {
      state.randomizeArray(Number(e.target.value));
    });

    this.dom.randomizeBtn.addEventListener('click', function () {
      state.randomizeArray(Number(self.dom.arraySize.value));
    });

    this.dom.applyCustomBtn.addEventListener('click', function () {
      self._applyCustomArray();
    });
    this.dom.customInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') self._applyCustomArray();
    });

    this.dom.btnFirst.addEventListener('click', function () { state.first(); });
    this.dom.btnPrev.addEventListener('click', function () { state.pause(); state.previous(); });
    this.dom.btnNext.addEventListener('click', function () { state.pause(); state.next(); });
    this.dom.btnLast.addEventListener('click', function () { state.last(); });
    this.dom.btnReset.addEventListener('click', function () { state.reset(); });
    this.dom.btnPlay.addEventListener('click', function () { state.togglePlay(); });

    this.dom.speedSlider.addEventListener('input', function (e) {
      state.setSpeedIndex(Number(e.target.value));
    });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); state.togglePlay(); }
      else if (e.code === 'ArrowRight') { state.pause(); state.next(); }
      else if (e.code === 'ArrowLeft') { state.pause(); state.previous(); }
    });
  };

  UI.prototype._applyCustomArray = function () {
    var result = this.state.parseCustomArray(this.dom.customInput.value);
    if (!result.ok) {
      this.dom.customError.textContent = result.error;
      return;
    }
    if (result.array.length > global.SV.constants.MAX_ARRAY_SIZE) {
      this.dom.customError.textContent = 'Please enter at most ' + global.SV.constants.MAX_ARRAY_SIZE + ' numbers.';
      return;
    }
    this.dom.customError.textContent = '';
    this.dom.arraySize.value = String(result.array.length);
    this.dom.arraySizeValue.textContent = String(result.array.length);
    this.state.setArray(result.array);
  };

  UI.prototype._onStateEvent = function (eventName) {
    if (eventName === 'algorithm-changed') this._renderAlgorithmInfo();
    if (eventName === 'algorithm-changed' || eventName === 'array-changed' || eventName === 'reset') {
      this.visualizer.build(this.state.originalArray);
    }
    this._renderStep();
    this._renderControlsAvailability();
  };

  UI.prototype._renderAlgorithmInfo = function () {
    var algo = this.state.getAlgorithm();
    this.dom.algorithmSelect.value = algo.key;
    this.dom.algoName.textContent = algo.name;
    this.dom.algoDescription.textContent = algo.description;
    this.dom.cBest.textContent = algo.complexity.best;
    this.dom.cAverage.textContent = algo.complexity.average;
    this.dom.cWorst.textContent = algo.complexity.worst;
    this.dom.cSpace.textContent = algo.complexity.space;
    this.dom.cStable.textContent = algo.complexity.stable;
    this.dom.cInplace.textContent = algo.complexity.inPlace;

    var lines = algo.pseudocode.map(function (line) {
      return '<span class="pc-line" data-id="' + line.id + '">' + escapeHtml(line.text) + '</span>';
    });
    this.dom.pseudocodeBlock.innerHTML = lines.join('\n');
  };

  UI.prototype._renderStep = function () {
    var step = this.state.getCurrentStep();
    this.visualizer.render(step);

    if (!step) {
      this.dom.stepMessage.textContent = 'This array has no steps to show.';
      this.dom.stepCode.textContent = '';
    } else {
      var label = TYPE_LABELS[step.type] || step.type;
      this.dom.stepMessage.innerHTML = '<span class="step-badge step-badge--' + step.type + '">' + label + '</span> ' + escapeHtml(step.message);

      if (step.codeLine) {
        var algo = this.state.getAlgorithm();
        var line = algo.pseudocode.filter(function (l) { return l.id === step.codeLine; })[0];
        this.dom.stepCode.textContent = line ? line.text : '';
        this._highlightPseudocode(step.codeLine);
      } else {
        this.dom.stepCode.textContent = '';
        this._highlightPseudocode(null);
      }
    }

    this._renderStats();
    var total = this.state.trace.length;
    var pct = total > 1 ? (this.state.currentIndex / (total - 1)) * 100 : 0;
    this.dom.progressFill.style.width = pct + '%';
  };

  UI.prototype._highlightPseudocode = function (codeId) {
    var spans = this.dom.pseudocodeBlock.querySelectorAll('.pc-line');
    for (var i = 0; i < spans.length; i++) {
      spans[i].classList.toggle('pc-line--active', codeId && spans[i].getAttribute('data-id') === codeId);
    }
  };

  UI.prototype._renderStats = function () {
    var step = this.state.getCurrentStep();
    var stats = step ? step.stats : { comparisons: 0, swaps: 0, shifts: 0, merges: 0, recursiveCalls: 0 };
    var fields = STAT_FIELDS[this.state.algorithmKey] || STAT_FIELDS.bubble;
    var total = this.state.trace.length;

    var html = '';
    html += '<div class="stat"><span class="stat__label">Step</span><span class="stat__value">' +
      (total ? (this.state.currentIndex + 1) : 0) + ' / ' + total + '</span></div>';
    for (var i = 0; i < fields.length; i++) {
      html += '<div class="stat"><span class="stat__label">' + fields[i][1] + '</span><span class="stat__value">' + stats[fields[i][0]] + '</span></div>';
    }
    html += '<div class="stat"><span class="stat__label">Array size</span><span class="stat__value">' + this.state.originalArray.length + '</span></div>';
    this.dom.statsBar.innerHTML = html;
  };

  UI.prototype._renderControlsAvailability = function () {
    var state = this.state;
    var atStart = state.currentIndex <= 0;
    var atEnd = state.isAtEnd();

    this.dom.btnFirst.disabled = atStart;
    this.dom.btnPrev.disabled = atStart;
    this.dom.btnNext.disabled = atEnd;
    this.dom.btnLast.disabled = atEnd;
    this.dom.btnPlay.disabled = atEnd && !state.playing;
    this.dom.btnPlay.innerHTML = state.playing ? '&#10074;&#10074; Pause' : '&#9654; Play';
    this.dom.btnPlay.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');

    // Switching algorithms mid-playback is safe (it auto-pauses and rebuilds
    // the trace), so only the array-editing controls are locked while
    // playing - replacing the array out from under an active animation is
    // what would actually be confusing.
    var lockArrayEditsDuringPlayback = state.playing;
    this.dom.randomizeBtn.disabled = lockArrayEditsDuringPlayback;
    this.dom.applyCustomBtn.disabled = lockArrayEditsDuringPlayback;
    this.dom.arraySize.disabled = lockArrayEditsDuringPlayback;
  };

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  global.SV = global.SV || {};
  global.SV.UI = UI;
})(window);
