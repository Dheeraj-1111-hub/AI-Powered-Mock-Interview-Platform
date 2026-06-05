import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button } from './button';
import { cn } from '../../utils';

interface GlowingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  asChild?: boolean;
}

export const GlowingButton = forwardRef<HTMLButtonElement, GlowingButtonProps>(
  ({ className, variant = 'primary', children, asChild, ...props }, ref) => {
    if (variant === 'primary') {
      return (
        <div className={cn("relative group w-full", className)}>
           <Button
             ref={ref}
             className="relative flex h-full w-full items-center justify-center rounded-xl bg-white px-8 py-3.5 font-bold text-black transition-all hover:bg-slate-200 active:scale-[0.98] overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
             asChild={asChild}
             {...props}
           >
             <span className="relative z-10 flex items-center justify-center w-full h-full">
               {children}
             </span>
           </Button>
        </div>
      );
    }

    const shadcnVariant = variant === 'secondary' ? 'secondary' : 'outline';

    return (
      <Button
        ref={ref}
        variant={shadcnVariant}
        className={cn("rounded-2xl px-6 py-2.5", className)}
        asChild={asChild}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

GlowingButton.displayName = 'GlowingButton';

