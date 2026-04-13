from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password
        )

        if user is None:
            raise serializers.ValidationError("Invalid credentials")

        refresh = self.get_token(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["role"] = user.role
        token["username"] = user.username

        return token

class MeSerializer(serializers.ModelSerializer):

    batch_name = serializers.CharField(
        source="student.batch.name",
        read_only=True
    )

    batch_start_date = serializers.DateField(
        source="student.batch.start_date",
        read_only=True
    )

    batch_end_date = serializers.DateField(
        source="student.batch.end_date",
        read_only=True
    )

    center = serializers.CharField(
        source="student.batch.center.name",
        read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "email",
            "role",
            "batch_name",
            "batch_start_date",
            "batch_end_date",
            "center",
        ]