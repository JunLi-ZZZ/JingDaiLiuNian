/** 酒馆会重写消息中的class；data标记保留原值，只清理当前iframe所属的加载提示。 */
export function finishLoading(): void {
  const frame =
    window.frameElement ??
    (typeof getIframeName === 'function' ? window.parent.document.getElementById(getIframeName()) : null);
  const shell = frame?.closest('[data-embers-shell]');
  shell?.querySelector('[data-embers-note]')?.remove();
}
