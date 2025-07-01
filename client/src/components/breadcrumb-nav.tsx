import { ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { getColor, getBorderRadius, getSpacing, getAACTypography } from '@/lib/design-system';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: getSpacing('sm'),
      ...getAACTypography('title', 'large'),
      color: getColor('surface.onSurface')
    }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: getSpacing('sm') }}>
          {item.href ? (
            <Link 
              href={item.href} 
              style={{ 
                textDecoration: 'none',
                color: getColor('primary.main'),
                fontWeight: item.isActive ? 600 : 500,
                padding: `${getSpacing('xs')}px ${getSpacing('sm')}px`,
                borderRadius: getBorderRadius('sm'),
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getColor('primary.container');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ 
              color: getColor('surface.onSurface'),
              fontWeight: 400
            }}>
              {item.label}
            </span>
          )}
          
          {index < items.length - 1 && (
            <ChevronRight size={16} style={{ color: getColor('outline.main') }} />
          )}
        </div>
      ))}
    </nav>
  );
}