

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ix-#dj)eo1vu6l%c**t&cw!53gyyfyic824tueuek(&1l3rj4i')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')


AUTH_USER_MODEL = 'users.User'


# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 3rd Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # For token blacklisting
    'drf_spectacular',  # API Documentation
    'corsheaders',
    'import_export',  # Import/Export functionality
    'django_ckeditor_5',  # CKEditor 5
    'django_filters',
    'django_extensions',

    # Local Apps
    'accounts',  # User authentication and profiles
    'users',
    'shops',
    'products',
    'orders',
    'wholesale',
    'stores',  # Store management app
    'website',  # Website management app
    'sections',  # Sections management app
    'utils',  # Utility functions
    'dashboard',  # Custom Admin Dashboard
    'staff',  # Staff Management and Dashboard
    'livechat', # Live Chat for Admin and Staff
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'utils.middleware.SuppressReloadEventsMiddleware',  # Handle reload events
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'dashboard.context_processors.dashboard_context',  # Dashboard navigation
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

if os.environ.get('REDIS_URL'):
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [os.environ.get('REDIS_URL')],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        },
    }

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

if os.environ.get('DB_ENGINE') == 'django.db.backends.postgresql':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}

# Redis Cache (disabled for now - requires Redis server)
# CACHES = {
#     "default": {
#         "BACKEND": "django_redis.cache.RedisCache",
#         "LOCATION": "redis://127.0.0.1:6379/1",
#         "OPTIONS": {
#             "CLIENT_CLASS": "django_redis.client.DefaultClient",
#         }
#     }
# }


# ============================================================================
# JAZZMIN SETTINGS - Admin Dashboard Configuration
# ============================================================================

