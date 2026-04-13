from datetime import datetime, timedelta
import base64
import math

from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Attendance
from .serializers import AttendanceSerializer
from students.models import Student

try:
    import cv2
except Exception:
    cv2 = None

try:
    import numpy as np
except Exception:
    np = None


def _working_dates_between(start_date, end_date):
    current = start_date
    while current <= end_date:
        if current.weekday() != 6:
            yield current
        current += timedelta(days=1)


def _haversine_distance_meters(lat1, lon1, lat2, lon2):
    r = 6371000
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1)
        * math.cos(phi2)
        * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _decode_data_url_to_image(data_url):
    if not data_url or not isinstance(data_url, str):
        return None

    if "," in data_url:
        _, encoded = data_url.split(",", 1)
    else:
        encoded = data_url

    try:
        image_bytes = base64.b64decode(encoded)
    except Exception:
        return None

    if np is None:
        return None

    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    if arr.size == 0:
        return None

    if cv2 is None:
        return None

    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _get_first_present(data, keys):
    if data is None:
        return None
    for key in keys:
        value = data.get(key)
        if value not in [None, ""]:
            return value
    return None


def _extract_faces(image):
    if cv2 is None or image is None:
        return []

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.08,
        minNeighbors=4,
        minSize=(40, 40),
    )

    if len(faces) == 0:
        return []

    extracted = []
    for (x, y, w, h) in faces:
        face = gray[y : y + h, x : x + w]
        extracted.append(
            {
                "rect": (x, y, w, h),
                "img": cv2.resize(face, (160, 160)),
                "area": w * h,
            }
        )
    return extracted


def _count_detected_eyes(face_img):
    if cv2 is None or face_img is None:
        return 0

    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml"
    )
    eyes = eye_cascade.detectMultiScale(
        face_img,
        scaleFactor=1.08,
        minNeighbors=4,
        minSize=(12, 12),
    )
    return len(eyes)


def _select_primary_face(candidates):
    if not candidates:
        return None, 0, False

    sorted_faces = sorted(candidates, key=lambda c: c["area"], reverse=True)
    primary = sorted_faces[0]
    largest_area = primary["area"]

    # Treat as true multi-face only when another face is reasonably large.
    significant_others = [
        c
        for c in sorted_faces[1:]
        if c["area"] >= (0.45 * largest_area)
    ]
    has_multiple_significant = len(significant_others) > 0

    return primary["img"], len(sorted_faces), has_multiple_significant


def _select_primary_face_candidate(candidates):
    if not candidates:
        return None, 0, False

    sorted_faces = sorted(candidates, key=lambda c: c["area"], reverse=True)
    primary = sorted_faces[0]
    largest_area = primary["area"]
    significant_others = [
        c
        for c in sorted_faces[1:]
        if c["area"] >= (0.45 * largest_area)
    ]
    has_multiple_significant = len(significant_others) > 0
    return primary, len(sorted_faces), has_multiple_significant


def _extract_single_face_candidate(image):
    faces = _extract_faces(image)
    if len(faces) == 0:
        return None, "No clear face detected. Retake the photo."

    face_candidate, _, has_multiple = _select_primary_face_candidate(faces)
    if has_multiple:
        return None, "Multiple faces detected. Keep only your face in frame."

    return face_candidate, None


def _get_liveness_images(data):
    payload = _get_first_present(data, ["liveness_images", "livenessImages"])
    if isinstance(payload, dict):
        return payload
    return {}


