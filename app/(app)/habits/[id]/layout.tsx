// Speed: an empty list makes this detail route on-demand static — each id's
// client shell renders once, is cached on the CDN, and list-page links can
// prefetch it fully. All data still loads live from Convex in the page.
export function generateStaticParams() {
  return [];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
