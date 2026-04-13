from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Center
from .serializers import CenterSerializer


# 🔹 Create Center (Admin Only)
class CenterCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        # 🔐 Only ADMIN can create centers
        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admin can create centers"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CenterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 List Centers (For Dropdowns etc.)
class CenterListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        centers = Center.objects.all()
        serializer = CenterSerializer(centers, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class CenterUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, id):

        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admin allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        center = get_object_or_404(Center, id=id)

        serializer = CenterSerializer(center, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)


class CenterDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):

        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admin allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        center = get_object_or_404(Center, id=id)
        center.delete()

        return Response({"message": "Center deleted successfully"})        