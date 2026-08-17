import { PoseLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { GestureRecognizer } from '../body-tracking/src/lib/GestureRecognizer';
import { PointerGesture } from '../body-tracking/src/lib/gestures/pointer';
import { ZoomGesture } from '../body-tracking/src/lib/gestures/zoom';
import { ScrollGesture } from '../body-tracking/src/lib/gestures/scroll';
import { ToggleGesture } from '../body-tracking/src/lib/gestures/toggle';

const recognizer = new GestureRecognizer();
recognizer.register('pointer', new PointerGesture());
recognizer.register('zoom',    new ZoomGesture());
recognizer.register('scroll',  new ScrollGesture());
recognizer.register('toggle',  new ToggleGesture());

const cursor = document.getElementById('gesture-cursor');
const gestureStatus = document.getElementById('gesture-status');
const gestureStatusLabel = document.getElementById('gesture-status-label');
const toggleProgress = document.getElementById('toggle-progress');
const TOGGLE_PROGRESS_MAX_WIDTH = 160; // px, matches #toggle-progress max-width in style.css

// Gesture control start state: active. Toggled via the ToggleGesture
// (both hands open, held 2s).
let gestureActive = true;

function updateToggleUI(active) {
  gestureStatus.classList.toggle('gesture-inactive', !active);
  gestureStatusLabel.textContent = active ? 'Gestensteuerung aktiv' : 'Gestensteuerung pausiert';
  gestureStatus.classList.remove('gesture-flash');
  void gestureStatus.offsetWidth; // reflow so the animation restarts on repeated toggles
  gestureStatus.classList.add('gesture-flash');
}

// go-forward/go-back were removed in Issue #5 (Ticket 4) — focus now comes
// from native keyboard/mouse interaction; the OK gesture only confirms
// whatever currently has focus.
function activateFocused() {
  const el = document.activeElement;
  if (el && el !== document.body) el.click();
}

// "Mehr lesen" cards: toggling aria-expanded/hidden works for both mouse
// clicks and the OK gesture, since activateFocused() also just calls
// element.click() on whatever has focus.
document.querySelectorAll('.read-more-btn').forEach((btn) => {
  const content = btn.nextElementSibling;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
  });
});

async function initModels() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
  );
  const [poseLandmarker, handLandmarker] = await Promise.all([
    PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    }),
    HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    }),
  ]);
  return { poseLandmarker, handLandmarker };
}

async function run() {
  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.style.display = 'none';
  document.body.appendChild(video);

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
  } catch (err) {
    console.error('[news-app] Camera access failed:', err);
    return;
  }
  video.srcObject = stream;

  const { poseLandmarker, handLandmarker } = await initModels();

  await new Promise((resolve) => {
    video.addEventListener('loadeddata', () => resolve(), { once: true });
  });

  let lastTimestamp = -1;
  // ZoomGesture reports { triggered: true } on every frame while held, not
  // just once — track the previous frame's state to activate on rising edge.
  let zoomWasActive = false;

  function detect() {
    const timestamp = performance.now();

    if (timestamp > lastTimestamp && video.readyState >= 2) {
      const poseResult = poseLandmarker.detectForVideo(video, timestamp);
      const handResult = handLandmarker.detectForVideo(video, timestamp);
      lastTimestamp = timestamp;

      let leftHand = null;
      let rightHand = null;
      for (let i = 0; i < handResult.handedness.length; i++) {
        const label = handResult.handedness[i]?.[0]?.categoryName;
        if (label === 'Left') leftHand = handResult.landmarks[i];
        if (label === 'Right') rightHand = handResult.landmarks[i];
      }

      const input = {
        leftHand,
        rightHand,
        pose: poseResult.landmarks[0] ?? null,
        timestamp,
      };

      const events = recognizer.update(input);
      let zoomActiveThisFrame = false;

      for (const event of events) {
        if (event.name === 'toggle') {
          gestureActive = !gestureActive;
          updateToggleUI(gestureActive);
          continue;
        }

        if (!gestureActive) continue;

        if (event.name === 'zoom') {
          zoomActiveThisFrame = true;
          if (!zoomWasActive) activateFocused();
        }
      }

      zoomWasActive = zoomActiveThisFrame;

      // Scroll is continuous stream data (never triggered: true), poll via
      // getOutput() rather than the events array.
      const scrollOutput = recognizer.getOutput('scroll');
      if (gestureActive && scrollOutput?.value !== undefined && scrollOutput.value !== 0) {
        const scrollSpeed = 8; // pixels per frame — tune after testing
        window.scrollBy(0, scrollOutput.value * scrollSpeed);
      }

      // Toggle progress bar: getState() only reports the state string, not
      // the hold progress. Pragmatic choice (documented here rather than
      // adding a getProgress() getter to the library): getOutput('toggle')
      // already carries { value: progress } while toggle_armed, because
      // GestureRecognizer stores every gesture's last output unconditionally
      // (see GestureRecognizer.update()), not only when triggered === true.
      const toggleOutput = recognizer.getOutput('toggle');
      const toggleProgressValue =
        recognizer.getState('toggle') === 'toggle_armed' && toggleOutput?.value !== undefined
          ? toggleOutput.value
          : 0;
      toggleProgress.style.width = `${toggleProgressValue * TOGGLE_PROGRESS_MAX_WIDTH}px`;

      // Pointer position is continuous stream data, not a discrete trigger —
      // poll it via getOutput() rather than looking for it in events.
      const pointerPosition = recognizer.getOutput('pointer')?.position ?? null;

      if (pointerPosition !== null) {
        const { x, y } = pointerPosition;
        // position.x/y are raw MediaPipe coordinates (normalized, NOT
        // mirrored) — the library does no mirroring itself. body-tracking's
        // main.ts mirrors x for its mirrored camera preview via its own
        // canvasPoint() helper; we do the same here so the cursor moves
        // the way a mirror-view user expects (hand right -> cursor right).
        cursor.style.left = `${(1 - x) * window.innerWidth}px`;
        cursor.style.top = `${y * window.innerHeight}px`;
        cursor.style.opacity = '1';
      } else {
        cursor.style.opacity = '0';
      }
    }

    requestAnimationFrame(detect);
  }

  detect();
}

run();
