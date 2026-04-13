import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const MODEL_PATH = "/models/face_landmarker.task";
const WASM_PATH = "/mediapipe/wasm";

const LIVENESS_STEPS = [
  { key: "center", label: "Look straight" },
  { key: "left", label: "Move face left" },
  { key: "right", label: "Move face right" },
  { key: "blink", label: "Blink once" },
];

const LEFT_EYE = { top: 159, bottom: 145, left: 33, right: 133 };
const RIGHT_EYE = { top: 386, bottom: 374, left: 362, right: 263 };
const NOSE_TIP_INDEX = 1;

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

const getFaceMetrics = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length <= NOSE_TIP_INDEX) {
    return null;
  }

  const noseTip = landmarks[NOSE_TIP_INDEX];
  const leftEyeRatio = getEyeAspectRatio(landmarks, LEFT_EYE);
  const rightEyeRatio = getEyeAspectRatio(landmarks, RIGHT_EYE);

  return {
    centerXRatio: noseTip.x,
    eyeAspectRatio: (leftEyeRatio + rightEyeRatio) / 2,
  };
};

const isStepSatisfied = (stepKey, metrics, baselineEyeAspectRatio) => {
  if (!metrics) return false;

  if (stepKey === "center") {
    return metrics.centerXRatio >= 0.42 && metrics.centerXRatio <= 0.58;
  }

  if (stepKey === "left") {
    return metrics.centerXRatio <= 0.38;
  }

  if (stepKey === "right") {
    return metrics.centerXRatio >= 0.62;
  }

  if (stepKey === "blink") {
    return (
      baselineEyeAspectRatio > 0 &&
      metrics.eyeAspectRatio > 0 &&
      metrics.eyeAspectRatio < baselineEyeAspectRatio * 0.72
    );
  }

  return false;
};

