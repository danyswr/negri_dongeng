from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.serializers import ValidationError
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserProfileSerializer
from .models import UserProfile
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import uuid
from django.core.mail import send_mail
from django.conf import settings
import logging
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


# Logger untuk keamanan
logger = logging.getLogger('django.security')

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].required = False
        self.fields['email'] = serializers.EmailField(required=False)
        
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token

    def validate(self, attrs):
        # Check if email is provided instead of username
        email = attrs.get('email')
        if email:
            try:
                user = User.objects.get(email=email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise ValidationError("No user found with this email address.")
        
        # Get username from attrs
        username = attrs.get('username')
        if not username:
            raise ValidationError("Either username or email must be provided.")
            
        # Check if user exists and email is verified
        user = User.objects.filter(username=username).first()
        if user and not user.profile.is_email_verified:
            logger.warning(f"Failed login attempt for {username}: Email not verified")
            raise ValidationError("Email is not verified.")
        if not user:
            logger.warning(f"Failed login attempt: Username {username} not found")
            
        return super().validate(attrs)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = 'login'  # Terapkan rate limiting khusus untuk login

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['create', 'verify_email', 'resend_verification']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verification_token = str(uuid.uuid4())
        profile = UserProfile.objects.get(user=user)
        profile.email_verification_token = verification_token
        profile.save()
        try:
            # Fix the verification link to use the correct URL
            verification_link = f"http://localhost:3000/verify-email?token={verification_token}&email={user.email}"
            send_mail(
                subject='Verify Your Email',
                message=f'ini link verifikasi nya wkoakwoakwoak: {verification_link}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return Response({'error': 'Failed to send verification email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        headers = self.get_success_headers(serializer.data)
        # Tambahkan redirect URL untuk frontend
        redirect_url = "http://localhost:3000/home"  # Changed to redirect to home
        return Response({
            'user': serializer.data,
            'message': 'User registered successfully. Please verify your email.',
            'redirect': redirect_url
        }, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def verify_email(self, request):
        token = request.query_params.get('token')
        if not token:
            logger.warning("Invalid email verification attempt: No token provided")
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = UserProfile.objects.get(email_verification_token=token)
            if profile.is_email_verified:
                return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
            profile.is_email_verified = True
            profile.email_verification_token = None
            profile.save()
            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            logger.warning(f"Invalid email verification token: {token}")
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def resend_verification(self, request):
        email = request.data.get('email')
        if not email:
            logger.warning("Resend verification attempt: No email provided")
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            profile = user.profile
            if profile.is_email_verified:
                return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
            verification_token = str(uuid.uuid4())
            profile.email_verification_token = verification_token
            profile.save()
            try:
                # Fix the verification link to use the correct URL
                verification_link = f"http://localhost:3000/verify-email?token={verification_token}&email={user.email}"
                send_mail(
                    subject='Verify Your Email',
                    message=f'makanya link di kasih langsung di klik bjierr kan toke nya bisa expired, nih gw baik gw kasih lagi: {verification_link}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"Failed to resend verification email to {user.email}: {str(e)}")
                return Response({'error': 'Failed to send verification email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({'message': 'Verification email resent'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.warning(f"Resend verification attempt: Email {email} not found")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        user = request.user
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)

        if request.method == 'GET':
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            logger.warning(f"Profile update failed for user {user.username}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def email_token_obtain_pair(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'No user found with this email address.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if email is verified
    if not user.profile.is_email_verified:
        return Response({'detail': 'Email is not verified.'}, status=status.HTTP_403_FORBIDDEN)
    
    # Authenticate with username and password
    user = authenticate(username=user.username, password=password)
    if user is None:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })
