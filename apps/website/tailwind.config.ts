import type { Config } from 'tailwindcss'
import mkidsPreset from '@mkids/ui/tailwind-preset'

const config: Config = {
  presets: [mkidsPreset as Config],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [require('tailwindcss-animate')],
}

export default config
