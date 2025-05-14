from rest_framework import serializers
from .models import Post, Comment, Reaction
import re

# Daftar kata-kata terlarang untuk filter konten
FORBIDDEN_WORDS = [
    r'\bseks\b', r'\bporno\b', r'\bnude\b', r'\berotic\b', r'\bdewasa\b',
    r'\b18\+\b', r'\bxxx\b', r'\bnaked\b', r'\bvulgar\b', r'\bgenital\b',
]

def validate_content(value):
    """Filter konten yang tidak sesuai (18+)."""
    for word in FORBIDDEN_WORDS:
        if re.search(word, value.lower(), re.IGNORECASE):
            raise serializers.ValidationError("Content contains inappropriate language.")
    return value

class PostSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    image = serializers.ImageField(required=False)

    class Meta:
        model = Post
        fields = ['id', 'user', 'content', 'image', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_content(self, value):
        return validate_content(value)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_content(self, value):
        return validate_content(value)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'post', 'user', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)