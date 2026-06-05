import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "../../utils";

export function MovingBorder({
  children,
  duration = 4000,
  className,
  containerClassName,
  borderClassName,
}: {
  children: React.ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-transparent relative p-[1px] overflow-hidden rounded-2xl group",
        containerClassName
      )}
    >
      <div
        className="absolute inset-0 rounded-2xl"
      >
        <MovingBorderAnimation duration={duration} rx="16" ry="16">
          <div
            className={cn(
              "h-32 w-32 opacity-100 bg-[radial-gradient(var(--indigo-500)_40%,transparent_60%)]",
              borderClassName
            )}
          />
        </MovingBorderAnimation>
      </div>

      <div
        className={cn(
          "relative bg-[#111] backdrop-blur-xl flex flex-col w-full h-full",
          className
        )}
        style={{
          borderRadius: `calc(1rem - 1px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const MovingBorderAnimation = ({
  children,
  duration = 2000,
  rx,
  ry,
  ...otherProps
}: any) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val)?.x || 0
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val)?.y || 0
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};
