#ini file serializer.py adalah file yang mengatur serialisasi data untuk pengguna dan profil pengguna.

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True, min_length=8)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=100, required=True)
    nim = serializers.CharField(max_length=20, required=True)
    jurusan = serializers.CharField(max_length=100, required=True)
    angkatan = serializers.IntegerField(min_value=2000, max_value=2100, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirmation', 'phone_number', 'full_name', 'nim', 'jurusan', 'angkatan']

    def validate_username(self, value):
        if not re.match(r'^[\w.@+-]+$', value):
            raise serializers.ValidationError("Username contains invalid characters.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', value):
            raise serializers.ValidationError("Invalid email format.")
        return value

    def validate_nim(self, value):
        if UserProfile.objects.filter(nim=value).exists():
            raise serializers.ValidationError("NIM is already in use.")
        if not re.match(r'^\d{8,20}$', value):  # Asumsi NIM hanya angka, sesuaikan regex jika perlu
            raise serializers.ValidationError("Invalid NIM format. Use 8-20 digits.")
        return value

    def validate_phone_number(self, value):
        if value and not re.match(r'^\+?\d{10,15}$', value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        # Hapus password_confirmation sebelum membuat user
        validated_data.pop('password_confirmation')
        phone_number = validated_data.pop('phone_number', None)
        full_name = validated_data.pop('full_name')
        nim = validated_data.pop('nim')
        jurusan = validated_data.pop('jurusan')
        angkatan = validated_data.pop('angkatan')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        UserProfile.objects.create(
            user=user,
            phone_number=phone_number,
            full_name=full_name,
            nim=nim,
            jurusan=jurusan,
            angkatan=angkatan
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['user', 'phone_number', 'full_name', 'nim', 'jurusan', 'angkatan', 'is_email_verified']

    def validate_phone_number(self, value):
        if value and not re.match(r'^\+?\d{10,15}$', value):
            raise serializers.ValidationError("Invalid phone number format.")
        return value