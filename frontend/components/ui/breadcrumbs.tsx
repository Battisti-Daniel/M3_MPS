'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { TYPOGRAPHY, COLORS } from '@/constants/design-tokens';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const allItems = [
    { label: 'Início', href: '/dashboard' },
    ...items,
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx('flex items-center gap-2', className)}
    >
      <ol className="flex items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li
              key={item.href || item.label}
              className="flex items-center gap-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast ? (
                <span
                  className={clsx(
                    TYPOGRAPHY.body.small,
                    'font-medium',
                    COLORS.text.primary,
                    'flex items-center gap-1.5'
                  )}
                  aria-current="page"
                  itemProp="name"
                >
                  {isFirst && <Home className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    href={item.href!}
                    className={clsx(
                      TYPOGRAPHY.body.small,
                      'font-medium',
                      COLORS.text.secondary,
                      'hover:text-blue-600 transition-colors flex items-center gap-1.5',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
                    )}
                    itemProp="item"
                  >
                    {isFirst && <Home className="h-4 w-4" />}
                    <span itemProp="name">{item.label}</span>
                  </Link>
                  <meta itemProp="position" content={String(index + 1)} />
                  <ChevronRight
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