JAZZMIN_SETTINGS = {
    "site_title": "Frutos admin",
    "site_header": "Frutos",
    "site_brand": "Frutos",
    "welcome_sign": "Welcome to ICommerce Admin",
    "copyright": "ICommerce © 2026",

    "site_logo": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,

    "user_avatar": None,

    "topmenu_links": [
        {"name": "Dashboard", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Orders", "url": "admin:orders_order_changelist", "permissions": ["orders.view_order"]},
        {"name": "Products", "url": "admin:products_product_changelist", "permissions": ["products.view_product"]},
        {"name": "View Site", "url": "/", "new_window": True},
    ],

    "show_sidebar": True,
    "navigation_expanded": False,

    "hide_apps": ["django_otp"],

    "hide_models": [
        "auth.Group",
        "authtoken.Token",
        "authtoken.TokenProxy",
        "contenttypes.ContentType",
        "sessions.Session",
        "admin.LogEntry",
    ],

    "order_with_respect_to": [
        "orders",
        "products",
        "shops",
        "users",
        "website",
        "sections",
        "auth",
    ],

    "custom_links": {
        "orders": [{
            "name": "Order Statistics",
            "url": "admin:orders_order_changelist",
            "icon": "fas fa-chart-line",
            "permissions": ["orders.view_order"]
        }],
    },

    "icons": {
        "orders": "fas fa-shopping-cart",
        "orders.Order": "fas fa-receipt",
        "orders.OrderItem": "fas fa-box-open",
        "orders.OrderUpdate": "fas fa-history",
        "orders.OrderPayment": "fas fa-credit-card",
        "orders.ShippingMethod": "fas fa-truck-fast",
        "products.ShippingCategory": "fas fa-boxes",
        "orders.ShippingTier": "fas fa-layer-group",
        "orders.Coupon": "fas fa-tags",
        "orders.FreeShippingRule": "fas fa-gift",

        "products": "fas fa-boxes",
        "products.Product": "fas fa-cube",
        "products.Brand": "fas fa-certificate",
        "products.Category": "fas fa-folder",
        "products.SubCategory": "fas fa-folder-open",
        "products.Color": "fas fa-palette",
        "products.Size": "fas fa-ruler-combined",
        "products.ProductSpecification": "fas fa-list-ul",
        "products.ProductAdditionalImage": "fas fa-images",
        "products.CategoryMinimumOrderQuantity": "fas fa-boxes-stacked",

        "shops": "fas fa-store",
        "shops.Shop": "fas fa-store-alt",

        "users": "fas fa-users",
        "users.User": "fas fa-user",
        "users.Address": "fas fa-map-marker-alt",
        "users.WholesalerProfile": "fas fa-warehouse",
        "users.AffiliateProfile": "fas fa-handshake",

        "website": "fas fa-globe",
        "website.NavbarSettings": "fas fa-bars",
        "website.OfferCategory": "fas fa-percent",
        "website.HeroBanner": "fas fa-panorama",
        "website.OfferBanner": "fas fa-rectangle-ad",
        "website.HorizontalPromoBanner": "fas fa-ad",
        "website.BlogPost": "fas fa-newspaper",
        "website.FooterSection": "fas fa-layer-group",
        "website.FooterLink": "fas fa-link",
        "website.SocialMediaLink": "fas fa-share-nodes",
        "website.SiteSettings": "fas fa-sliders",

        "sections": "fas fa-th-large",
        "sections.Section": "fas fa-puzzle-piece",
        "sections.SectionItem": "fas fa-cube",
        "sections.PageSection": "fas fa-pager",

        "auth": "fas fa-shield-halved",
        "auth.User": "fas fa-user-shield",
        "auth.Group": "fas fa-users-cog",
    },

    "default_icon_parents": "fas fa-chevron-right",
    "default_icon_children": "fas fa-circle",

    "search_model": [
        "orders.Order",
        "products.Product",
        "users.User",
        "shops.Shop"
    ],

    "related_modal_active": False,
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,

    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "users.User": "collapsible",
        "orders.Order": "horizontal_tabs",
        "products.Product": "horizontal_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": True,
    "footer_small_text": True,
    "body_small_text": True,
    "brand_small_text": False,

    "navbar": "navbar-dark navbar-gray-dark",
    "sidebar": "sidebar-dark-gray",
    "brand_colour": "navbar-gray-dark",
    "accent": "accent-primary",

    "navbar_fixed": True,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "layout_boxed": False,
    "no_navbar_border": True,

    "sidebar_nav_small_text": True,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": True,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": True,

    "theme": "default",
    "dark_mode_theme": None,

    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    },

    "actions_sticky_top": True,
}

JAZZMIN_SETTINGS["custom_css"] = "admin/css/custom_admin.css"


# ============================================================================
# PASSWORD VALIDATION
# ============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dhaka'
USE_I18N = True
USE_TZ = True


STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = []

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ============================================================================
# CORS & CSRF CONFIGURATION (Fully Dynamic via .env)
# ============================================================================

def parse_origins_from_env(env_key, default_list=None):
    """
    .env থেকে comma-separated origin list parse করে।
    Trailing slash, whitespace বাদ দেয় এবং empty entries filter করে।
    """
    raw = os.environ.get(env_key, '')
    origins = [
        origin.strip().rstrip('/')
        for origin in raw.split(',')
        if origin.strip()
    ]
    return origins if origins else (default_list or [])


# Local/dev fallback — .env এ কিছু না থাকলে এইগুলা ব্যবহার হবে
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

DEFAULT_CSRF_ORIGINS = [
    "https://icommerce.onrender.com",
]

CORS_ALLOWED_ORIGINS = parse_origins_from_env('CORS_ALLOWED_ORIGINS', DEFAULT_CORS_ORIGINS)
CSRF_TRUSTED_ORIGINS = parse_origins_from_env('CSRF_TRUSTED_ORIGINS', DEFAULT_CSRF_ORIGINS)

# Danger zone: সব origin allow করবে কিনা — emergency debug ছাড়া সবসময় False রাখবে
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]



