from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Batch


class CreateBatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "ANALYST":
            return Response(
                {"error": "Only analyst can create batch"},
                status=status.HTTP_403_FORBIDDEN
            )

        batch = Batch.objects.create(
            name=request.data.get("name"),
            center=request.user.center,
            analyst=request.user,  # ✅ FIXED
            start_date=request.data.get("start_date"),
            end_date=request.data.get("end_date")
        )

        return Response(
            {
                "message": "Batch created successfully",
                "batch_id": batch.id
            },
            status=status.HTTP_201_CREATED
        )


class ListBatchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user
        center_id = request.query_params.get("center_id")

        if user.role == "ADMIN":
            batches = Batch.objects.all()
            if center_id not in [None, ""]:
                batches = batches.filter(center_id=center_id)

        elif user.role in ["ANALYST", "COUNSELLOR"]:
            batches = Batch.objects.filter(center=user.center)

        else:
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_403_FORBIDDEN
            )

        data = []
        for batch in batches:
            data.append({
                "id": batch.id,
                "name": batch.name,
                "center_id": batch.center_id,
                "center": batch.center.name,
                "start_date": batch.start_date,
                "end_date": batch.end_date,
                "analyst": batch.analyst.username if batch.analyst else None
            })

        return Response(data)

class UpdateBatchView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):

        try:
            batch = Batch.objects.get(id=pk)
        except Batch.DoesNotExist:
            return Response({"error": "Batch not found"}, status=404)

        if request.user.role != "ANALYST":
            return Response(
                {"error": "Only analyst can update batch"},
                status=403
            )

        if batch.center != request.user.center:
            return Response(
                {"error": "Cannot modify batch of another center"},
                status=403
            )

        batch.name = request.data.get("name", batch.name)
        batch.start_date = request.data.get("start_date", batch.start_date)
        batch.end_date = request.data.get("end_date", batch.end_date)
        batch.save()

        return Response({"message": "Batch updated successfully"})        

class DeleteBatchView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        try:
            batch = Batch.objects.get(id=pk)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.role != "ANALYST":
            return Response(
                {"error": "Only analyst can delete batch"},
                status=status.HTTP_403_FORBIDDEN
            )

        if batch.center != request.user.center:
            return Response(
                {"error": "You cannot delete other center batches"},
                status=status.HTTP_403_FORBIDDEN
            )

        batch.delete()

        return Response({"message": "Batch deleted successfully"})