def _validate_liveness_sequence(liveness_images):
    required_steps = ["center", "left", "right", "blink"]
    missing_steps = [
        step for step in required_steps
        if not liveness_images.get(step)
    ]
    if missing_steps:
        return None, {
            "error": "Face movement verification is required.",
            "code": "MISSING_LIVENESS_IMAGES",
            "missing_steps": missing_steps,
        }

    frame_data = {}
    for step in required_steps:
        image = _decode_data_url_to_image(liveness_images.get(step))
        if image is None:
            return None, {
                "error": f"Invalid {step} face image format",
                "code": "INVALID_LIVENESS_IMAGE",
                "step": step,
            }

        face_candidate, face_error = _extract_single_face_candidate(image)
        if face_error:
            return None, {
                "error": face_error,
                "code": "LIVENESS_FACE_INVALID",
                "step": step,
            }

        is_unclear_face, visibility_issues, _ = _assess_face_visibility(face_candidate["img"])
        if is_unclear_face:
            return None, {
                "error": f"{step.capitalize()} frame is not clear enough. Improve {', '.join(visibility_issues)} and retry.",
                "code": "LIVENESS_FACE_UNCLEAR",
                "step": step,
            }

        img_height, img_width = image.shape[:2]
        x, y, w, h = face_candidate["rect"]
        frame_data[step] = {
            "img": face_candidate["img"],
            "center_x_ratio": (x + (w / 2.0)) / float(img_width),
            "face_width_ratio": w / float(img_width),
        }

    center_ratio = frame_data["center"]["center_x_ratio"]
    left_ratio = frame_data["left"]["center_x_ratio"]
    right_ratio = frame_data["right"]["center_x_ratio"]
    movement_spread = right_ratio - left_ratio
    center_width = frame_data["center"]["face_width_ratio"]
    left_width = frame_data["left"]["face_width_ratio"]
    right_width = frame_data["right"]["face_width_ratio"]

    # Frontend liveness uses landmark-based guidance, while backend re-checks the
    # captured image using Haar face bounds. Keep this window a bit wider so a
    # valid centered frame does not get rejected due to detector differences.
    if not (0.35 <= center_ratio <= 0.65):
        return None, {
            "error": "Keep your face centered for the first frame before moving.",
            "code": "CENTER_FACE_NOT_ALIGNED",
        }

    if not (left_ratio < (center_ratio - 0.12) and right_ratio > (center_ratio + 0.12)):
        return None, {
            "error": "Move your face to the left and right as instructed.",
            "code": "INSUFFICIENT_FACE_MOVEMENT",
        }

    if movement_spread < 0.28:
        return None, {
            "error": "Face movement was too small. Retry and move your face more clearly.",
            "code": "INSUFFICIENT_FACE_SPREAD",
        }

    if abs(left_width - center_width) > 0.08 or abs(right_width - center_width) > 0.08:
        return None, {
            "error": "Keep the same distance from the camera while moving your face.",
            "code": "INCONSISTENT_FACE_DISTANCE",
        }

    center_eyes = _count_detected_eyes(frame_data["center"]["img"])
    blink_eyes = _count_detected_eyes(frame_data["blink"]["img"])
    if center_eyes < 2:
        return None, {
            "error": "Eyes were not clearly visible in the center frame. Retry in better lighting.",
            "code": "CENTER_EYES_NOT_VISIBLE",
        }
    if blink_eyes > 1 or blink_eyes >= center_eyes:
        return None, {
            "error": "Blink was not detected clearly. Blink once and retry.",
            "code": "BLINK_NOT_DETECTED",
        }

    return frame_data, None


def validate_enrollment_photo(photo_image, liveness_images):
    profile_image = _decode_data_url_to_image(photo_image)
    if profile_image is None:
        return {
            "error": "Invalid profile photo image format",
            "code": "INVALID_PROFILE_IMAGE",
        }

    profile_face_candidate, profile_face_error = _extract_single_face_candidate(profile_image)
    if profile_face_error:
        return {
            "error": profile_face_error,
            "code": "PROFILE_FACE_INVALID",
        }

    if not liveness_images:
        is_unclear_face, visibility_issues, visibility_metrics = _assess_face_visibility(
            profile_face_candidate["img"]
        )
        if is_unclear_face:
            payload = {
                "error": "Profile photo is not clear enough.",
                "code": "PROFILE_FACE_UNCLEAR",
                "tips": [
                    "Keep one face centered in the frame.",
                    "Use good front lighting.",
                    "Retake the photo without blur or shadows.",
                ],
            }
            if settings.DEBUG:
                payload["debug"] = {
                    "visibility": visibility_metrics,
                    "issues": visibility_issues,
                }
            return payload
        return None

    liveness_data, liveness_error = _validate_liveness_sequence(liveness_images)
    if liveness_error:
        return liveness_error

    profile_face = profile_face_candidate["img"]
    center_face = liveness_data["center"]["img"]
    matched, score, diagnostics = _match_faces(profile_face, center_face)
    if not matched:
        return {
            "error": "Saved profile image does not match the verified center frame.",
            "code": "PROFILE_LIVENESS_MISMATCH",
            "debug": {
                "match_score": score,
                "diagnostics": diagnostics,
            } if settings.DEBUG else None,
        }

    return None