_default_secure = not DEBUG
SESSION_COOKIE_SECURE = os.environ.get(
    'FORCE_SECURE_COOKIES', str(_default_secure)
).lower() == 'true'
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
CSRF_COOKIE_HTTPONLY = True


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'wholesale.authentication.WholesaleJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# DRF Spectacular Settings for API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'ICommerce API',
    'DESCRIPTION': 'Complete API documentation for ICommerce ecommerce platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
        'filter': True,
    },
    'SWAGGER_UI_FAVICON_HREF': None,
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
    },
}

# Simple JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=15),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'users.authentication.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]


# ============================================================================
# LOGGING (file logging optional — read-only filesystem হলে বন্ধ রাখো)
# ============================================================================
ENABLE_FILE_LOGGING = os.environ.get('ENABLE_FILE_LOGGING', 'False').lower() == 'true'

_handlers = {
    'console': {
        'class': 'logging.StreamHandler',
        'formatter': 'verbose',
    },
}
_active_handlers = ['console']

if ENABLE_FILE_LOGGING:
    _handlers['file'] = {
        'class': 'logging.FileHandler',
        'filename': 'debug.log',
        'formatter': 'verbose',
    }
    _active_handlers.append('file')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': _handlers,
    'root': {
        'handlers': _active_handlers,
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': _active_handlers,
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': _active_handlers,
            'level': 'ERROR',
            'propagate': False,
        },
        'products': {
            'handlers': _active_handlers,
            'level': 'DEBUG',
            'propagate': False,
        },
        'sections': {
            'handlers': _active_handlers,
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


# Login and Authentication
LOGIN_URL = 'admin:login'
LOGIN_REDIRECT_URL = '/dashboard/'


customColorPalette = [
    {'color': 'hsl(4, 90%, 58%)', 'label': 'Red'},
    {'color': 'hsl(340, 82%, 52%)', 'label': 'Pink'},
    {'color': 'hsl(291, 64%, 42%)', 'label': 'Purple'},
    {'color': 'hsl(262, 52%, 47%)', 'label': 'Deep Purple'},
    {'color': 'hsl(231, 48%, 48%)', 'label': 'Indigo'},
    {'color': 'hsl(207, 90%, 54%)', 'label': 'Blue'},
]

CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': [
            'heading', '|',
            'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
            'fontSize', 'fontColor', 'fontBackgroundColor', '|',
            'alignment', '|',
            'insertTable', 'imageUpload', '|',
            'undo', 'redo'
        ],
        'height': '400px',
        'width': '100%',
        'heading': {
            'options': [
                {'model': 'paragraph', 'title': 'Paragraph', 'class': 'ck-heading_paragraph'},
                {'model': 'heading1', 'view': 'h1', 'title': 'Heading 1', 'class': 'ck-heading_heading1'},
                {'model': 'heading2', 'view': 'h2', 'title': 'Heading 2', 'class': 'ck-heading_heading2'},
                {'model': 'heading3', 'view': 'h3', 'title': 'Heading 3', 'class': 'ck-heading_heading3'},
            ]
        },
        'fontSize': {
            'options': [10, 12, 14, 'default', 18, 20, 22],
        },
        'fontColor': {
            'columns': 6,
            'colors': customColorPalette,
        },
        'fontBackgroundColor': {
            'columns': 6,
            'colors': customColorPalette,
        },
        'image': {
            'toolbar': [
                'imageTextAlternative', '|',
                'imageStyle:alignLeft',
                'imageStyle:alignCenter',
                'imageStyle:alignRight',
            ],
            'styles': [
                'full',
                'alignLeft',
                'alignCenter',
                'alignRight',
            ]
        },
        'table': {
            'contentToolbar': ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
        },
        'link': {
            'decorators': {
                'addTargetToExternalLinks': True,
                'defaultProtocol': 'https://',
            }
        },
    }
}

CKEDITOR_5_UPLOAD_PATH = "uploads/"
CKEDITOR_5_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"


# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = f"El Arbol Support <{EMAIL_HOST_USER}>"


# ============================================================================
# CELERY CONFIGURATION
# ============================================================================
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE