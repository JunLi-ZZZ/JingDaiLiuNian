// A top-layer host keeps fixed overlays tied to the viewport even when Tavern
// themes give body a transform/filter. Manual popovers do not move keyboard focus.
export function createPortalLayer(doc: Document) {
  const target = doc.createElement('div');
  target.dataset.jdnlLayer = '1';
  target.style.cssText = 'position:fixed;inset:0;width:auto;height:auto;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;z-index:2147483647';
  target.setAttribute('popover', 'manual');
  return {
    target,
    show() {
      doc.body.appendChild(target);
      if (typeof target.showPopover === 'function') {
        target.showPopover();
      } else {
        target.removeAttribute('popover');
        doc.documentElement.appendChild(target);
      }
    },
    destroy() { target.remove(); },
  };
}
