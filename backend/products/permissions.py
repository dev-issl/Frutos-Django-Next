# products/permissions.py
from rest_framework import permissions


class IsShopOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a shop to edit products within it.
    Admin users (is_staff / is_superuser / user_type ADMIN) can edit ANY product.
    Vendors can only edit products belonging to their own shop.
    Products belonging to the platform shop "Kidsmall" are admin-only.
    """

    def has_permission(self, request, view):
        # Allow read permissions for any request (including anonymous users)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user

        # Admin users (superuser or ADMIN user_type) can do anything
        # NOTE: STAFF users are explicitly excluded — they have their own permission system
        if user.is_superuser or getattr(user, 'user_type', '') == 'ADMIN':
            return True

        # Products tied to the platform's own shop ("Kidsmall") are admin-only
        if obj.shop and obj.shop.name and obj.shop.name.lower() == 'kidsmall':
            return False

        # Vendors / other users can only edit products in their own shop
        return obj.shop.owner == user