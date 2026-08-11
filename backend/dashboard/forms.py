## ════════════════════════════════════════════════════════════════════════════
## তোমার dashboard/forms.py তে ProductForm class এর Meta.fields এ
## 'origin' আর 'unit' যোগ করো, এবং widgets এ তাদের styling যোগ করো।
## নিচে পুরো ProductForm দেওয়া আছে — replace করো।
## ════════════════════════════════════════════════════════════════════════════

from django import forms
from products.models import Product, Brand, SubCategory, Color, Size
from orders.models import Order
from shops.models import Shop
from users.models import Address
from django_ckeditor_5.widgets import CKEditor5Widget
from django.db import transaction


class ProductForm(forms.ModelForm):
    """
    ModelForm for Product CRUD operations.
    ✅ origin, unit fields যোগ করা হয়েছে।
    ✅ sub_category field exclude করা হয়েছে কারণ template এ manually render হয়।
    """

    description = forms.CharField(
        widget=CKEditor5Widget(config_name='default'),
        required=True,
        label='Product Description'
    )

    new_colors = forms.CharField(
        required=False,
        label='Add New Colors',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter color names separated by commas (e.g., Red, Blue, Green)',
        }),
        help_text="Enter new color names separated by commas."
    )

    new_sizes = forms.CharField(
        required=False,
        label='Add New Sizes',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter size names separated by commas (e.g., S, M, L, XL)',
        }),
        help_text="Enter new size names separated by commas."
    )

    class Meta:
        model = Product
        fields = [
            'shop', 'brand', 'name', 'sub_category', 'shipping_category',
            'description', 'price', 'discount_price', 'wholesale_price',
            'minimum_purchase', 'stock',
            'unit', 'origin',                  # ✅ NEW FIELDS
            'weight', 'length', 'width', 'height',
            'thumbnail', 'colors', 'sizes', 'is_active'
        ]
        widgets = {
            'shop':                     forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'brand':                    forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'name':                     forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter product name'}),
            'sub_category':             forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'shipping_category':        forms.Select(attrs={'class': 'form-select form-select-sm'}),
            'price':                    forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': '0.00'}),
            'discount_price':           forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': '0.00'}),
            'wholesale_price':          forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': '0.00'}),
            'minimum_purchase':         forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '1'}),
            'stock':                    forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '0'}),
            'unit':                     forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. kg, piece, bunch'}),   # ✅
            'origin':                   forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. Spain, Local Farm'}),   # ✅
            'weight':                   forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'length':                   forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'width':                    forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'height':                   forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'thumbnail':                forms.FileInput(attrs={'class': 'form-control'}),
            'colors':                   forms.CheckboxSelectMultiple(),
            'sizes':                    forms.CheckboxSelectMultiple(),
            'is_active':                forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['brand'].required                     = False
        self.fields['shipping_category'].required         = False
        self.fields['discount_price'].required            = False
        self.fields['wholesale_price'].required           = False
        self.fields['weight'].required                    = False
        self.fields['length'].required                    = False
        self.fields['width'].required                     = False
        self.fields['height'].required                    = False
        self.fields['thumbnail'].required                 = False
        self.fields['colors'].required                    = False
        self.fields['sizes'].required                     = False
        self.fields['unit'].required                      = False   # ✅
        self.fields['origin'].required                    = False   # ✅

        # ✅ Sub category queryset — category name ও দেখাবে
        self.fields['sub_category'].queryset = SubCategory.objects.select_related('category').order_by('category__name', 'name')
        self.fields['sub_category'].label_from_instance = lambda obj: f"{obj.category.name} › {obj.name}"

    def clean_new_colors(self):
        new_colors = self.cleaned_data.get('new_colors', '')
        if new_colors:
            return [c.strip() for c in new_colors.split(',') if c.strip()]
        return []

    def clean_new_sizes(self):
        new_sizes = self.cleaned_data.get('new_sizes', '')
        if new_sizes:
            return [s.strip() for s in new_sizes.split(',') if s.strip()]
        return []

    def clean(self):
        cleaned_data   = super().clean()
        price          = cleaned_data.get('price')
        discount_price = cleaned_data.get('discount_price')

        # ✅ Validate: discount price must be less than original price
        if price and discount_price and discount_price >= price:
            self.add_error('discount_price', 'Discount price must be less than the original price.')

        return cleaned_data

    @transaction.atomic
    def save(self, commit=True):
        instance = super().save(commit=False)

        if commit:
            instance.save()
            self.save_m2m()

            # Handle new colors
            for color_name in self.cleaned_data.get('new_colors', []):
                color, _ = Color.objects.get_or_create(
                    name__iexact=color_name,
                    defaults={'name': color_name, 'hex_code': '#000000'}
                )
                instance.colors.add(color)

            # Handle new sizes
            for size_name in self.cleaned_data.get('new_sizes', []):
                size, _ = Size.objects.get_or_create(
                    name__iexact=size_name,
                    defaults={'name': size_name}
                )
                instance.sizes.add(size)

        return instance


class OrderForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = [
            'user', 'status', 'payment_status',
            'customer_name', 'customer_email', 'customer_phone',
            'shipping_address', 'shipping_method',
            'tracking_number', 'total_amount', 'cart_subtotal'
        ]
        widgets = {
            'user':             forms.Select(attrs={'class': 'form-select', 'style': 'background-color: white;'}),
            'status':           forms.Select(attrs={'class': 'form-select', 'style': 'background-color: white;'}),
            'payment_status':   forms.Select(attrs={'class': 'form-select', 'style': 'background-color: white;'}),
            'customer_name':    forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Customer name'}),
            'customer_email':   forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'customer@example.com'}),
            'customer_phone':   forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Phone number'}),
            'shipping_address': forms.Select(attrs={'class': 'form-select', 'style': 'background-color: white;'}),
            'shipping_method':  forms.Select(attrs={'class': 'form-select', 'style': 'background-color: white;'}),
            'tracking_number':  forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Tracking number'}),
            'total_amount':     forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'cart_subtotal':    forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['user'].required             = False
        self.fields['shipping_address'].required = False
        self.fields['shipping_method'].required  = False
        self.fields['tracking_number'].required  = False