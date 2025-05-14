from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CustomTokenObtainPairView, email_token_obtain_pair

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', email_token_obtain_pair, name='email_token_obtain_pair'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/verify-email/', UserViewSet.as_view({'get': 'verify_email'}), name='verify_email'),
    path('auth/resend-verification/', UserViewSet.as_view({'post': 'resend_verification'}), name='resend_verification'),
]
