import { finishLoading } from '../loaded';
import { createApp, h, ref } from 'vue';
import $ from 'jquery';
import Opening from '../状态栏/Opening.vue';
import { openingPrompt, parseOpeningDraft } from '../../src/opening-story';
import type { OpeningDraft, OpeningTask } from '../../src/opening-story';
import type { OpeningChoice } from '../../src/opening';
import { openingScenario } from '../../src/opening';
import worlds from '../../generated/opening-worlds.json';
import { sendOpeningRequest } from '../../src/opening-request';
import { inspectEnvironment } from './environment';
import type { CoverEnvironment } from './environment';
import '../状态栏/page.css';

$(async () => {
  let cancel: (() => void) | undefined;
  try {
    const messageId = getCurrentMessageId();
    const chatId = SillyTavern.getCurrentChatId();
    const selection = () => {
      const message = getChatMessages(messageId, { include_swipes: true })[0];
      return JSON.stringify([message?.swipe_id, message?.swipes?.[message.swipe_id]]);
    };
    const sourceSelection = selection();
    const read = () => Mvu.getMvuData({ type: 'message', message_id: messageId });
    const story = () =>
      getLastMessageId() > messageId
        ? getChatMessages(messageId + 1).find(message => message.message_id === messageId + 1)
        : undefined;
    const completed = ref(
      story()?.role === 'user' && story()?.extra?.embers_opening?.sourceSelection === sourceSelection,
    );
    const busy = ref(false);
    const ready = ref(false);
    const environment = ref<CoverEnvironment>({ checks: [], elapsed: false, error: '' });
    let bound = false;
    let started = Date.now();
    const bind = () => {
      if (typeof waitGlobalInitialized === 'function') {
        void waitGlobalInitialized('Mvu')
          .then(() => {
            bound = true;
          })
          .catch(reason => {
            environment.value.error = String(reason);
          });
      }
    };
    const detect = () => {
      try {
        const checks = inspectEnvironment(bound);
        environment.value = { checks, elapsed: Date.now() - started > 20000, error: '' };
        ready.value = checks.every(item => item.ready);
      } catch (reason) {
        ready.value = false;
        environment.value.error = `环境读取失败：${reason instanceof Error ? reason.message : String(reason)}`;
      }
    };
    const retry = () => {
      started = Date.now();
      detect();
    };
    bind();
    detect();
    const error = ref('');
    let generationId: string | null = null;
    const check = () => {
      if (SillyTavern.getCurrentChatId() !== chatId || selection() !== sourceSelection)
        throw Error('聊天或封面已切换，请回到原聊天重新操作');
      if (messageId !== 0 || getLastMessageId() !== 0) throw Error('已有剧情时不能重新准备开局，请新建聊天');
    };
    cancel = () => {
      const id = generationId;
      generationId = null;
      if (id) stopGenerationById(id);
    };
    const requestDraft = async (task: OpeningTask, choice: OpeningChoice): Promise<string | OpeningDraft> => {
      check();
      if (!ready.value) throw Error('请先按环境检测提示启用所需组件');
      const scenario = openingScenario(choice);
      const context =
        scenario.位面ID === 'opening-world' ? scenario.世界设定 : worlds[scenario.位面ID as keyof typeof worlds];
      const id = `embers-draft-${crypto.randomUUID()}`;
      generationId = id;
      try {
        const result = await generateRaw({
          generation_id: id,
          should_stream: false,
          should_silence: true,
          max_chat_history: 0,
          overrides: {
            world_info_before: '',
            world_info_after: '',
            persona_description: '',
            chat_history: { with_depth_entries: false, prompts: [], author_note: '' },
          },
          ordered_prompts: [
            { role: 'system', content: openingPrompt(task, choice, context) },
            { role: 'user', content: `请根据以上已确认资料准备${task}。` },
          ],
        });
        check();
        if (generationId !== id) throw Error('本次生成已取消');
        if (typeof result !== 'string' || !result.trim()) throw Error('AI没有返回文本，请检查连接后重试');
        if (task === '开场白') return parseOpeningDraft(result);
        if (result.length > 12000 || /<\/?[a-zA-Z]|\{\{|```/.test(result))
          throw Error('大纲应为纯文字且不超过12000字，请重试');
        return result.trim();
      } finally {
        if (generationId === id) generationId = null;
      }
    };
    const generate = async () => {
      if (busy.value) return;
      busy.value = true;
      error.value = '';
      try {
        detect();
        if (!ready.value) throw Error('环境尚未就绪，请查看封面的环境检测');
        if (SillyTavern.getCurrentChatId() !== chatId || selection() !== sourceSelection)
          throw Error('聊天或封面已切换，请回到原聊天');
        const request = story();
        if (request?.role !== 'user' || request.extra?.embers_opening?.sourceSelection !== sourceSelection)
          throw Error('请先发送开局要求');
        if (getLastMessageId() !== request.message_id) throw Error('开局之后已有新消息，请在酒馆中继续或重新生成');
        await triggerSlash('/trigger');
      } catch (reason) {
        error.value = `开局要求会保留。${reason instanceof Error ? reason.message : String(reason)}`;
      } finally {
        busy.value = false;
      }
    };
    const start = async (choice: OpeningChoice, request: string) => {
      if (busy.value) return;
      busy.value = true;
      error.value = '';
      let sent = false;
      try {
        detect();
        if (!ready.value) throw Error('环境尚未就绪，请查看上方环境检测');
        if (!navigator.locks) throw Error('请使用localhost或HTTPS的新版浏览器开始旅途');
        await sendOpeningRequest(
          {
            exclusive: async (key, action) => await navigator.locks.request(key, action),
            context: () => ({ chatId: SillyTavern.getCurrentChatId(), latestMessageId: getLastMessageId() }),
            selection,
            read,
            write: data => Mvu.replaceMvuData(data, { type: 'message', message_id: messageId }),
            request: story,
            append: (message, data, extra) => createChatMessages([{ role: 'user', message, data, extra }]),
          },
          { chatId, messageId, selection: sourceSelection },
          choice,
          request,
          `opening-${crypto.randomUUID()}`,
        );
        completed.value = true;
        sent = true;
      } catch (reason) {
        error.value = reason instanceof Error ? reason.message : String(reason);
      } finally {
        busy.value = false;
      }
      if (sent) await generate();
    };
    const app = createApp({
      render: () =>
        h(Opening, {
          busy: busy.value,
          error: error.value,
          completed: completed.value,
          onStart: start,
          onGenerate: generate,
          onRetry: retry,
          environment: environment.value,
          ready: ready.value,
          requestDraft,
          cancelGeneration: cancel,
          readPersonaName: () => substitudeMacros(['{{', 'user', '}}'].join('')),
        }),
    });
    app.mount('#app');
    finishLoading();
    const refresh = window.setInterval(() => {
      detect();
      try {
        if (SillyTavern.getCurrentChatId() !== chatId) {
          cancel?.();
          window.location.reload();
          return;
        }
        completed.value =
          story()?.role === 'user' && story()?.extra?.embers_opening?.sourceSelection === sourceSelection;
      } catch (reason) {
        error.value = String(reason);
      }
    }, 1000);
    $(window).on('pagehide', () => {
      cancel?.();
      clearInterval(refresh);
      app.unmount();
    });
  } catch (error) {
    $('#app').text(`封面读取失败：${error instanceof Error ? error.message : String(error)}`);
    finishLoading();
  }
});
