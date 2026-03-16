'use client'

import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import imageCompression from 'browser-image-compression'
import { EMOJI_AVATARS, PRESET_AVATARS, presetAvatarSrc, parseAvatar } from '@/lib/avatars'
import { AvatarDisplay } from './AvatarDisplay'
import { createClient } from '@/lib/supabase/client'

type Tab = 'emoji' | 'presets' | 'upload'

interface AvatarPickerProps {
  value: string
  onChange: (avatar: string) => void
  /** Supabase storage path prefix for uploads (e.g., "kids" or "members") */
  uploadPrefix?: string
}

export function AvatarPicker({ value, onChange, uploadPrefix = 'avatars' }: AvatarPickerProps) {
  const [tab, setTab] = useState<Tab>(() => {
    const parsed = parseAvatar(value)
    if (parsed.type === 'preset') return 'presets'
    if (parsed.type === 'url') return 'upload'
    return 'emoji'
  })
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  async function handleCropSave() {
    if (!cropSrc || !croppedArea) return
    setUploading(true)
    setUploadError('')

    try {
      // Create cropped canvas
      const image = new Image()
      image.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = reject
        image.src = cropSrc
      })

      const canvas = document.createElement('canvas')
      const size = 256
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        image,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
        0, 0, size, size,
      )

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas export failed')), 'image/webp', 0.85)
      })

      // Compress
      const compressed = await imageCompression(new File([blob], 'avatar.webp', { type: 'image/webp' }), {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 256,
        useWebWorker: true,
      })

      // Upload to Supabase Storage
      const supabase = createClient()
      const filename = `${uploadPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filename, compressed, { contentType: 'image/webp', upsert: true })

      if (uploadErr) {
        setUploadError(uploadErr.message)
        setUploading(false)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
      onChange(urlData.publicUrl)
      setCropSrc(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div>
      {/* Current avatar preview */}
      <div className="flex justify-center mb-4">
        <AvatarDisplay avatar={value} size={72} />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border-2 border-line mb-4">
        {(['emoji', 'presets', 'upload'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-bold transition-colors capitalize ${
              tab === t ? 'bg-brand text-white' : 'text-ink-secondary hover:bg-page'
            }`}
          >
            {t === 'emoji' ? '😊 Emoji' : t === 'presets' ? '🎨 Presets' : '📷 Photo'}
          </button>
        ))}
      </div>

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

      {/* Photo upload */}
      {tab === 'upload' && (
        <div className="flex flex-col items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl border-2 border-dashed border-line text-ink-secondary font-medium text-sm hover:border-brand hover:text-brand transition-colors"
          >
            📷 Choose a photo
          </button>
          {uploadError && (
            <p className="text-red-500 text-xs font-semibold">{uploadError}</p>
          )}
        </div>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl w-[90vw] max-w-sm overflow-hidden">
            <div className="relative h-72">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="px-4 py-2">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>
            {uploadError && (
              <p className="text-red-500 text-xs font-semibold text-center px-4">{uploadError}</p>
            )}
            <div className="flex gap-2 p-4">
              <button
                type="button"
                onClick={() => { setCropSrc(null); setUploadError('') }}
                className="flex-1 py-2.5 rounded-xl text-ink-muted font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white font-bold text-sm disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
