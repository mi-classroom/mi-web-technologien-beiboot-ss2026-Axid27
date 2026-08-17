import { PoseLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { GestureRecognizer } from '../body-tracking/src/lib/GestureRecognizer';
import { PistolGesture } from '../body-tracking/src/lib/gestures/pistol';
import { PistolGestureLeft } from '../body-tracking/src/lib/gestures/pistolLeft';
import { PointerGesture } from '../body-tracking/src/lib/gestures/pointer';
import { ZoomGesture } from '../body-tracking/src/lib/gestures/zoom';

const recognizer = new GestureRecognizer();
recognizer.register('go-forward', new PistolGesture());
recognizer.register('go-back',    new PistolGestureLeft());
recognizer.register('pointer',    new PointerGesture());
recognizer.register('zoom',       new ZoomGesture());

const cursor = document.getElementById('gesture-cursor');

// Tracks the currently focused tabbable element by index, mirroring
// Tab / Shift+Tab navigation.
let focusIndex = -1;

function getTabbable() {
  return Array.from(document.querySelectorAll('a, button, [tabindex="0"]'));
}

function focusNext() {
  const tabbable = getTabbable();
  if (tabbable.length === 0) return;
  focusIndex = (focusIndex + 1) % tabbable.length;
  tabbable[focusIndex].focus();
}

function focusPrevious() {
  const tabbable = getTabbable();
  if (tabbable.length === 0) return;
  focusIndex = (focusIndex - 1 + tabbable.length) % tabbable.length;
  tabbable[focusIndex].focus();
}

function activateFocused() {
  const tabbable = getTabbable();
  const el = tabbable[focusIndex];
  if (el) el.click();
}

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
        if (event.name === 'go-forward') {
          focusNext();
        }
        if (event.name === 'go-back') {
          focusPrevious();
        }
        if (event.name === 'zoom') {
          zoomActiveThisFrame = true;
          if (!zoomWasActive) activateFocused();
        }
      }

      zoomWasActive = zoomActiveThisFrame;

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
