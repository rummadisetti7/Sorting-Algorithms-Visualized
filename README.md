# Sorting Visualizer

A step-by-step sorting algorithm visualizer built with HTML, CSS and vanilla
JavaScript. No frameworks, no build tools, no external dependencies &mdash;
open `index.html` and it runs.

**[Live view]** — once deployed to GitHub Pages, this will be at
`https://rummadisetti7.github.io/Sorting-Algorithms-Visualized/`

## Algorithms

- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort

## Features

- Step-by-step execution (Next / Previous), not just an animation
- Play / Pause with an adjustable speed slider
- Jump to first / last step, and Reset
- Random array generation with an adjustable size (5&ndash;50 elements)
- Custom array input, with graceful validation of bad input
- Live operation statistics (comparisons, swaps, shifts, merges, recursive
  calls &mdash; whichever apply to the selected algorithm)
- A plain-language explanation of the current operation, generated from the
  step's own data rather than hand-written per animation
- Complexity and stability reference for every algorithm
- A collapsible pseudocode panel, with the active line highlighted as you
  step through execution
- Responsive layout for desktop, tablet and mobile
- Respects `prefers-reduced-motion`

## Architecture

The core idea: **algorithms never touch the DOM.**

```
sorting logic  →  execution trace  →  visualizer / playback engine  →  UI
```

1. **Algorithms** (`js/algorithms/*.js`) run the real sorting logic against
   a plain array. Every comparison, swap, shift, pivot choice, partition,
   split and merge calls a method on a shared `TraceBuilder`
   (`js/traceBuilder.js`), which snapshots the array state, the running
   statistics, and a small metadata object (which indices are being
   compared, which one is the pivot, which range is active, etc.) into a
   flat, ordered list of **steps**.

   A step looks roughly like this:

   ```js
   {
     type: "swap",
     array: [3, 7, 9, 2, 5],   // full array snapshot AFTER this step
     indices: [2, 3],
     message: "8 > 3, so swap them.",
     codeLine: "l4",           // id into that algorithm's pseudocode
     stats: { comparisons: 9, swaps: 4, ... },
     meta: { swapping: [2, 3], sortedIndices: [4], pivotIndex: null, ... }
   }
   ```

2. **State** (`js/state.js`) owns the selected algorithm, the working array,
   the generated trace, the current position within it, and play/pause
   status. It exposes `next()`, `previous()`, `goTo()`, `play()`,
   `pause()`, `reset()`, etc., and notifies subscribers when something
   changes. Because every step carries a full array snapshot, moving
   backward and forward is just an array lookup &mdash; there is no risk of
   drifting out of sync with the algorithm's real logic.

3. **Visualizer** (`js/visualizer.js`) turns one step into bars: heights
   from `step.array`, highlight classes from `step.meta`. It has no
   knowledge of what a "pivot" or a "merge" conceptually is beyond the CSS
   class it maps to.

4. **UI** (`js/ui.js`, `js/main.js`) wires DOM controls to the state,
   renders the statistics bar, builds the step explanation from
   `step.message` / `step.codeLine`, and highlights the matching pseudocode
   line. It is the only layer that touches `document`.

This separation is what makes "Previous" reliable, lets every algorithm
share one playback engine, and keeps the explanation panel generic instead
of hand-written per animation state.

```
js/
├── algorithms/
│   ├── bubbleSort.js
│   ├── selectionSort.js
│   ├── insertionSort.js
│   ├── mergeSort.js
│   └── quickSort.js
├── traceBuilder.js   # shared step-recording helper used by all algorithms
├── state.js           # app state + playback
├── visualizer.js       # step → bars rendering
├── ui.js               # DOM wiring, stats, explanation, pseudocode
└── main.js              # entry point
```

## Tech Stack

HTML, CSS, JavaScript. Nothing else.

## Running locally

Just open `index.html` in a browser. No server, no build step required.

## Deployment

Push to a GitHub repository and enable **Settings → Pages → Deploy from
branch → main → /root**. All asset paths are relative, so it works
unmodified at `https://<username>.github.io/<repository>/`.
