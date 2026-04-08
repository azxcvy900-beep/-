import { NextRequest, NextResponse } from 'next/server';
import { getStoreInfo } from '@/lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug') || 'demo';
  
  try {
    const store = await getStoreInfo(slug);
    const storeName = store?.name || 'Buyers Platform';
    const storeLogo = store?.logo || '/favicon.ico';
    const primaryColor = store?.primaryColor || '#3b82f6';

    const manifest = {
      name: storeName,
      short_name: storeName,
      description: store?.description || 'Your premium shopping experience.',
      start_url: `/${slug}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: primaryColor,
      icons: [
        {
          src: storeLogo,
          sizes: 'any',
          type: 'image/png'
        },
        {
          src: storeLogo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: storeLogo,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    return NextResponse.json(manifest);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate manifest' }, { status: 500 });
  }
}
