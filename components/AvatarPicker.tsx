'use client'

import { useState } from 'react'
import { EMOJI_AVATARS, PRESET_AVATARS, KID_AVATARS, presetAvatarSrc, kidAvatarSrc, parseAvatar } from '@/lib/avatars'
import { AvatarDisplay } from './AvatarDisplay'

type Tab = 'animals' | 'emoji' | 'presets'

interface AvatarPickerProps {
  value: string
  onChange: (avatar: string) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [tab, setTab] = useState<Tab>(() => {
    const parsed = parseAvatar(value)
    if (parsed.type === 'kid') return 'animals'
    if (parsed.type === 'preset') return 'presets'
    return 'animals'
  })

  return (
    <div>
      {/* Current avatar preview */}
      <div className="flex justify-center mb-4">
        <AvatarDisplay avatar={value} size={72} />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border-2 border-line mb-4">
        {(['animals', 'emoji', 'presets'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-bold transition-colors ${
              tab === t ? 'bg-brand text-white' : 'text-ink-secondary hover:bg-page'
            }`}
          >
            {t === 'animals' ? '🐾 Animals' : t === 'emoji' ? '😊 Emoji' : '🎨 Presets'}
          </button>
        ))}
      </div>

      {/* Animals grid (kid avatars) */}
      {tab === 'animals' && (
        <div className="grid grid-cols-6 gap-2">
          {KID_AVATARS.map(name => {
            const kidValue = `kid:${name}`
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(kidValue)}
                className={`w-11 h-11 rounded-full overflow-hidden transition-all mx-auto ${
                  value === kidValue
                    ? 'ring-2 ring-brand scale-110'
                    : 'hover:scale-105'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kidAvatarSrc(name)}
                  alt={name}
                  className="w-full h-full object-cover bg-page"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Emoji grid */}
      {tab === 'emoji' && (
        <div className="grid grid-cols-7 gap-2">
          {EMOJI_AVATARS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                value === emoji
                  ? 'bg-brand-light ring-2 ring-brand scale-110'
                  : 'bg-page hover:bg-brand-light'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Presets grid */}
      {tab === 'presets' && (
        <div className="grid grid-cols-6 gap-2">
          {PRESET_AVATARS.map(name => {
            const presetValue = `preset:${name}`
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(presetValue)}
                className={`w-11 h-11 rounded-full overflow-hidden transition-all mx-auto ${
                  value === presetValue
                    ? 'ring-2 ring-brand scale-110'
                    : 'hover:scale-105'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={presetAvatarSrc(name)}
                  alt={name}
                  className="w-full h-full object-cover bg-page"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
