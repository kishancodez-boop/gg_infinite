import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({
  children,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white border border-[#DCE6DF] rounded-xl shadow-[0_1px_2px_rgba(16,42,37,0.04)] ${
        interactive ? 'transition-colors hover:border-[#16A36A]/60' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-5 py-4 border-b border-[#DCE6DF]/80 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-sm font-semibold text-[#17231F] tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-[#64736B] mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-3 border-t border-[#DCE6DF]/80 bg-[#F5F8F5]/50 rounded-b-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

