interface Props {
  size?: number;
  className?: string;
}

/** 品牌用的小番茄图形 */
export default function TomatoGlyph({ size = 34, className }: Props) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M24 13.5c0-3.4 1.1-6 3.4-8.2"
        fill="none"
        stroke="#6fbf7f"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M24 13.2c-3.6-3.8-8.6-4.3-12.2-2.4 2.7 3.2 7 4.4 12.2 2.4Zm0 0c3.6-3.8 8.6-4.3 12.2-2.4-2.7 3.2-7 4.4-12.2 2.4Z"
        fill="#5aa86b"
      />
      <circle cx="24" cy="28.5" r="15.5" fill="#ff5f45" />
      <path
        d="M13.6 23.2a12.4 12.4 0 0 1 6.8-6.6"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
