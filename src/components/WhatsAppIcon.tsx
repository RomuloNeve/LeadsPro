import React from "react";

interface WhatsAppIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const WhatsAppIcon = React.forwardRef<SVGSVGElement, WhatsAppIconProps>(
  ({ size = 24, color = "currentColor", ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  )
);

WhatsAppIcon.displayName = "WhatsAppIcon";

export { WhatsAppIcon };
