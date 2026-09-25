/**
 * main.js
 * Entry point. Instantiates the state, visualizer and UI, then does the
 * initial render.
 */
(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var state = new global.SV.AppState();
    var visualizer = new global.SV.Visualizer(document.getElementById('bars-container'));
    var ui = new global.SV.UI(state, visualizer);

    visualizer.build(state.originalArray);
    ui._renderAlgorithmInfo();
    ui._renderStep();
    ui._renderControlsAvailability();
  });
})(window);
