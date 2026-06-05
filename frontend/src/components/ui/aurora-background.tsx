import { cn } from "../../utils";
import React, { ReactNode } from "react";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: {
  className?: string;
  children: ReactNode;
  showRadialGradient?: boolean;
}) => {
  return (
    <main
      className={cn(
        "relative flex flex-col min-h-screen bg-[#030303] transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className={cn(
            `
            [--dark-gradient:repeating-linear-gradient(100deg,#0a0a0a_0%,#0a0a0a_7%,transparent_10%,transparent_12%,#0a0a0a_16%)]
            [--aurora:repeating-linear-gradient(100deg,#4f46e5_10%,#a855f7_15%,#3b82f6_20%,#ec4899_25%,#4f46e5_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[20px]
            after:content-[""] after:absolute after:inset-0 
            after:[background-image:var(--dark-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            absolute -inset-[10px] opacity-[0.15] will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        ></div>
      </div>
      {children}
    </main>
  );
};
