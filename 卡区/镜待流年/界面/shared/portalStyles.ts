// Production bundles coalesce all component CSS. Copy rules, not the whole sheet:
// global body/reset rules belong to the iframe and must not restyle Tavern.
export function mountPortalStyles(source: Document, target: Document, selectors: RegExp) {
  if (source === target) return () => {};
  const imports = new Set<string>();
  const collect = (rules: CSSRuleList): string => Array.from(rules).map(rule => {
    if (rule.type === 3) { imports.add(rule.cssText); return ''; }
    if ('selectorText' in rule) return selectors.test(String(rule.selectorText)) ? rule.cssText : '';
    if (rule.type === 7 || rule.type === 5 || rule.type === 17) return rule.cssText;
    if ('cssRules' in rule) {
      const nested = collect((rule as CSSGroupingRule).cssRules);
      return nested ? `${rule.cssText.slice(0, rule.cssText.indexOf('{') + 1)}${nested}}` : '';
    }
    return '';
  }).join('\n');
  const style = target.createElement('style');
  style.dataset.jdnlPortal = '1';
  const css = Array.from(source.styleSheets).map(sheet => {
    try { return collect(sheet.cssRules); } catch { return ''; }
  }).join('\n');
  style.textContent = [...imports, css].join('\n');
  target.head.appendChild(style);
  return () => style.remove();
}
