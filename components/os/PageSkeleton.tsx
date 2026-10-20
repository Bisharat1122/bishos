/**
 * Shape-of-a-page placeholder (topbar strip, header, card grid). Shown for the
 * split second before a page's JS is ready — on a hard load and on the rare
 * uncached route switch — so a click always changes the screen at once.
 */
export function PageSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-14 border-b border-border" />
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-start gap-3">
          <div className="skeleton size-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-44" />
            <div className="skeleton h-4 w-72 max-w-[60vw]" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      </div>
    </div>
  );
}
