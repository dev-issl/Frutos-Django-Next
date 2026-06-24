import re

with open('frontend/src/app/dashboard/products/page.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = 'import ProductForm from "@/app/dashboard/_components/ProductForm";\n'

new_content = re.sub(
    r'(const TABS = \[.*?\];.*?function ProductForm\(\{.*?^}\n)',
    import_stmt,
    content,
    flags=re.MULTILINE | re.DOTALL
)

with open('frontend/src/app/dashboard/products/page.jsx', 'w', encoding='utf-8') as out:
    out.write(new_content)

print('ProductForm removed from page.jsx!')
