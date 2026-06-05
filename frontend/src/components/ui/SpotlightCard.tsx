import { ReactNode } from 'react';
import { Card, CardContent } from './card';
import { cn } from '../../utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SpotlightCard({ 
  children, 
  className,
  onClick
}: SpotlightCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-6',
        onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : '',
        className
      )}
    >
      {children}
    </Card>
  );
}
