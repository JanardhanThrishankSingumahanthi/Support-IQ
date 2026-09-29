interface ChatWatermarkProps {
  imageSrc?: string;
  className?: string;
}

/**
 * Standard SupportIQ Chat Watermark component.
 * Displays the authentic SupportIQ emblem centered behind chat messages.
 * Uses pointer-events: none and subtle opacity to never interfere with user interaction.
 */
export function ChatWatermark({ imageSrc = '/supportiq-watermark.png', className = '' }: ChatWatermarkProps) {
  if (!imageSrc) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none z-0 ${className}`}
    >
      <img
        src={imageSrc}
        alt=""
        className="max-h-[340px] max-w-[340px] w-auto h-auto object-contain opacity-[0.07] select-none pointer-events-none"
      />
    </div>
  );
}

