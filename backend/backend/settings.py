from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-ix-#dj)eo1vu6l%c**t&cw!53gyyfyic824tueuek(&1l3rj4i'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://192.168.1.6:3000",
    "http://10.17.90.71:3000",
    "https://icommerce-beta.vercel.app",
    "https://icommerce.passmcq.com",
    "https://icommerce.com.bd",
    "https://www.icommerce.com.bd"
]


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
        'DIRS': [],
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

# ============================================================================
# JAZZMIN ADMIN THEME CONFIGURATION
# ============================================================================
# Enterprise-grade, priority-driven admin dashboard for multivendor ecommerce
# Architecture: Business priority first, technical models hidden/deprioritized
# UX: Dark sidebar, compact spacing, high-density tables for scale

JAZZMIN_SETTINGS = {
    # ========================================================================
    # BRANDING & IDENTITY
    # ========================================================================
    "site_title": "ICommerce Admin",
    "site_header": "ICommerce",  # Shorter, cleaner header
    "site_brand": "ICommerce",
    "welcome_sign": "Welcome to ICommerce Admin",
    "copyright": "ICommerce Â© 2026",
    
    # Logo Configuration
    "site_logo": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,
    
    # User avatar field
    "user_avatar": None,
    
    # ========================================================================
    # TOP NAVBAR - Quick Actions
    # ========================================================================
    "topmenu_links": [
        {"name": "Dashboard", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Orders", "url": "admin:orders_order_changelist", "permissions": ["orders.view_order"]},
        {"name": "Products", "url": "admin:products_product_changelist", "permissions": ["products.view_product"]},
        {"name": "View Site", "url": "/", "new_window": True},
    ],
    
    # ========================================================================
    # SIDEBAR NAVIGATION - PRIORITY-BASED BUSINESS ARCHITECTURE
    # ========================================================================
    # Critical: Order reflects business priority, NOT alphabetical/app order
    # High Priority: Orders â†’ Products â†’ Vendors â†’ Customers
    # Medium Priority: Payments, Discounts, Content
    # Low Priority: Configuration, Technical Models
    
    "show_sidebar": True,
    "navigation_expanded": False,  # Collapsed by default for cleaner UX
    
    # Hide technical/system apps from sidebar clutter
    "hide_apps": ["django_otp"],  # OTP is admin-only technical feature
    
    # Hide low-value technical models
    "hide_models": [
        "auth.Group",  # Most admins don't need groups
        "authtoken.Token",
        "authtoken.TokenProxy",
        "contenttypes.ContentType",
        "sessions.Session",
        "admin.LogEntry",  # Audit logs - accessible via reports if needed
    ],
    
    # CRITICAL: Custom ordering - Business Priority Architecture
    # This is the heart of the UX improvement
    "order_with_respect_to": [
        # â–¼ TIER 1: HIGHEST PRIORITY - Daily Operations
        "orders",          # Orders & transactions (most critical)
        "products",        # Inventory management
        "shops",           # Vendor management
        "users",           # Customer & user management
        
        # â–¼ TIER 2: MEDIUM PRIORITY - Business Operations
        "website",         # Content & CMS
        "sections",        # Homepage sections
        
        # â–¼ TIER 3: LOWEST PRIORITY - System & Configuration
        "auth",            # Django auth (permissions, etc)
    ],
    
    # Custom app labels (human-friendly names without renaming models)
    "custom_links": {
        "orders": [{
            "name": "Order Statistics", 
            "url": "admin:orders_order_changelist",
            "icon": "fas fa-chart-line",
            "permissions": ["orders.view_order"]
        }],
    },
    
    # ========================================================================
    # ICONS - Consistent, Meaningful, Professional
    # ========================================================================
    # FontAwesome icons - business-relevant per model
    "icons": {
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # ORDERS & TRANSACTIONS (Cart, Money, Delivery Icons)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "orders": "fas fa-shopping-cart",
        "orders.Order": "fas fa-receipt",  # Receipt icon for orders
        "orders.OrderItem": "fas fa-box-open",
        "orders.OrderUpdate": "fas fa-history",
        "orders.OrderPayment": "fas fa-credit-card",
        "orders.ShippingMethod": "fas fa-truck-fast",
        "products.ShippingCategory": "fas fa-boxes",
        "orders.ShippingTier": "fas fa-layer-group",
        "orders.Coupon": "fas fa-tags",  # Tags for coupons
        "orders.FreeShippingRule": "fas fa-gift",
        
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # PRODUCTS & INVENTORY (Box, Tag, Category Icons)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "products": "fas fa-boxes",
        "products.Product": "fas fa-cube",  # Single product cube
        "products.Brand": "fas fa-certificate",  # Brand badge
        "products.Category": "fas fa-folder",
        "products.SubCategory": "fas fa-folder-open",
        "products.Color": "fas fa-palette",
        "products.Size": "fas fa-ruler-combined",
        "products.ProductSpecification": "fas fa-list-ul",
        "products.ProductAdditionalImage": "fas fa-images",
        "products.CategoryMinimumOrderQuantity": "fas fa-boxes-stacked",
        
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # VENDORS / SHOPS (Store, Business Icons)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "shops": "fas fa-store",
        "shops.Shop": "fas fa-store-alt",
        
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # USERS & CUSTOMERS (People, Address Icons)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "users": "fas fa-users",
        "users.User": "fas fa-user",
        "users.Address": "fas fa-map-marker-alt",
        "users.WholesalerProfile": "fas fa-warehouse",
        "users.AffiliateProfile": "fas fa-handshake",
        
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # CONTENT & WEBSITE (CMS, Banner, Blog Icons)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # SECTIONS (Homepage Management)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "sections": "fas fa-th-large",
        "sections.Section": "fas fa-puzzle-piece",
        "sections.SectionItem": "fas fa-cube",
        "sections.PageSection": "fas fa-pager",
        
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # AUTH & PERMISSIONS (System, Low Priority)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        "auth": "fas fa-shield-halved",
        "auth.User": "fas fa-user-shield",
        "auth.Group": "fas fa-users-cog",
    },
    
    # Default icons for nested items
    "default_icon_parents": "fas fa-chevron-right",
    "default_icon_children": "fas fa-circle",
    
    # ========================================================================
    # SEARCH BAR - Quick Model Lookup
    # ========================================================================
    # Most-searched models for admins
    "search_model": [
        "orders.Order", 
        "products.Product", 
        "users.User",
        "shops.Shop"
    ],
    
    # ========================================================================
    # UI BEHAVIOR
    # ========================================================================
    "related_modal_active": False,  # Simpler UX without modals
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,  # Disable UI builder for production
    
    # ========================================================================
    # FORM LAYOUTS - Optimized per Model Type
    # ========================================================================
    "changeform_format": "horizontal_tabs",  # Clean tabbed layout
    "changeform_format_overrides": {
        "users.User": "collapsible",  # User form is complex, collapsible better
        "orders.Order": "horizontal_tabs",  # Order details spread across tabs
        "products.Product": "horizontal_tabs",  # Product details tabbed
    },
}

# ============================================================================
# JAZZMIN UI TWEAKS - Visual Design & UX Optimization
# ============================================================================
# Enterprise Design System:
# - Dark gray sidebar (gray-900 equivalent)
# - Compact spacing for high-density data
# - Smaller fonts for more content per screen
# - Professional, calm aesthetic for daily use

JAZZMIN_UI_TWEAKS = {
    # ========================================================================
    # TYPOGRAPHY - Compact, Professional
    # ========================================================================
    "navbar_small_text": True,      # Smaller navbar text = more space
    "footer_small_text": True,      # Smaller footer
    "body_small_text": True,        # Smaller body text = higher density tables
    "brand_small_text": False,      # Keep brand text readable
    
    # ========================================================================
    # COLOR SCHEME - Dark Sidebar, Professional
    # ========================================================================
    # Dark gray sidebar (equivalent to Tailwind gray-900: #111827)
    "navbar": "navbar-dark navbar-gray-dark",
    "sidebar": "sidebar-dark-gray",  # Dark gray sidebar - enterprise look
    "brand_colour": "navbar-gray-dark",
    "accent": "accent-primary",
    
    # ========================================================================
    # LAYOUT - Fixed Sidebar, Spacious Content
    # ========================================================================
    "navbar_fixed": True,           # Navbar stays visible on scroll
    "footer_fixed": False,          # Footer scrolls naturally
    "sidebar_fixed": True,          # Sidebar always visible (key for navigation)
    "layout_boxed": False,          # Full-width layout for more data
    "no_navbar_border": True,       # Cleaner look without border
    
    # ========================================================================
    # SIDEBAR NAVIGATION - Compact, Flat, Modern
    # ========================================================================
    "sidebar_nav_small_text": True,         # Smaller text = more menu items visible
    "sidebar_disable_expand": False,        # Allow expanding submenus
    "sidebar_nav_child_indent": True,       # Indent child items for hierarchy
    "sidebar_nav_compact_style": True,      # Compact spacing between items
    "sidebar_nav_legacy_style": False,      # Modern style, not legacy
    "sidebar_nav_flat_style": True,         # Flat design (no excessive borders)
    
    # ========================================================================
    # THEME & DARK MODE
    # ========================================================================
    "theme": "default",
    "dark_mode_theme": None,  # Could enable later for true dark mode
    
    # ========================================================================
    # BUTTONS - Consistent Bootstrap Colors
    # ========================================================================
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    },
    
    # ========================================================================
    # TABLE ACTIONS - Sticky for Large Datasets
    # ========================================================================
    "actions_sticky_top": True,  # Action bar stays visible when scrolling tables
}


