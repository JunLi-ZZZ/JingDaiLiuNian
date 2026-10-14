import { teleportStyle } from '@util/script';
import { createLenticularRenderer } from './dom';

$(() => {
  const doc = window.parent.document;
  const singleton = '__jdnlLenticularCleanup';
  const owner = window.parent as Window & { __jdnlLenticularCleanup?: () => void };
  owner[singleton]?.();
  const styles = teleportStyle(doc.head);
  const renderer = createLenticularRenderer(doc);
  const listeners = [
    tavern_events.CHAT_CHANGED,
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    tavern_events.MESSAGE_UPDATED,
    tavern_events.MESSAGE_DELETED,
  ].map(event => eventOn(event, renderer.schedule));
  const cleanup = () => {
    renderer.dispose();
    styles.destroy();
    listeners.forEach(listener => listener.stop());
    if (owner[singleton] === cleanup) delete owner[singleton];
  };
  owner[singleton] = cleanup;
  $(window).one('pagehide', cleanup);
  console.info('[镜待流年] 光栅卡已启用：静态目录，按类别和名称匹配正文资料卡');
});
