import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';

  if (host.startsWith('prep.')) {
    if (!url.pathname.startsWith('/prep')) {
      url.pathname = '/prep' + (url.pathname === '/' ? '' : url.pathname);
      return NextResponse.rewrite(url);
    }
  } else if (host.startsWith('hr.')) {
    if (!url.pathname.startsWith('/hr')) {
      url.pathname = '/hr' + (url.pathname === '/' ? '' : url.pathname);
      return NextResponse.rewrite(url);
    }
  } else if (host.startsWith('airports.')) {
    if (!url.pathname.startsWith('/airports')) {
      url.pathname = '/airports' + (url.pathname === '/' ? '' : url.pathname);
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
