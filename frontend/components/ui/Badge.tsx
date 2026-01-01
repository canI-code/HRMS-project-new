import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-zinc-100 text-zinc-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-zinc-300 text-zinc-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
