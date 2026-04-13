import { useEffect, useState } from "react";

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;

  const phi1 = (Number(lat1) * Math.PI) / 180;
  const phi2 = (Number(lat2) * Math.PI) / 180;
  const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.accuracy > 1000) {
          reject("Location accuracy too low. Move to open area.");
          return;
        }

        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => reject("Location permission denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

const explainLocationFailure = (message) => {
  if (String(message).includes("permission denied")) {
    return "Allow browser location permission and retry.";
  }
  if (String(message).includes("accuracy too low")) {
    return "Move outdoors/open area and keep GPS on for better accuracy.";
  }
  return "Retry location verification.";
};

const LocationVerificationModal = ({ center, onSuccess, onClose }) => {
  if (!center) return null;

  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Verifying your location...");
  const [distanceInfo, setDistanceInfo] = useState("");
  const [helpText, setHelpText] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      setStatus("checking");
      setMessage("Verifying your location...");
      setDistanceInfo("");
      setHelpText("");

      try {
        const studentLoc = await getCurrentLocation();

        const distance = getDistanceInMeters(
          studentLoc.lat,
          studentLoc.lng,
          center.latitude,
          center.longitude
        );

        if (!mounted) return;

        if (distance <= center.allowedRadius) {
          setStatus("success");
          setMessage("Location verified successfully");
          setDistanceInfo(
            `You are ${center.allowedRadius - distance} m inside allowed radius (${center.allowedRadius} m).`
          );

          setTimeout(() => {
            if (mounted) onSuccess(studentLoc);
          }, 1000);
        } else {
          setStatus("error");
          setMessage("Outside allowed location");
          setDistanceInfo(
            `You are ${distance - center.allowedRadius} m outside allowed radius (${center.allowedRadius} m).`
          );
          setHelpText("Move closer to your center and tap Retry.");
        }
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setMessage(String(err));
        setHelpText(explainLocationFailure(String(err).toLowerCase()));
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [center, onSuccess, retryCount]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-96 p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-2">Location Verification</h3>
        <p className="text-xs text-gray-600 mb-4">Step 1 of 2: Confirming your location</p>

        <p className={`font-medium ${status === "error" ? "text-red-700" : "text-gray-800"}`}>
          {message}
        </p>

        {distanceInfo && (
          <p className={`mt-2 text-sm ${status === "success" ? "text-green-600" : "text-red-500"}`}>
            {distanceInfo}
          </p>
        )}

        {helpText && <p className="mt-2 text-xs text-gray-600">{helpText}</p>}

        {status === "checking" && (
          <p className="mt-3 text-xs text-gray-500">Please wait...</p>
        )}

        {status === "error" && (
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationVerificationModal;