def _match_faces(profile_face, selfie_face):
    if cv2 is None or np is None or profile_face is None or selfie_face is None:
        return False, 0.0, {}

    profile_eq = cv2.equalizeHist(profile_face)
    selfie_eq = cv2.equalizeHist(selfie_face)
    profile_eq = cv2.GaussianBlur(profile_eq, (3, 3), 0)
    selfie_eq = cv2.GaussianBlur(selfie_eq, (3, 3), 0)

    hist_profile = cv2.calcHist([profile_eq], [0], None, [256], [0, 256])
    hist_selfie = cv2.calcHist([selfie_eq], [0], None, [256], [0, 256])
    cv2.normalize(hist_profile, hist_profile)
    cv2.normalize(hist_selfie, hist_selfie)

    corr = cv2.compareHist(hist_profile, hist_selfie, cv2.HISTCMP_CORREL)
    corr_01 = max(0.0, min(1.0, (corr + 1.0) / 2.0))

    diff = cv2.absdiff(profile_eq, selfie_eq)
    mean_diff = float(np.mean(diff))
    diff_score = max(0.0, 1.0 - (mean_diff / 255.0))

    edges_profile = cv2.Canny(profile_eq, 40, 120)
    edges_selfie = cv2.Canny(selfie_eq, 40, 120)
    edge_diff = cv2.absdiff(edges_profile, edges_selfie)
    edge_score = max(0.0, 1.0 - (float(np.mean(edge_diff)) / 255.0))

    orb = cv2.ORB_create(nfeatures=300)
    kp1, des1 = orb.detectAndCompute(profile_eq, None)
    kp2, des2 = orb.detectAndCompute(selfie_eq, None)
    if des1 is None or des2 is None or len(kp1) == 0 or len(kp2) == 0:
        orb_score = 0.0
    else:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(des1, des2, k=2)
        good = []
        for pair in matches:
            if len(pair) < 2:
                continue
            m, n = pair
            if m.distance < 0.72 * n.distance:
                good.append(m)
        orb_score = min(1.0, len(good) / 40.0)

    score = (
        (0.35 * corr_01)
        + (0.25 * diff_score)
        + (0.20 * edge_score)
        + (0.20 * orb_score)
    )

    # Fail closed: require both strong aggregate score and minimum per-signal quality.
    # Correlation is lighting-sensitive, so keep it as a soft signal.
    # Gate mostly on structural similarity (edge + ORB) plus aggregate score.
    primary_pass = (
        score >= 0.66
        and corr_01 >= 0.50
        and diff_score >= 0.62
        and edge_score >= 0.58
        and orb_score >= 0.32
    )
    # Fallback: allow strong structural matches even when histogram correlation is low.
    fallback_pass = (
        score >= 0.62
        and corr_01 >= 0.45
        and diff_score >= 0.82
        and edge_score >= 0.78
        and orb_score >= 0.38
    )
    passed = primary_pass or fallback_pass
    diagnostics = {
        "corr": round(corr_01, 4),
        "diff": round(diff_score, 4),
        "edge": round(edge_score, 4),
        "orb": round(orb_score, 4),
    }
    return passed, round(score, 4), diagnostics


def _assess_face_visibility(face_img):
    if cv2 is None or np is None or face_img is None:
        return True, ["invalid face image"], {}

    blur_score = float(cv2.Laplacian(face_img, cv2.CV_64F).var())
    brightness = float(np.mean(face_img))
    contrast = float(np.std(face_img))

    issues = []
    if blur_score < 45.0:
        issues.append("image sharpness")
    if brightness < 55.0 or brightness > 205.0:
        issues.append("lighting")
    if contrast < 28.0:
        issues.append("face clarity")

    metrics = {
        "blur": round(blur_score, 2),
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
    }
    return len(issues) > 0, issues, metrics


def _face_verification_failure_payload(
    score,
    diagnostics,
    is_unclear_face=False,
    visibility_issues=None,
    visibility_metrics=None,
):
    if is_unclear_face:
        tips = [
            "Look straight at the camera and keep your full face in frame.",
            "Use good front lighting and avoid shadows.",
            "Remove masks, sunglasses, or anything covering your face.",
        ]
        if visibility_issues:
            tips.insert(0, f"Please improve: {', '.join(visibility_issues)}.")
        payload = {
            "error": "Unable to verify your face. Please retake a clear selfie.",
            "code": "FACE_UNCLEAR",
            "message": "Your face is not clearly visible in the selfie.",
            "tips": tips,
        }
    else:
        payload = {
            "error": "Face not matched with profile photo.",
            "code": "FACE_NOT_MATCHED",
            "message": "This face does not match the student's profile photo.",
            "tips": [
                "Use the correct student's face for check-in.",
                "If this is your face, update your profile photo with a recent clear image.",
            ],
        }

    if settings.DEBUG:
        payload["debug"] = {
            "match_score": score,
            "diagnostics": diagnostics,
        }
        if visibility_metrics is not None:
            payload["debug"]["visibility"] = visibility_metrics

    return payload


