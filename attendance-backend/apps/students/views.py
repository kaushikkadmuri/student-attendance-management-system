from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .models import Student
from batches.models import Batch
from accounts.models import User
from attendance.views import validate_enrollment_photo


def _serialize_student(student, request_user):
    counsellor = student.counsellor
    return {
        "id": student.id,
        "first_name": student.user.first_name,
        "email": student.user.email,
        "username": student.user.username,
        "mobile": student.mobile,
        "gender": student.gender,
        "photo": student.photo,
        "batch_id": student.batch.id,
        "batch_name": student.batch.name,
        "counsellor_id": counsellor.id if counsellor else None,
        "counsellor_name": counsellor.first_name if counsellor else None,
        "counsellor_email": counsellor.email if counsellor else None,
        "is_managed_by_me": counsellor_id_matches(counsellor, request_user),
    }


def counsellor_id_matches(counsellor, request_user):
    return bool(counsellor and counsellor.id == request_user.id)


class CreateStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "COUNSELLOR":
            return Response(
                {"error": "Only counsellor can add students"},
                status=status.HTTP_403_FORBIDDEN
            )

        batch_id = (
            request.data.get("batch")
            or request.data.get("batch_id")
            or request.data.get("batchId")
        )
        if isinstance(batch_id, dict):
            batch_id = batch_id.get("id") or batch_id.get("batch_id")
        if batch_id in [None, ""]:
            return Response(
                {"error": "batch is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            batch_id = int(batch_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid batch"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            batch = Batch.objects.get(id=batch_id)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Invalid batch"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.center and batch.center_id != request.user.center_id:
            return Response(
                {"error": "Cannot add student to another center's batch"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get("email")
        gender = request.data.get("gender")
        mobile = request.data.get("mobile")
        password = request.data.get("password")
        first_name = request.data.get("first_name")
        photo = request.data.get("photo")
        photo_liveness_images = request.data.get("photo_liveness_images") or request.data.get("photoLivenessImages") or {}

        if not email:
            return Response(
                {"error": "email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {"error": "password is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not photo:
            return Response(
                {"error": "Verified student photo is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment_error = validate_enrollment_photo(photo, photo_liveness_images)
        if enrollment_error:
            if enrollment_error.get("debug") is None:
                enrollment_error.pop("debug", None)
            return Response(
                enrollment_error,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(
                password,
                User(email=email, username=email, first_name=first_name, role="STUDENT")
            )
        except ValidationError as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                first_name=first_name,
                email=email,
                password=password,
                role="STUDENT",
                center=request.user.center,
                gender=gender,
                mobile=mobile
            )

            Student.objects.create(
                user=user,
                mobile=mobile,
                gender=gender,
                batch=batch,
                counsellor=request.user,
                photo=photo
            )

        return Response(
            {"message": "Student created successfully"},
            status=201
        )


class ListStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "COUNSELLOR":
            return Response(
                {"error": "Only counsellor allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        batch_id = request.GET.get("batch")

        students = Student.objects.none()
        if request.user.center_id:
            students = Student.objects.select_related(
                "user",
                "batch",
                "counsellor",
            ).filter(batch__center_id=request.user.center_id)

        if batch_id:
            try:
                batch_id = int(batch_id)
            except (TypeError, ValueError):
                return Response(
                    {"error": "Invalid batch"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            batch = Batch.objects.filter(
                id=batch_id,
                center_id=request.user.center_id
            ).first()
            if not batch:
                return Response(
                    {"error": "Batch not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            students = students.filter(batch_id=batch_id)

        data = [_serialize_student(student, request.user) for student in students]

        return Response(data, status=200)


class UpdateStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):

        if request.user.role != "COUNSELLOR":
            return Response(
                {"error": "Only counsellor allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student = Student.objects.get(
                id=pk,
                counsellor=request.user
            )
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found or not managed by you"},
                status=status.HTTP_404_NOT_FOUND
            )

        new_email = request.data.get("email")
        new_gender = request.data.get("gender", student.gender)
        new_mobile = request.data.get("mobile", student.mobile)
        new_photo = request.data.get("photo", student.photo)
        photo_liveness_images = request.data.get("photo_liveness_images") or request.data.get("photoLivenessImages") or {}

        student.user.first_name = request.data.get(
            "first_name",
            student.user.first_name
        )

        if new_email:
            if User.objects.exclude(id=student.user_id).filter(email=new_email).exists():
                return Response(
                    {"error": "Email already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            student.user.email = new_email
            student.user.username = new_email

        student.user.gender = new_gender
        student.user.mobile = new_mobile

        if request.data.get("password"):
            try:
                validate_password(
                    request.data.get("password"),
                    student.user
                )
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            student.user.set_password(
                request.data.get("password")
            )

        student.user.save()

        student.gender = new_gender
        student.mobile = new_mobile
        if "photo" in request.data and new_photo and new_photo != student.photo:
            enrollment_error = validate_enrollment_photo(new_photo, photo_liveness_images)
            if enrollment_error:
                if enrollment_error.get("debug") is None:
                    enrollment_error.pop("debug", None)
                return Response(
                    enrollment_error,
                    status=status.HTTP_400_BAD_REQUEST
                )
        student.photo = new_photo

        student.save()

        return Response(
            {"message": "Student updated successfully"}
        )


class DeleteStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        if request.user.role != "COUNSELLOR":
            return Response(
                {"error": "Only counsellor allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student = Student.objects.get(
                id=pk,
                counsellor=request.user
            )
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found or not managed by you"},
                status=status.HTTP_404_NOT_FOUND
            )

        student.user.delete()

        return Response(
            {"message": "Student deleted successfully"}
        )
