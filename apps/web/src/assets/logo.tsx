import { type SVGProps } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 130 130"
      fill="none"
      className={cn("size-6", className)}
      {...props}
    >
      <defs>
        <linearGradient id="neptuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#9955FF" }} />
          <stop offset="100%" style={{ stopColor: "#7C3AED" }} />
        </linearGradient>
      </defs>

      <g transform="translate(65, 65)">
        {/* 8 Petals / Network Connections (Mandala Style) */}
        <g stroke="url(#neptuGrad)" strokeWidth="8" fill="none">
          <path d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10" />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(45)"
          />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(90)"
          />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(135)"
          />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(180)"
          />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(225)"
          />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(270)"
          />
          <path
            d="M0 -10 C 10 -30, 20 -40, 0 -55 C -20 -40, -10 -30, 0 -10"
            transform="rotate(315)"
          />
        </g>

        {/* Nodes at tips (Key feature of Concept 1) */}
        <g fill="#FFFFFF">
          <circle cx="0" cy="-55" r="3" />
          <circle cx="39" cy="-39" r="3" />
          <circle cx="55" cy="0" r="3" />
          <circle cx="39" cy="39" r="3" />
          <circle cx="0" cy="55" r="3" />
          <circle cx="-39" cy="39" r="3" />
          <circle cx="-55" cy="0" r="3" />
          <circle cx="-39" cy="-39" r="3" />
        </g>

        {/* Center Core */}
        <circle cx="0" cy="0" r="8" fill="url(#neptuGrad)" />
      </g>
    </svg>
  );
}
