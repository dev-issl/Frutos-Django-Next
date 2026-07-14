"""
Image Optimization Utility
Handles image compression, resizing, and responsive image generation
"""
import os
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys


class ImageOptimizer:
    """
    Optimizes images for web use by compressing and resizing them.
    Creates multiple sizes for responsive images.
    """
    
    # Define standard sizes for different use cases
    SIZES = {
        'thumbnail': {'width': 300, 'height': 300, 'quality': 85},
        'small': {'width': 600, 'height': 600, 'quality': 85},
        'medium': {'width': 1200, 'height': 1200, 'quality': 80},
        'large': {'width': 1920, 'height': 1920, 'quality': 75},
    }
    
    # Image type specific sizes
    PRODUCT_SIZES = {
        'thumbnail': {'width': 400, 'height': 400, 'quality': 85},
        'card': {'width': 600, 'height': 600, 'quality': 85},
        'detail': {'width': 1200, 'height': 1200, 'quality': 80},
    }
    
    BANNER_SIZES = {
        'mobile': {'width': 768, 'height': 400, 'quality': 80},
        'tablet': {'width': 1024, 'height': 500, 'quality': 80},
        'desktop': {'width': 1920, 'height': 600, 'quality': 75},
    }
    
    CATEGORY_SIZES = {
        'thumbnail': {'width': 200, 'height': 200, 'quality': 85},
        'card': {'width': 400, 'height': 400, 'quality': 85},
    }
    
    LOGO_SIZES = {
        'small': {'width': 100, 'height': 100, 'quality': 90},
        'medium': {'width': 200, 'height': 200, 'quality': 90},
    }
    
    @staticmethod
    def optimize_image(image_field, max_width=1920, max_height=1920, quality=85, format='JPEG'):
        """
        Optimize a single image file
        
        Args:
            image_field: Django ImageField or uploaded file
            max_width: Maximum width for the image
            max_height: Maximum height for the image
            quality: JPEG quality (1-100)
            format: Output format (JPEG, PNG, WEBP)
        
        Returns:
            InMemoryUploadedFile: Optimized image file
        """
        if not image_field:
            return None
            
        try:
            # Open the image
            with Image.open(image_field) as img:
                
                # Convert RGBA to RGB if saving as JPEG
                if format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                    # Create a white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGB')
                
                # Get original dimensions
                original_width, original_height = img.size
                
                # Calculate new dimensions maintaining aspect ratio
                ratio = min(max_width / original_width, max_height / original_height)
                
                # Only resize if image is larger than max dimensions
                if ratio < 1:
                    new_width = int(original_width * ratio)
                    new_height = int(original_height * ratio)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                # Save to BytesIO
                output = BytesIO()
                
                # Set optimization parameters
                save_kwargs = {
                    'format': format,
                    'quality': quality,
                    'optimize': True,
                }
                
                # Add progressive for JPEG
                if format == 'JPEG':
                    save_kwargs['progressive'] = True
                
                img.save(output, **save_kwargs)
            output.seek(0)
            
            # Get the original filename and change extension if needed
            original_name = image_field.name
            name_without_ext = os.path.splitext(original_name)[0]
            
            # Set extension based on format
            extension_map = {'JPEG': '.jpg', 'PNG': '.png', 'WEBP': '.webp'}
            new_extension = extension_map.get(format, '.jpg')
            new_name = f"{name_without_ext}{new_extension}"
            
            # Create InMemoryUploadedFile
            content_type_map = {
                'JPEG': 'image/jpeg',
                'PNG': 'image/png',
                'WEBP': 'image/webp'
            }
            
            optimized_file = InMemoryUploadedFile(
                output,
                'ImageField',
                new_name,
                content_type_map.get(format, 'image/jpeg'),
                sys.getsizeof(output),
                None
            )
            
            return optimized_file
            
        except Exception as e:
            print(f"Error optimizing image: {e}")
            return image_field  # Return original if optimization fails
    
    @classmethod
    def optimize_product_image(cls, image_field):
        """Optimize product images with specific settings"""
        return cls.optimize_image(
            image_field,
            max_width=1200,
            max_height=1200,
            quality=85,
            format='JPEG'
        )
    
    @classmethod
    def optimize_banner_image(cls, image_field):
        """Optimize banner images with specific settings"""
        return cls.optimize_image(
            image_field,
            max_width=1920,
            max_height=800,
            quality=80,
            format='JPEG'
        )
    
    @classmethod
    def optimize_category_image(cls, image_field):
        """Optimize category images with specific settings"""
        return cls.optimize_image(
            image_field,
            max_width=600,
            max_height=600,
            quality=85,
            format='JPEG'
        )
    
    @classmethod
    def optimize_logo_image(cls, image_field):
        """Optimize logo images - keep PNG for transparency"""
        # First check if image has transparency
        try:
            with Image.open(image_field) as img:
                has_transparency = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
            image_field.seek(0)  # Reset file pointer
            
            if has_transparency:
                return cls.optimize_image(
                    image_field,
                    max_width=400,
                    max_height=400,
                    quality=90,
                    format='PNG'
                )
            else:
                return cls.optimize_image(
                    image_field,
                    max_width=400,
                    max_height=400,
                    quality=90,
                    format='JPEG'
                )
        except:
            # If we can't determine, optimize as JPEG
            return cls.optimize_image(
                image_field,
                max_width=400,
                max_height=400,
                quality=90,
                format='JPEG'
            )
    
    @staticmethod
    def get_image_dimensions(image_field):
        """Get dimensions of an image"""
        if not image_field:
            return None, None
        
        try:
            with Image.open(image_field) as img:
                width, height = img.size
            image_field.seek(0)  # Reset file pointer
            return width, height
        except Exception as e:
            print(f"Error getting image dimensions: {e}")
            return None, None
    
    @staticmethod
    def validate_image(image_field, max_size_mb=5, allowed_formats=None):
        """
        Validate image file
        
        Args:
            image_field: Django ImageField or uploaded file
            max_size_mb: Maximum file size in MB
            allowed_formats: List of allowed formats (e.g., ['JPEG', 'PNG'])
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if not image_field:
            return False, "No image provided"
        
        if allowed_formats is None:
            allowed_formats = ['JPEG', 'PNG', 'WEBP', 'GIF']
        
        try:
            # Check file size
            max_size_bytes = max_size_mb * 1024 * 1024
            if image_field.size > max_size_bytes:
                return False, f"Image size exceeds {max_size_mb}MB limit"
            
            # Check format
            with Image.open(image_field) as img:
                if img.format not in allowed_formats:
                    return False, f"Invalid format. Allowed: {', '.join(allowed_formats)}"
            
            image_field.seek(0)  # Reset file pointer
            return True, None
            
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
