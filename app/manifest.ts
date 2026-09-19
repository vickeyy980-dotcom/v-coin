import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'V Coin',
    short_name: 'V Coin',
    description: 'V Coin wallet',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0b0e17',
    theme_color: '#0b0e17',
    orientation: 'portrait',
    icons: [
      { src: '/vcoin-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/vcoin-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  };
}
