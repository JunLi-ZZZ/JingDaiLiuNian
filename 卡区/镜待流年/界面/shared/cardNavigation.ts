export type CardDestination = { action: 'phone' | 'bestiary'; owner?: string };
type Receiver = { rank: number; receive: (destination: CardDestination) => void; alive: () => boolean };
type BridgeWindow = Window & { jdnlCardReceivers?: Receiver[] };

// Script and status-bar iframes share the parent event target. Only the newest floor opens.
export function receiveCardNavigation(root: Window, rank: number, receive: Receiver['receive'], alive = () => true) {
  const host = root as BridgeWindow;
  const receivers = host.jdnlCardReceivers ||= [];
  const entry = { rank, receive, alive };
  receivers.push(entry);
  const handle = (event: Event) => {
    const latest = receivers.filter(item => { try { return item.alive(); } catch { return false; } }).reduce<Receiver | undefined>((a, b) => !a || b.rank >= a.rank ? b : a, undefined);
    if (latest !== entry) return;
    receive({ action: event.type === 'jdnl-open-phone' ? 'phone' : 'bestiary', owner: (event as CustomEvent).detail?.owner || '' });
  };
  root.addEventListener('jdnl-open-phone', handle);
  root.addEventListener('jdnl-open-bestiary', handle);
  return () => {
    root.removeEventListener('jdnl-open-phone', handle);
    root.removeEventListener('jdnl-open-bestiary', handle);
    const index = receivers.indexOf(entry);
    if (index >= 0) receivers.splice(index, 1);
  };
}
export function sendCardNavigation(root: Window, action: CardDestination['action']) {
  root.dispatchEvent(new CustomEvent(action === 'phone' ? 'jdnl-open-phone' : 'jdnl-open-bestiary'));
}
