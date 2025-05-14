#ini file urls.py adalah file utama yang mengatur routing URL untuk aplikasi Django.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),      # -> http://localhost:8000/api/users/...
    path('api/aspirasi/', include('aspirasi.urls')),  # -> http://localhost:8000/api/aspirasi/...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)