const CameraModal = ({
  onCapture,
  onClose,
  errorTitle,
  errorMessage,
  title = "Face Verification",
  description,
  captureMode = "single",
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentVideoTimeRef = useRef(-1);
  const stepLockRef = useRef(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [capturedSteps, setCapturedSteps] = useState({});
  const [baselineEyeAspectRatio, setBaselineEyeAspectRatio] = useState(0);
  const [statusText, setStatusText] = useState("Starting camera...");
  const [localError, setLocalError] = useState("");
  const [manualMode, setManualMode] = useState(false);

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

    if (!video || !canvas) return null;

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

        if (captureMode === "liveness") {
          setStatusText("Loading face verification...");

          try {
            const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
            if (!isMounted) return;

            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: { modelAssetPath: MODEL_PATH },
              runningMode: "VIDEO",
              numFaces: 1,
            });

            setStatusText("Auto verification is ready");
          } catch {
            setManualMode(true);
            setLocalError("Automatic verification is unavailable. Continue with manual captures.");
            setStatusText("Manual verification enabled");
          }
        } else {
          setStatusText("Camera ready");
        }
      } catch {
        alert("Camera access denied");
        onClose();
      }
    };

    start();

    return () => {
      isMounted = false;
      stopResources();
    };
  }, [captureMode, onClose]);

  useEffect(() => {
    if (captureMode !== "liveness" || manualMode || !faceLandmarkerRef.current) {
      return undefined;
    }

    const detectAutomatically = () => {
      const video = videoRef.current;
      const detector = faceLandmarkerRef.current;

      if (!video || !detector || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectAutomatically);
        return;
      }

      if (video.currentTime !== currentVideoTimeRef.current) {
        currentVideoTimeRef.current = video.currentTime;

        const result = detector.detectForVideo(video, performance.now());
        const landmarks = result?.faceLandmarks?.[0];
        const metrics = getFaceMetrics(landmarks);
        const currentStep = LIVENESS_STEPS[stepIndex];

        if (metrics && !stepLockRef.current) {
          if (metrics.eyeAspectRatio > 0) {
            setBaselineEyeAspectRatio((prev) => Math.max(prev, metrics.eyeAspectRatio));
          }

          if (currentStep.key === "blink") {
            setStatusText("Liveness verified. Verifying with stored photo...");
          } else {
            setStatusText(`Complete one live challenge. ${currentStep.label}`);
          }

          if (isStepSatisfied(currentStep.key, metrics, baselineEyeAspectRatio)) {
            const snapshot = captureCurrentFrame();
            if (snapshot) {
              stepLockRef.current = true;
              const nextCaptured = { ...capturedSteps, [currentStep.key]: snapshot };
              setCapturedSteps(nextCaptured);

              if (stepIndex === LIVENESS_STEPS.length - 1) {
                onCapture({
                  selfie_image: nextCaptured.center || snapshot,
                  liveness_images: nextCaptured,
                });
                return;
              }

              setStepIndex((prev) => prev + 1);
              window.setTimeout(() => {
                stepLockRef.current = false;
              }, 700);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectAutomatically);
    };

    animationFrameRef.current = requestAnimationFrame(detectAutomatically);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [baselineEyeAspectRatio, captureMode, capturedSteps, manualMode, onCapture, stepIndex]);

  const handleManualCapture = () => {
    const currentStep = LIVENESS_STEPS[stepIndex];
    const video = videoRef.current;
    const detector = faceLandmarkerRef.current;

    if (captureMode === "liveness" && detector && video && video.readyState >= 2) {
      try {
        const result = detector.detectForVideo(video, performance.now());
        const landmarks = result?.faceLandmarks?.[0];
        const metrics = getFaceMetrics(landmarks);

        if (!metrics) {
          setLocalError("No clear face detected. Keep one face visible and retry.");
          return;
        }

        if (metrics.eyeAspectRatio > 0) {
          setBaselineEyeAspectRatio((prev) => Math.max(prev, metrics.eyeAspectRatio));
        }

        const baseline = Math.max(baselineEyeAspectRatio, metrics.eyeAspectRatio || 0);
        if (!isStepSatisfied(currentStep.key, metrics, baseline)) {
          setLocalError(`Current frame does not satisfy: ${currentStep.label}. Follow the instruction and retry.`);
          return;
        }
      } catch {
        setLocalError("Unable to verify the current frame. Retry.");
        return;
      }
    }

    const snapshot = captureCurrentFrame();
    if (!snapshot) return;

    if (captureMode === "liveness") {
      const currentStepData = LIVENESS_STEPS[stepIndex];
      const nextCaptured = { ...capturedSteps, [currentStepData.key]: snapshot };
      setCapturedSteps(nextCaptured);
      setLocalError("");

      if (stepIndex === LIVENESS_STEPS.length - 1) {
        onCapture({
          selfie_image: nextCaptured.center || snapshot,
          liveness_images: nextCaptured,
        });
        return;
      }

      setStepIndex((prev) => prev + 1);
      return;
    }

    onCapture(snapshot);
  };

  const currentStep = captureMode === "liveness" ? LIVENESS_STEPS[stepIndex] : null;
  const infoText = description || (
    captureMode === "liveness"
      ? "Complete one live challenge. Once it is satisfied, the system will automatically verify the live face against the stored student photo."
      : "Keep your face centered, single person in frame, and good lighting."
  );

  if (captureMode !== "liveness") {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-4 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-center mb-3">
              {title}
            </h2>

            <p className="text-xs text-gray-600 mb-3 text-center">
              {infoText}
            </p>

            {errorMessage && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 p-2">
                <p className="text-xs font-semibold text-red-700">
                  {errorTitle || "Verification Failed"}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {errorMessage}
                </p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded border mb-3"
            />

            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleManualCapture}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Capture
              </button>
            </div>

            <canvas ref={canvasRef} hidden />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden">
          <div className="border-b border-gray-200 px-8 py-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <div className="grid gap-6 border-b border-gray-200 p-6 lg:grid-cols-[1.35fr,1fr]">
            <div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border border-gray-300"
              />
            </div>

            <div className="space-y-5">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-700">
                {infoText}
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  Live Challenge: {currentStep?.label}
                </h3>
                <p className="mt-2 text-lg text-gray-500">
                  {statusText}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {LIVENESS_STEPS.map((step, index) => {
                  const boxClass = capturedSteps[step.key]
                    ? "border-green-200 bg-green-50 text-green-700"
                    : index === stepIndex
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-500";

                  return (
                    <div
                      key={step.key}
                      className={`rounded-lg border px-4 py-3 text-center text-sm ${boxClass}`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>

              {(localError || errorMessage) && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${manualMode ? "border-blue-200 bg-blue-50 text-blue-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                  <p className="font-semibold">
                    {manualMode ? "Manual Verification" : errorTitle || "Verification Failed"}
                  </p>
                  <p className="mt-1">
                    {localError || errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-500 px-6 py-3 text-white"
            >
              Cancel
            </button>

            {manualMode && (
              <button
                type="button"
                onClick={handleManualCapture}
                className="rounded-lg bg-green-600 px-6 py-3 text-white"
              >
                {stepIndex === LIVENESS_STEPS.length - 1 ? "Finish Verification" : "Capture Next Step"}
              </button>
            )}
          </div>

          <canvas ref={canvasRef} hidden />
        </div>
      </div>
    </>
  );
};

export default CameraModal;