# ============================================================================
# CUSTOM CSS FOR ADDITIONAL UX REFINEMENTS
# ============================================================================
# Inject custom CSS for fine-tuned control beyond Jazzmin's built-in tweaks

# Option to add custom CSS file later:
JAZZMIN_SETTINGS["custom_css"] = "admin/css/custom_admin.css"  # Enables custom rotation + sidebar refinements

# Custom CSS can include:
# - More aggressive sidebar background: background-color: #111827 !important;
# - Reduced padding in list views for higher density
# - Custom hover states for better affordance
# - Improved table cell spacing
# 
# Example custom CSS (to be created if needed):
# 
# /* Sidebar - True Dark Gray (Tailwind gray-900) */
# .sidebar-dark-gray {
#     background-color: #111827 !important;
# }
# .sidebar-dark-gray .nav-link {
#     color: #e5e7eb !important;  /* gray-200 */
# }
# .sidebar-dark-gray .nav-link:hover {
#     background-color: #1f2937 !important;  /* gray-800 */
#     color: #ffffff !important;
# }
# 
# /* Higher Density Tables */
# .table-responsive table {
#     font-size: 0.875rem;
# }
# .table-responsive td, .table-responsive th {
#     padding: 0.4rem 0.75rem;
# }
# 
# /* Compact List Filters */
# #changelist-filter {
#     width: 200px;
# }
# #changelist-filter li {
#     padding: 3px 10px;
# }



