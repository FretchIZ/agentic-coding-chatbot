from rest_framework import serializers
from .models import Session, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "type", "tool_call_id", "tool_name", "metadata", "created_at"]
        read_only_fields = ["id", "created_at"]


class SessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source="messages.count", read_only=True)

    class Meta:
        model = Session
        fields = ["id", "created_at", "updated_at", "metadata", "messages", "message_count"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source="messages.count", read_only=True)

    class Meta:
        model = Session
        fields = ["id", "created_at", "updated_at", "metadata", "message_count"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    session_id = serializers.UUIDField(required=False)
    context = serializers.JSONField(required=False, default=dict)