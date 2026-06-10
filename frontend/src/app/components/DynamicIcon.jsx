import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function DynamicIcon({ name, className, size = 24, fallbackName = 'CircleHelp' }) {
  // Convert any input (kebab-case, snake_case, spaces) to PascalCase to match Lucide exports
  const toPascalCase = (str) => {
    if (!str) return '';
    return str
      .split(/[-_ ]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  const formattedName = toPascalCase(name);
  const formattedFallback = toPascalCase(fallbackName);

  // Get the icon component from Lucide
  const Icon = LucideIcons[formattedName] || LucideIcons[formattedFallback] || LucideIcons.CircleHelp;
  
  if (!Icon) return null;
  
  return <Icon className={className} size={size} />;
}
