import './style.css';
import { PoseLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

const video = document.querySelector<HTMLVideoElement>('#webcam')!;
const canvas = document.querySelector<HTMLCanvasElement>('#overlay')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const landmarksData = document.querySelector<HTMLPreElement>('#landmarks-data')!;
const errorBox = document.querySelector<HTMLDivElement>('#error')!;
const ctx = canvas.getContext('2d')!;

// MediaPipe BlazePose assigns 33 landmarks in this order.
const LANDMARK_NAMES = [
  'nose',             'left eye inner',   'left eye',         'left eye outer',
  'right eye inner',  'right eye',        'right eye outer',  'left ear',
  'right ear',        'mouth left',       'mouth right',      'left shoulder',
  'right shoulder',   'left elbow',       'right elbow',      'left wrist',
  'right wrist',      'left pinky',       'right pinky',      'left index',
  'right index',      'left thumb',       'right thumb',      'left hip',
  'right hip',        'left knee',        'right knee',       'left ankle',
  'right ankle',      'left heel',        'right heel',       'left foot index',
  'right foot index',
];

// MediaPipe HandLandmarker assigns 21 landmarks per hand.
const HAND_LANDMARK_NAMES = [
  'wrist',
  'thumb cmc',  'thumb mcp',  'thumb ip',   'thumb tip',
  'index mcp',  'index pip',  'index dip',  'index tip',
  'middle mcp', 'middle pip', 'middle dip', 'middle tip',
  'ring mcp',   'ring pip',   'ring dip',   'ring tip',
  'pinky mcp',  'pinky pip',  'pinky dip',  'pinky tip',
];

async function initModels(): Promise<{ poseLandmarker: PoseLandmarker; handLandmarker: HandLandmarker }> {
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

// Color per body segment — face / upper body / lower body.
function segmentColor(index: number): string {
  if (index <= 10) return '#4fc3f7'; // face: cyan
  if (index <= 22) return '#00ff88'; // upper body / arms: green
  return '#ffb300';                  // lower body / legs: amber
}

function drawSkeleton(landmarks: NormalizedLandmark[]): void {
  const w = canvas.width;
  const h = canvas.height;

  // x is flipped to match the CSS-mirrored video: (1 - lm.x) * w
  const px = (lm: NormalizedLandmark) => (1 - lm.x) * w;
  const py = (lm: NormalizedLandmark) => lm.y * h;

  ctx.lineWidth = 2;
  for (const conn of PoseLandmarker.POSE_CONNECTIONS) {
    const a = landmarks[conn.start];
    const b = landmarks[conn.end];
    if (a.visibility < 0.5 || b.visibility < 0.5) continue;
    ctx.strokeStyle = segmentColor(conn.start);
    ctx.beginPath();
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(b), py(b));
    ctx.stroke();
  }

  // shadowBlur provides readable text on any background without extra DOM elements.
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.font = '13px ui-monospace, monospace';

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (lm.visibility < 0.5) continue;
    const x = px(lm);
    const y = py(lm);

    ctx.fillStyle = segmentColor(i);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(i), x + 7, y + 4);
  }

  ctx.shadowBlur = 0;
}

// Left hand: magenta, right hand: purple.
const HAND_COLORS: Record<string, string> = {
  Left: '#ff4081',
  Right: '#ce93d8',
};

function drawHands(
  allLandmarks: NormalizedLandmark[][],
  handedness: { categoryName: string }[][],
): void {
  const w = canvas.width;
  const h = canvas.height;

  const px = (lm: NormalizedLandmark) => (1 - lm.x) * w;
  const py = (lm: NormalizedLandmark) => lm.y * h;

  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.font = '11px ui-monospace, monospace';

  for (let hi = 0; hi < allLandmarks.length; hi++) {
    const landmarks = allLandmarks[hi];
    const label = handedness[hi]?.[0]?.categoryName ?? 'Left';
    const color = HAND_COLORS[label] ?? '#ff4081';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (const conn of HandLandmarker.HAND_CONNECTIONS) {
      const a = landmarks[conn.start];
      const b = landmarks[conn.end];
      ctx.beginPath();
      ctx.moveTo(px(a), py(a));
      ctx.lineTo(px(b), py(b));
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const x = px(lm);
      const y = py(lm);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(i), x + 5, y + 4);
    }
  }

  ctx.shadowBlur = 0;
}