def _verify_face_for_attendance(student, selfie_image, liveness_images):
    if not student.photo:
        return None, Response(
            {"error": "Student profile photo not found"},
            status=400,
        )

    profile_image = _decode_data_url_to_image(student.photo)
    live_image = _decode_data_url_to_image(selfie_image)

    if profile_image is None or live_image is None:
        return None, Response(
            {"error": "Invalid image format"},
            status=400,
        )

    profile_faces = _extract_faces(profile_image)
    if len(profile_faces) == 0:
        return None, Response(
            {"error": "No clear face found in profile photo"},
            status=400,
        )

    profile_face, _, profile_multi = _select_primary_face(profile_faces)
    if profile_multi:
        return None, Response(
            {"error": "Multiple faces found in profile photo"},
            status=400,
        )

    live_face_candidate, live_face_error = _extract_single_face_candidate(live_image)
    if live_face_error:
        return None, Response({"error": live_face_error}, status=400)

    live_face = live_face_candidate["img"]
    is_unclear_face, visibility_issues, visibility_metrics = _assess_face_visibility(live_face)
    matched, score, diagnostics = _match_faces(profile_face, live_face)
    if not matched:
        return None, Response(
            _face_verification_failure_payload(
                score,
                diagnostics,
                is_unclear_face=is_unclear_face,
                visibility_issues=visibility_issues,
                visibility_metrics=visibility_metrics,
            ),
            status=403,
        )

    return {
        "score": score,
    }, None


class CheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "STUDENT":
            return Response({"error": "Not allowed"}, status=403)

        if cv2 is None or np is None:
            return Response(
                {"error": "OpenCV dependencies are not installed on server"},
                status=500,
            )

        student = Student.objects.filter(user=request.user).select_related("batch__center").first()
        if not student:
            return Response({"error": "Student profile not found"}, status=400)

        center = student.batch.center if student.batch else None
        if not center:
            return Response({"error": "Center not configured"}, status=400)

        lat = _get_first_present(request.data, ["latitude", "lat", "user_latitude", "userLatitude"])
        lng = _get_first_present(request.data, ["longitude", "lng", "lon", "user_longitude", "userLongitude"])
        selfie_image = _get_first_present(
            request.data,
            ["selfie_image", "selfieImage", "face_image", "faceImage", "image"],
        )
        liveness_images = _get_liveness_images(request.data)

        missing_fields = []
        if lat in [None, ""]:
            missing_fields.append("latitude")
        if lng in [None, ""]:
            missing_fields.append("longitude")

        if missing_fields:
            return Response(
                {
                    "error": "Location is required for check-in",
                    "code": "MISSING_LOCATION",
                    "missing_fields": missing_fields,
                },
                status=400,
            )

        try:
            distance = _haversine_distance_meters(
                lat,
                lng,
                center.latitude,
                center.longitude,
            )
        except Exception:
            return Response({"error": "Invalid location coordinates"}, status=400)

        if distance > center.allowed_radius:
            return Response(
                {
                    "error": "Outside allowed location",
                    "distance": round(distance),
                    "allowed_radius": center.allowed_radius,
                },
                status=403,
            )

        if not selfie_image:
            return Response(
                {
                    "error": "Face image is required for check-in",
                    "code": "MISSING_SELFIE_IMAGE",
                    "missing_fields": ["selfie_image"],
                },
                status=400,
            )

        verification_result, error_response = _verify_face_for_attendance(
            student,
            selfie_image,
            liveness_images,
        )
        if error_response:
            return error_response

        today = timezone.now().date()

        attendance, created = Attendance.objects.get_or_create(
            student=student,
            date=today,
        )

        if attendance.check_in:
            return Response(
                {"error": "Already checked in"},
                status=400,
            )

        attendance.check_in = timezone.now().time()
        attendance.save()

        return Response(
            {
                "message": "Checked in successfully",
                "face_match_score": verification_result["score"],
            }
        )


class CheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "STUDENT":
            return Response({"error": "Not allowed"}, status=403)

        if cv2 is None or np is None:
            return Response(
                {"error": "OpenCV dependencies are not installed on server"},
                status=500,
            )

        student = Student.objects.filter(user=request.user).select_related("batch__center").first()
        if not student:
            return Response({"error": "Student profile not found"}, status=400)

        center = student.batch.center if student.batch else None
        if not center:
            return Response({"error": "Center not configured"}, status=400)

        lat = _get_first_present(request.data, ["latitude", "lat", "user_latitude", "userLatitude"])
        lng = _get_first_present(request.data, ["longitude", "lng", "lon", "user_longitude", "userLongitude"])
        selfie_image = _get_first_present(
            request.data,
            ["selfie_image", "selfieImage", "face_image", "faceImage", "image"],
        )
        liveness_images = _get_liveness_images(request.data)

        missing_fields = []
        if lat in [None, ""]:
            missing_fields.append("latitude")
        if lng in [None, ""]:
            missing_fields.append("longitude")

        if missing_fields:
            return Response(
                {
                    "error": "Location is required for check-out",
                    "code": "MISSING_LOCATION",
                    "missing_fields": missing_fields,
                },
                status=400,
            )

        try:
            distance = _haversine_distance_meters(
                lat,
                lng,
                center.latitude,
                center.longitude,
            )
        except Exception:
            return Response({"error": "Invalid location coordinates"}, status=400)

        if distance > center.allowed_radius:
            return Response(
                {
                    "error": "Outside allowed location",
                    "distance": round(distance),
                    "allowed_radius": center.allowed_radius,
                },
                status=403,
            )

        if not selfie_image:
            return Response(
                {
                    "error": "Face image is required for check-out",
                    "code": "MISSING_SELFIE_IMAGE",
                    "missing_fields": ["selfie_image"],
                },
                status=400,
            )

        verification_result, error_response = _verify_face_for_attendance(
            student,
            selfie_image,
            liveness_images,
        )
        if error_response:
            return error_response

        today = timezone.now().date()

        attendance = Attendance.objects.filter(
            student=student,
            date=today,
        ).first()

        if not attendance or not attendance.check_in:
            return Response(
                {"error": "Check in first"},
                status=400,
            )

        if attendance.check_out:
            return Response(
                {"error": "Already checked out"},
                status=400,
            )

        attendance.check_out = timezone.now().time()
        attendance.save()

        return Response(
            {
                "message": "Checked out successfully",
                "face_match_score": verification_result["score"],
            }
        )


class ResetTodayAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if not settings.DEBUG:
            return Response({"error": "Not allowed"}, status=403)

        if request.user.role != "STUDENT":
            return Response({"error": "Not allowed"}, status=403)

        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({"error": "Student profile not found"}, status=400)

        today = timezone.now().date()
        deleted_count, _ = Attendance.objects.filter(
            student=student,
            date=today,
        ).delete()

        return Response(
            {
                "message": "Today's attendance reset",
                "deleted": deleted_count > 0,
            }
        )


class MyAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "STUDENT":
            return Response({"error": "Not allowed"}, status=403)

        student = Student.objects.select_related("batch").filter(user=request.user).first()

        if not student:
            return Response([], status=200)

        batch = student.batch
        if not batch:
            return Response([], status=200)

        today = timezone.now().date()
        today_attendance = Attendance.objects.filter(
            student=student,
            date=today,
        ).first()

        include_today = bool(today_attendance and today_attendance.check_in)
        history_end = today if include_today else (today - timedelta(days=1))
        range_end = min(history_end, batch.end_date)

        if batch.start_date > range_end:
            if include_today and batch.start_date <= today <= batch.end_date:
                return Response([AttendanceSerializer(today_attendance).data], status=200)
            return Response([], status=200)

        attendance_by_date = {
            record.date: record
            for record in Attendance.objects.filter(
                student=student,
                date__range=(batch.start_date, range_end),
            )
        }
        if include_today and batch.start_date <= today <= batch.end_date:
            attendance_by_date[today] = today_attendance

        history = []
        for current_date in reversed(list(_working_dates_between(batch.start_date, range_end))):
            record = attendance_by_date.get(current_date)
            if record:
                history.append(AttendanceSerializer(record).data)
            else:
                history.append(
                    {
                        "id": None,
                        "date": current_date,
                        "check_in": None,
                        "check_out": None,
                        "total_duration": None,
                        "is_present": False,
                    }
                )

        return Response(history)
