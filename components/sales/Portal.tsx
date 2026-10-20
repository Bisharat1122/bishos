"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Render children into document.body. Nested dialogs need this: the kit's
 * Drawer panel keeps a transform (os-rise, fill-mode both), which would
 * otherwise trap `position: fixed` overlays inside the drawer. Clicks inside
 * still bubble through the React tree, so the wrapper stops them.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.body), []);
  if (!el) return null;
  return createPortal(
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </div>,
    el,
  );
}
