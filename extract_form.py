import re

with open('frontend/src/app/dashboard/products/page.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract TABS and shared styles
tabs_match = re.search(r'(const TABS = \[.*?\];)', content, re.DOTALL)
styles_match = re.search(r'(// ── Shared styles ──────────────────────────────────────────────\nconst inputCls = .*?\nconst labelCls = .*?\n)', content, re.DOTALL)

# Extract ProductForm function
form_match = re.search(r'(function ProductForm\(\{.*?^}\n)', content, re.MULTILINE | re.DOTALL)

if not form_match:
    print('ProductForm not found')
else:
    imports = """\"use client\";

import { useState } from \"react\";
import { Plus, X, Upload, Loader2, ChevronDown, ChevronUp } from \"lucide-react\";
import SearchableSelect from \"@/app/dashboard/_components/SearchableSelect\";
import { colorsService, sizesService } from \"@/app/dashboard/_lib/services\";

"""
    
    out_content = imports + tabs_match.group(1) + '\n\n' + styles_match.group(1) + '\nexport default ' + form_match.group(1)
    
    with open('frontend/src/app/dashboard/_components/ProductForm.jsx', 'w', encoding='utf-8') as out:
        out.write(out_content)
    
    print('ProductForm extracted successfully!')
