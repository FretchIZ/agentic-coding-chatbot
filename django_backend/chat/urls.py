from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SessionViewSet, ChatViewSet

router = DefaultRouter()
router.register(r"sessions", SessionViewSet, basename="session")

urlpatterns = [
    path("", include(router.urls)),
    path("chat/", ChatViewSet.as_view({"post": "create"}), name="chat"),
]