let panelTick = 0;

function updatePanel(poseLandmarks: NormalizedLandmark[], handLandmarks: NormalizedLandmark[][]): void {
  if (++panelTick % 4 !== 0) return;

  const poseLines = poseLandmarks.map((lm, i) => {
    const name = (LANDMARK_NAMES[i] ?? `landmark_${i}`).padEnd(18);
    return `#${String(i).padStart(2, '0')} ${name}  x:${lm.x.toFixed(3)}  y:${lm.y.toFixed(3)}  z:${lm.z.toFixed(3)}  vis:${lm.visibility.toFixed(2)}`;
  });

  const handLines = handLandmarks.flatMap((landmarks, hi) => {
    const rows = landmarks.map((lm, i) => {
      const name = (HAND_LANDMARK_NAMES[i] ?? `landmark_${i}`).padEnd(12);
      return `#${String(i).padStart(2, '0')} ${name}  x:${lm.x.toFixed(3)}  y:${lm.y.toFixed(3)}  z:${lm.z.toFixed(3)}`;
    });
    return [`\n--- Hand ${hi + 1} ---`, ...rows];
  });

  landmarksData.textContent = ['--- Pose ---', ...poseLines, ...handLines].join('\n');
}

async function run(): Promise<void> {
  status.textContent = 'Requesting camera access...';

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    showError(err);
    return;
  }

  status.textContent = 'Loading ML models...';
  let poseLandmarker: PoseLandmarker;
  let handLandmarker: HandLandmarker;
  try {
    ({ poseLandmarker, handLandmarker } = await initModels());
  } catch (err) {
    status.textContent = 'Error';
    errorBox.textContent = `Failed to load ML models: ${String(err)}`;
    errorBox.hidden = false;
    return;
  }

  await new Promise<void>((resolve) => {
    video.addEventListener('loadeddata', () => resolve(), { once: true });
  });

  // Set canvas resolution to native video resolution once.
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  status.textContent = 'Running';
  let lastTimestamp = -1;

  function detect(): void {
    const timestamp = performance.now();

    // detectForVideo requires strictly increasing timestamps.
    if (timestamp > lastTimestamp && video.readyState >= 2) {
      const poseResult = poseLandmarker.detectForVideo(video, timestamp);
      const handResult = handLandmarker.detectForVideo(video, timestamp);
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const poseDetected = poseResult.landmarks.length > 0;
      const handsDetected = handResult.landmarks.length > 0;

      if (poseDetected) drawSkeleton(poseResult.landmarks[0]);
      if (handsDetected) drawHands(handResult.landmarks, handResult.handedness);

      updatePanel(poseResult.landmarks[0] ?? [], handResult.landmarks);

      const parts: string[] = [];
      if (poseDetected) parts.push('pose');
      if (handsDetected) parts.push(`${handResult.landmarks.length} hand(s)`);
      status.textContent = parts.length > 0
        ? `Running — ${parts.join(', ')} detected`
        : 'Running — nothing detected';
    }

    requestAnimationFrame(detect);
  }

  detect();
}

function showError(err: unknown): void {
  const name = err instanceof DOMException ? err.name : '';
  const messages: Record<string, string> = {
    NotAllowedError: 'Camera access denied. Allow camera access in your browser and reload the page.',
    PermissionDeniedError: 'Camera access denied. Allow camera access in your browser and reload the page.',
    NotFoundError: 'No camera found on this device.',
    DevicesNotFoundError: 'No camera found on this device.',
    NotReadableError: 'Camera is in use by another application.',
    TrackStartError: 'Camera is in use by another application.',
  };
  errorBox.textContent = messages[name] ?? `Could not access camera: ${name || String(err)}`;
  errorBox.hidden = false;
  status.textContent = 'Error';
}

run();
