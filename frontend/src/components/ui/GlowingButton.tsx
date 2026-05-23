import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface GlowingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const GlowingButton = forwardRef<HTMLButtonElement, GlowingButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-background',
          'active:scale-95',
          variant === 'primary' && [
            'bg-indigo-600 text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]',
            'hover:bg-indigo-500 hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)]',
          ],
          variant === 'secondary' && [
            'bg-white/5 text-white backdrop-blur-md border border-white/10',
            'hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]',
          ],
          className
        )}
        {...props}
      >
        {/* Animated gradient border for primary variant */}
        {variant === 'primary' && (
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-70" />
        )}
        
        {/* Button Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

GlowingButton.displayName = 'GlowingButton';
