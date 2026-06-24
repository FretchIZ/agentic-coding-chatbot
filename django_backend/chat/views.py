from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from agents.coding_agent import coding_agent
from .models import Session, Message
from .serializers import SessionSerializer, SessionListSerializer, ChatRequestSerializer
import json


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    
    def get_serializer_class(self):
        if self.action == "list":
            return SessionListSerializer
        return SessionSerializer

    def create(self, request, *args, **kwargs):
        session = Session.objects.create()
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def chat(self, request, pk=None):
        session = self.get_object()
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message = Message.objects.create(
            session=session,
            role="user",
            content=serializer.validated_data["message"],
            type="text",
        )
        
        messages = list(session.messages.values("role", "content", "type", "tool_call_id", "tool_name", "metadata"))
        
        result = coding_agent.run(messages)
        
        if result["content"]:
            Message.objects.create(
                session=session,
                role="assistant",
                content=result["content"],
                type="text",
            )
        
        session.refresh_from_db()
        return Response(SessionSerializer(session).data)


class ChatViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session_id = serializer.validated_data.get("session_id")
        if session_id:
            session = get_object_or_404(Session, id=session_id)
        else:
            session = Session.objects.create()
        
        user_message = Message.objects.create(
            session=session,
            role="user",
            content=serializer.validated_data["message"],
            type="text",
        )
        
        messages = list(session.messages.values("role", "content", "type", "tool_call_id", "tool_name", "metadata"))
        
        result = coding_agent.run(messages)
        
        if result["content"]:
            Message.objects.create(
                session=session,
                role="assistant",
                content=result["content"],
                type="text",
            )
        
        session.refresh_from_db()
        return Response(SessionSerializer(session).data)