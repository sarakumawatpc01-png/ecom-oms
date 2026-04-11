import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'admin';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const variantClass =
    variant === 'admin'
      ? 'bg-violet-600 hover:bg-violet-700 text-white'
      : variant === 'secondary'
        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
        : 'bg-orange-500 hover:bg-orange-600 text-white';

  return <button className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${variantClass} ${className}`} {...props} />;
}
