'use client'

import { parseAvatar, presetAvatarSrc, kidAvatarSrc } from '@/lib/avatars'
import { getFrameStyle } from '@/lib/frames'

interface AvatarDisplayProps {
  avatar: string
  size?: number
  className?: string
  /** Decorative frame ID (e.g., "stars", "crown", "rainbow") */
  frame?: string
}

/**
 * Renders any avatar type (emoji, preset SVG, uploaded photo URL) as a circular element.
 * Optionally shows a decorative frame around the avatar.
 */
export function AvatarDisplay({ avatar, size = 48, className = '', frame }: AvatarDisplayProps) {
  const parsed = parseAvatar(avatar)
  const frameStyle = getFrameStyle(frame)

  const wrapperStyle: React.CSSProperties = { width: size, height: size }
  const frameClass = frameStyle.className
  const overlaySize = Math.max(12, size * 0.3)

  const inner = parsed.type === 'emoji' ? (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-page flex-shrink-0 leading-none ${frameClass} ${className}`}
      style={{ ...wrapperStyle, fontSize: size * 0.55 }}
    >
      {parsed.value}
    </span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={parsed.type === 'preset' ? presetAvatarSrc(parsed.value) : parsed.type === 'kid' ? kidAvatarSrc(parsed.value) : parsed.value}
      alt="Avatar"
      className={`rounded-full object-cover flex-shrink-0 bg-page ${frameClass} ${className}`}
      style={wrapperStyle}
      onError={(e) => {
        const el = e.target as HTMLImageElement
        el.style.display = 'none'
        const span = document.createElement('span')
        span.textContent = '🧒'
        span.style.fontSize = `${size * 0.55}px`
        span.style.width = `${size}px`
        span.style.height = `${size}px`
        span.className = 'inline-flex items-center justify-center rounded-full bg-page'
        el.parentNode?.insertBefore(span, el)
      }}
    />
  )

  // No frame overlay needed
  if (!frameStyle.overlayEmoji) return inner

  return (
    <div className="relative inline-flex flex-shrink-0" style={wrapperStyle}>
      {inner}
      {frameStyle.overlayPosition === 'top' && (
        <span
          className="absolute -top-1 left-1/2 -translate-x-1/2 drop-shadow-sm"
          style={{ fontSize: overlaySize }}
        >
          {frameStyle.overlayEmoji}
        </span>
      )}
      {frameStyle.overlayPosition === 'ring' && (
        <>
          <span
            className="absolute -top-0.5 -right-0.5 drop-shadow-sm"
            style={{ fontSize: overlaySize * 0.7 }}
          >
            {frameStyle.overlayEmoji}
          </span>
          <span
            className="absolute -bottom-0.5 -left-0.5 drop-shadow-sm"
            style={{ fontSize: overlaySize * 0.7 }}
          >
            {frameStyle.overlayEmoji}
          </span>
        </>
      )}
    </div>
  )
}
