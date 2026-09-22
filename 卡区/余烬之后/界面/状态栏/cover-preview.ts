import { createApp, h, shallowRef, ref } from 'vue';
import $ from 'jquery';
import Opening from './Opening.vue';
import App from './App.vue';
import { createOpening, openingScenario } from '../../src/opening';
import type { OpeningChoice } from '../../src/opening';
import type { Session } from '../../src/engine';
import type { OpeningDraft, OpeningTask } from '../../src/opening-story';
import './page.css';

$(function () {
  const session = shallowRef<Session | null>(null);
  const error = ref('');
  const story = ref('');
  const start = (choice: OpeningChoice, request: string) => {
    try {
      session.value = createOpening(choice, 'opening-preview');

      story.value = '【本地演示：这是将发送给 AI 的用户消息，未实际生成剧情】\n\n' + request;
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : String(reason);
    }
  };
  const requestDraft = async (task: OpeningTask, choice: OpeningChoice): Promise<string | OpeningDraft> => {
    const scene = openingScenario(choice);
    if (task === '大纲')
      return `【本地演示大纲】\n地点：${scene.城市} · ${scene.场景}\n机缘：${scene.机缘}\n现场：一封来历不明的信等待认领，送信人只知道收信地点。\n线索：封蜡上的纹路与起源种核相似。\n留给玩家：是否接信、如何询问，以及接下来去哪里。`;
    return {
      正文: `【本地演示文本，未调用 AI】\n\n${scene.场景}的入口处，一名旅人正向看守打听消息。旁边的桌上放着一封没有署名的信，封蜡映出一点浅淡的光。\n\n“有人把这个留在这里，只说会有认识它的人来取。”看守将信封翻到背面，露出一组交叠的纹路，“如果你知道它的来历，可以告诉我。”\n\n微光在信封边缘散开，起源种核的联系仍然稳定。周围的声音没有停下，看守也没有催促，只把信放回了原处。`,
      场景描述: `${scene.场景}有一封待认领的信，看守正在询问来历。`,
      天气: '',
    };
  };
  const app = createApp({
    render: () =>
      h('div', [
        h(Opening, { preview: true, error: error.value, completed: !!session.value, onStart: start, requestDraft }),
        session.value
          ? h('section', { class: 'story-preview' }, [
              h('small', '开局要求 · 本地展示'),
              h('article', { class: 'opening-prose', style: 'white-space:pre-wrap;line-height:2' }, story.value),
              h(App, { state: session.value.stat_data }),
            ])
          : null,
      ]),
  });
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