# ============================================================================
# PASSWORD VALIDATION
# ============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Dhaka'

USE_I18N = True

USE_TZ = True




STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Additional locations for static files
STATICFILES_DIRS = []

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')



DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
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

CSRF_TRUSTED_ORIGINS = [
    'https://icommerce.onrender.com',

]

CSRF_COOKIE_SECURE = True  # Ensures the CSRF cookie is only sent over HTTPS
CSRF_COOKIE_HTTPONLY = True  # Prevents JavaScript access to CSRF cookie



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
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  # API Documentation
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
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # Extended to reduce spurious logouts
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
    
    # Additional security settings
    'BLACKLIST_AFTER_ROTATION': True,
}

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'users.authentication.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Logging configuration
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
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',  # Only log errors, not 404s
            'propagate': False,
        },
        'products': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'sections': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}










# # Cross-site Scripting (XSS)
# SECURE_BROWSER_XSS_FILTER = True
# SECURE_CONTENT_TYPE_NOSNIFF = True


# # SSL redirect
# SECURE_SSL_REDIRECT = True


# # HTTP Strict Transport Security (HSTS)
# SECURE_HSTS_SECONDS = 86400
# SECURE_HSTS_PRELOAD = True
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True



# Cross-site request forgery (CSRF) protection
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Login and Authentication
LOGIN_URL = 'admin:login'  # Redirect to admin login if not authenticated
LOGIN_REDIRECT_URL = '/dashboard/'  # Redirect to dashboard after login


# ============================================================================
# CKEDITOR 5 CONFIGURATION
# ============================================================================
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

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER')


