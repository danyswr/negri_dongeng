#ini file models.py adalah file yang mendefinisikan model untuk pengguna dan profil pengguna.

from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nim = models.CharField(max_length=20, primary_key=True)  # Jadikan nim sebagai primary key
    full_name = models.CharField(max_length=100, blank=False, null=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    jurusan = models.CharField(max_length=100, blank=False, null=False)
    angkatan = models.PositiveIntegerField(blank=False, null=False)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile (NIM: {self.nim})"
    
    def __str__(self):
        return self.user.username