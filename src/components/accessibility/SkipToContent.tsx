export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-theme-icon focus:text-white focus:rounded-xl focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-theme-icon/50"
    >
      Skip to main content
    </a>
  );
}
