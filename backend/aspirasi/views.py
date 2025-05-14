from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Post, Comment, Reaction
from .serializers import PostSerializer, CommentSerializer, ReactionSerializer
import logging

# Logger untuk keamanan
logger = logging.getLogger('django.security')

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def comments(self, request, pk=None):
        post = self.get_object()
        comments = post.comments.all()
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def reactions(self, request, pk=None):
        post = self.get_object()
        reactions = post.reactions.all()
        serializer = ReactionSerializer(reactions, many=True)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        post_id = request.data.get('post')
        reaction_type = request.data.get('reaction_type')

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            logger.warning(f"Post {post_id} not found for reaction by user {request.user.username}")
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        # Cek apakah user sudah memberikan reaksi
        existing_reaction = Reaction.objects.filter(post=post, user=request.user).first()
        if existing_reaction:
            if existing_reaction.reaction_type == reaction_type:
                # Jika reaksi sama, hapus reaksi (toggle off)
                existing_reaction.delete()
                return Response({'message': f'{reaction_type} removed'}, status=status.HTTP_200_OK)
            else:
                # Jika reaksi berbeda, update reaksi
                existing_reaction.reaction_type = reaction_type
                existing_reaction.save()
                return Response({'message': f'Reaction updated to {reaction_type}'}, status=status.HTTP_200_OK)

        # Jika belum ada reaksi, buat baru
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)