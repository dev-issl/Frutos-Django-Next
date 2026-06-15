import os, glob

def replace_colors():
    d = r'd:\El-arbol\Frutos-Django-Next\frontend\src\app\dashboard'
    files = glob.glob(os.path.join(d, '**', '*.jsx'), recursive=True)
    c = 0
    for f in files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if 'bg-slate-900' in content:
            new_content = content.replace('bg-slate-900', 'bg-[#00694C]').replace('hover:bg-gray-800', 'hover:bg-[#085041]').replace('hover:bg-slate-800', 'hover:bg-[#085041]')
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            c += 1
            print(f"Updated {f}")
            
    print(f'Replaced in {c} files.')

if __name__ == "__main__":
    replace_colors()
