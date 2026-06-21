import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'servixos.com';
const RESERVED = new Set(['www', 'app']);

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? '';
  const host = hostname.replace(/:.*$/, ''); // strip port for local dev

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.slice(0, -(ROOT_DOMAIN.length + 1));

    if (subdomain && !RESERVED.has(subdomain) && !req.nextUrl.pathname.startsWith('/sites/')) {
      const url = req.nextUrl.clone();
      url.pathname = `/sites/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
