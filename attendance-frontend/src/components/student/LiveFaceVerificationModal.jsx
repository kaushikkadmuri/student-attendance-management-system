import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const MODEL_PATH = "/models/face_landmarker.task";
const WASM_PATH = "/mediapipe/wasm";
const REQUIRED_STABLE_FRAMES = 12;
const MESSAGE_HOLD_MS = 900;
const BLINK_DROP_RATIO = 0.72;
const BLINK_RECOVERY_RATIO = 0.9;

const LEFT_EYE = { top: 159, bottom: 145, left: 33, right: 133 };
const RIGHT_EYE = { top: 386, bottom: 374, left: 362, right: 263 };

const distance = (pointA, pointB) => {
  if (!pointA || !pointB) return 0;
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;
  return Math.sqrt((dx * dx) + (dy * dy));
};

const getEyeAspectRatio = (landmarks, eye) => {
  const top = landmarks[eye.top];
  const bottom = landmarks[eye.bottom];
  const left = landmarks[eye.left];
  const right = landmarks[eye.right];
  const eyeWidth = distance(left, right);
  return eyeWidth ? distance(top, bottom) / eyeWidth : 0;
};

const getAverageEyeAspectRatio = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length <= RIGHT_EYE.bottom) {
    return 0;
  }

  const leftRatio = getEyeAspectRatio(landmarks, LEFT_EYE);
  const rightRatio = getEyeAspectRatio(landmarks, RIGHT_EYE);
  return (leftRatio + rightRatio) / 2;
};

