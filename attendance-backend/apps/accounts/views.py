# from django.shortcuts import render

# # Create your views here.


from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from students.models import Student
from django.core.mail import send_mail
from django.conf import settings
import logging
from django.utils import timezone
from .models import PasswordResetOTP
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email=email).first()

        # For security: don't reveal if email exists
        if not user:
            return Response(
                {"message": "If this email exists, an OTP has been sent."}
            )

        # Delete old OTPs
        PasswordResetOTP.objects.filter(user=user).delete()

        otp = PasswordResetOTP.generate_otp()

        PasswordResetOTP.objects.create(
            user=user,
            otp=otp
        )

        try:
            send_mail(
                subject="Password Reset OTP",
                message=(
                    f"Your OTP for password reset is: {otp}\n"
                    "It expires in 5 minutes.\n"
                    "If you did not request this, you can ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send password reset OTP email")
            return Response(
                {"error": "Unable to send OTP email right now. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "If this email exists, an OTP has been sent."}
        )

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")

        if not email or not otp or not new_password:
            return Response(
                {"error": "Email, OTP and new password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"error": "Invalid email or OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            is_verified=False
        ).first()

        if not otp_record:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_record.is_expired():
            otp_record.delete()
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate strong password
        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        otp_record.is_verified = True
        otp_record.save()

        return Response(
            {"message": "Password reset successful"}
        )

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")
        otp = request.data.get("otp")

        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"error": "Invalid email"}, status=400)

        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            otp=otp,
            is_verified=False
        ).first()

        if not otp_record:
            return Response({"error": "Invalid OTP"}, status=400)

        if otp_record.is_expired():
            otp_record.delete()
            return Response({"error": "OTP expired"}, status=400)

        return Response({"message": "OTP verified"})

# 🔐 LOGIN VIEW
class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        access_token = serializer.validated_data['access']
        refresh_token = serializer.validated_data['refresh']

        response = Response({
            "access": access_token
        })

        # ✅ Store refresh token in HttpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # change to True in production (HTTPS)
            samesite="Lax"
        )

        return response

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        data = {
            "id": user.id,
            "first_name": user.first_name,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "gender": user.get_gender_display() if user.gender else None,
            "mobile": user.mobile,
        }

        # 🔐 Safe center handling (for non-student roles if applicable)
        if hasattr(user, "center") and user.center:
            data["center"] = user.center.name
        else:
            data["center"] = None

        # 🔥 Student-specific details
        if user.role == "STUDENT":
            student = Student.objects.filter(user=user).select_related("batch__center").first()

            if student and student.batch and student.batch.center:
                center = student.batch.center

                data.update({
                    "batch_id": student.batch.id,
                    "batch_name": student.batch.name,
                    "batch_start_date": student.batch.start_date,
                    "batch_end_date": student.batch.end_date,
                    "center_name": center.name,
                    "center_latitude": center.latitude,
                    "center_longitude": center.longitude,
                    "allowed_radius": center.allowed_radius,  # ✅ correct field name
                    "photo": student.photo,
                })

            else:
                data.update({
                    "batch_id": None,
                    "batch_name": None,
                    "batch_start_date": None,
                    "batch_end_date": None,
                    "photo": None,
                })

        return Response(data)


# 🔄 REFRESH VIEW
class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"error": "No refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            return Response({
                "access": access_token
            })

        except Exception:
            return Response(
                {"error": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )


# 🚪 LOGOUT VIEW
class LogoutView(APIView):

    def post(self, request):
        response = Response({"message": "Logged out successfully"})
        response.delete_cookie("refresh_token")
        return response


User = get_user_model()

class CreateAnalystView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admin can create analyst"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get("email")
        name = request.data.get("name")
        password = request.data.get("password")
        center_id = request.data.get("center")
        mobile = request.data.get("mobile")
        gender = request.data.get("gender")

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            validate_password(
                password,
                User(email=email, username=email, first_name=name, role="ANALYST")
            )
        except ValidationError as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            email=email,
            username=email,   # Required internally
            password=password,
            role="ANALYST",
            center_id=center_id,
            mobile=mobile,
            gender=gender,
            first_name=name   # ← Store actual name here
        )

        return Response(
            {"message": "Analyst created successfully"},
            status=status.HTTP_201_CREATED
        )

class ListAnalystView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admin can view analysts"},
                status=403
            )

        analysts = User.objects.filter(role="ANALYST")

        data = [
            {
                "id": user.id,
                "name": user.first_name,
                "email": user.email,
                "mobile": user.mobile,
                "gender": user.gender,
                "centerId": user.center.id if user.center else None,
                "centerName": user.center.name if user.center else None
            }
            for user in analysts
        ]

        return Response(data)

class UpdateAnalystView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id):

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        analyst = get_object_or_404(User, id=id, role="ANALYST")

        analyst.first_name = request.data.get("name")
        analyst.email = request.data.get("email")
        analyst.username = request.data.get("email") 
        analyst.mobile = request.data.get("mobile")
        analyst.gender = request.data.get("gender")

        center_id = request.data.get("center")
        if center_id:
            analyst.center_id = center_id

        if request.data.get("password"):
            try:
                validate_password(request.data.get("password"), analyst)
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            analyst.set_password(request.data.get("password"))

        analyst.save()

        return Response({"message": "Updated successfully"})


class DeleteAnalystView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        analyst = get_object_or_404(User, id=id, role="ANALYST")
        analyst.delete()

        return Response({"message": "Deleted successfully"})


class CreateCounsellorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        email = request.data.get("email")
        name = request.data.get("name")
        password = request.data.get("password")
        center_id = request.data.get("center")
        mobile = request.data.get("mobile")
        gender = request.data.get("gender")

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)
        
        try:
            validate_password(
                password,
                User(email=email, username=email, first_name=name, role="COUNSELLOR")
            )
        except ValidationError as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        User.objects.create_user(
            email=email,
            username=email,
            password=password,
            role="COUNSELLOR",
            center_id=center_id,
            mobile=mobile,
            gender=gender,
            first_name=name
        )

        return Response({"message": "Counsellor created"}, status=201)        

class ListCounsellorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        counsellors = User.objects.filter(role="COUNSELLOR")

        data = [
            {
                "id": user.id,
                "name": user.first_name,
                "email": user.email,
                "mobile": user.mobile,
                "gender": user.gender,
                "centerId": user.center.id if user.center else None,
                "centerName": user.center.name if user.center else None
            }
            for user in counsellors
        ]

        return Response(data)      

# 🔹 Update Counsellor
class UpdateCounsellorView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id):

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        counsellor = get_object_or_404(User, id=id, role="COUNSELLOR")

        counsellor.first_name = request.data.get("name")
        counsellor.email = request.data.get("email")
        counsellor.mobile = request.data.get("mobile")
        counsellor.gender = request.data.get("gender")

        center_id = request.data.get("center")
        if center_id:
            counsellor.center_id = center_id

        if request.data.get("password"):
            try:
                validate_password(request.data.get("password"), counsellor)
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            counsellor.set_password(request.data.get("password"))

        counsellor.save()

        return Response({"message": "Counsellor updated successfully"})


# 🔹 Delete Counsellor
class DeleteCounsellorView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin allowed"}, status=403)

        counsellor = get_object_or_404(User, id=id, role="COUNSELLOR")
        counsellor.delete()

        return Response({"message": "Counsellor deleted successfully"})          
