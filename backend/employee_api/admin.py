# backend/employee_api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin # Alias to avoid confusion with our class
from django.utils.translation import gettext_lazy as _
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    # list_display and list_filter are fine to extend like this
    list_display = BaseUserAdmin.list_display + ('role',)
    list_filter = BaseUserAdmin.list_filter + ('role',)
    # search_fields typically doesn't need 'role' unless it's a complex search,
    # BaseUserAdmin.search_fields already covers username, first_name, last_name, email.

    # Explicitly define fieldsets for the change form (editing an existing user)
    # We copy the structure from BaseUserAdmin and add 'role' to the 'Personal info' section.
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'role')}), # 'role' added here
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    # Explicitly define add_fieldsets for the add form (creating a new user)
    # We ensure all necessary fields including 'role', 'email', 'first_name', 'last_name' are present.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2'),
        }),
    )
    # Note: BaseUserAdmin.add_fieldsets usually only has one section.
    # If it had more, and we wanted to keep them, we'd append them like:
    # add_fieldsets = (
    #     (None, {
    #         'classes': ('wide',),
    #         'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2'),
    #     }),
    # ) + BaseUserAdmin.add_fieldsets[1:] # This assumes we are only modifying the first section
    # For simplicity and common use cases with custom user models, defining the whole tuple is often cleaner.