const LiveFaceVerificationModal = ({
  mode = "check-in",
  onVerified,
  onClose,
  errorTitle,
  errorMessage,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentVideoTimeRef = useRef(-1);
  const stableFrameCountRef = useRef(0);
  const submittingRef = useRef(false);
  const lastFaceStateRef = useRef("");
  const lastStatusChangeRef = useRef(0);
  const baselineEyeRatioRef = useRef(0);
  const blinkStartedRef = useRef(false);
  const blinkDetectedRef = useRef(false);

  const [statusText, setStatusText] = useState("Starting camera...");
  const [localError, setLocalError] = useState("");

  const updateStatus = (nextStatus, options = {}) => {
    const now = Date.now();
    const { force = false } = options;

    if (
      !force &&
      lastFaceStateRef.current &&
      lastFaceStateRef.current !== nextStatus &&
      now - lastStatusChangeRef.current < MESSAGE_HOLD_MS
    ) {
      return;
    }

    lastFaceStateRef.current = nextStatus;
    lastStatusChangeRef.current = now;
    setStatusText(nextStatus);
  };

  const stopResources = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureCurrentFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0);

    return canvas.toDataURL("image/png");
  };

  useEffect(() => {
    let isMounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!isMounted) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        updateStatus("Loading face verification...", { force: true });

        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (!isMounted) return;

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_PATH },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        updateStatus("Keep your face centered and look straight at the camera", { force: true });
      } catch {
        setLocalError("Camera or face verification could not be started.");
        updateStatus("Verification unavailable", { force: true });
      }
    };

    start();

    return () => {
      isMounted = false;
      stopResources();
    };
  }, []);

  useEffect(() => {
    const detectFace = () => {
      const video = videoRef.current;
      const detector = faceLandmarkerRef.current;

      if (!video || !detector || video.readyState < 2 || submittingRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      if (video.currentTime !== currentVideoTimeRef.current) {
        currentVideoTimeRef.current = video.currentTime;

        let result;
        try {
          result = detector.detectForVideo(video, performance.now());
        } catch {
          setLocalError("Live face detection failed. Keep the camera open and retry.");
          animationFrameRef.current = requestAnimationFrame(detectFace);
          return;
        }

        const faces = result?.faceLandmarks || [];
        if (faces.length !== 1) {
          stableFrameCountRef.current = 0;
          baselineEyeRatioRef.current = 0;
          blinkStartedRef.current = false;
          blinkDetectedRef.current = false;
          if (faces.length > 1) {
            updateStatus("Only one face should be visible");
          } else {
            updateStatus("Keep one clear face visible in the frame");
          }
          animationFrameRef.current = requestAnimationFrame(detectFace);
          return;
        }

        setLocalError("");
        stableFrameCountRef.current += 1;
        const landmarks = faces[0];
        const eyeRatio = getAverageEyeAspectRatio(landmarks);
        if (eyeRatio > 0) {
          baselineEyeRatioRef.current = Math.max(baselineEyeRatioRef.current, eyeRatio);
        }

        if (stableFrameCountRef.current < REQUIRED_STABLE_FRAMES) {
          updateStatus("Face detected. Hold still while we verify you...");
          animationFrameRef.current = requestAnimationFrame(detectFace);
          return;
        }

        const baselineEyeRatio = baselineEyeRatioRef.current;
        if (!blinkDetectedRef.current) {
          if (
            baselineEyeRatio > 0 &&
            eyeRatio > 0 &&
            !blinkStartedRef.current &&
            eyeRatio < baselineEyeRatio * BLINK_DROP_RATIO
          ) {
            blinkStartedRef.current = true;
            updateStatus("Blink detected. Open your eyes to continue...");
            animationFrameRef.current = requestAnimationFrame(detectFace);
            return;
          }

          if (
            blinkStartedRef.current &&
            baselineEyeRatio > 0 &&
            eyeRatio >= baselineEyeRatio * BLINK_RECOVERY_RATIO
          ) {
            blinkDetectedRef.current = true;
            updateStatus("Blink verified. Verifying your live face...");
          } else {
            updateStatus("Blink once to verify liveness");
            animationFrameRef.current = requestAnimationFrame(detectFace);
            return;
          }
        }

        const snapshot = captureCurrentFrame();
        if (!snapshot) {
          stableFrameCountRef.current = 0;
          blinkStartedRef.current = false;
          blinkDetectedRef.current = false;
          animationFrameRef.current = requestAnimationFrame(detectFace);
          return;
        }

        submittingRef.current = true;
        updateStatus("Verifying your live face with the stored photo...", { force: true });
        Promise.resolve(onVerified(snapshot))
          .then((didSucceed) => {
            if (!didSucceed) {
              submittingRef.current = false;
              stableFrameCountRef.current = 0;
              baselineEyeRatioRef.current = 0;
              blinkStartedRef.current = false;
              blinkDetectedRef.current = false;
              updateStatus("Keep your face centered and look straight at the camera", { force: true });
            }
          })
          .catch(() => {
            submittingRef.current = false;
            stableFrameCountRef.current = 0;
            baselineEyeRatioRef.current = 0;
            blinkStartedRef.current = false;
            blinkDetectedRef.current = false;
            updateStatus("Keep your face centered and look straight at the camera", { force: true });
          });
        return;
      }

      animationFrameRef.current = requestAnimationFrame(detectFace);
    };

    animationFrameRef.current = requestAnimationFrame(detectFace);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [onVerified]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
          <h2 className="text-center text-xl font-semibold text-gray-900">
            Face Verification
          </h2>

          <p className="mt-3 text-center text-sm text-gray-600">
            {statusText}
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-300">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="aspect-video max-h-[320px] w-full bg-black object-cover"
            />
          </div>

          {(localError || errorMessage) && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">
                {errorTitle || "Verification Failed"}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {localError || errorMessage}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-500 px-4 py-2.5 text-sm text-white"
            >
              Cancel
            </button>

            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 sm:text-sm">
              {mode === "check-out" ? "Checking you out after face match" : "Checking you in after face match"}
            </div>
          </div>

          <canvas ref={canvasRef} hidden />
        </div>
      </div>
    </>
  );
};

export default LiveFaceVerificationModal;
