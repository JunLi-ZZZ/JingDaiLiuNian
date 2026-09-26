import { saveLocalArchive } from '../../src/local-archive';
import MissingArchives from './MissingArchives.vue';
import { turnReceipt } from '../../src/turn-receipt';
import { updateReceiptStatus } from '../../src/update-protocol';
import { repairReplayPatch } from '../../src/variable-repair';
import { finishLoading } from '../loaded';
import { readRuntime } from '../../src/runtime-store';
import { createApp, h, shallowRef, ref } from 'vue';
import $ from 'jquery';
import { waitUntil } from 'async-wait-until';
import { Schema } from '../../src/schema';
import App from './App.vue';
import PanelFrame from './PanelFrame.vue';
import { stateChanges } from '../../src/state-changes';
import './page.css';
import Settlement from './Settlement.vue';
import Correction from './Correction.vue';
import Regenerate from './Regenerate.vue';
import Workshop from './Workshop.vue';
import type { ArchiveEdit, Proposal } from '../../src/settlement';
import { editArchive, settleProposal } from '../../src/settlement';
import type { Session } from '../../src/engine';

// 只读状态栏不使用会反向写入变量的store；不会在展示历史快照时修改存档。
$(async () => {
  try {
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        waitGlobalInitialized('Mvu'),
        new Promise((_, reject) => {
          loadingTimer = setTimeout(
            () =>
              reject(
                Error('MVU 尚未加载，请检查酒馆助手内本卡两个脚本是否开启，以及公共依赖网络是否可达，再重新载入此楼层'),
              ),
            20000,
          );
        }),
      ]);
    } finally {
      clearTimeout(loadingTimer);
    }
    const messageId = getCurrentMessageId();
    const chatId = SillyTavern.getCurrentChatId();
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'), {
      timeout: 20000,
    });
    const readData = () => Mvu.getMvuData({ type: 'message', message_id: messageId });
    const session = shallowRef<Session | null>(null);
    const latest = ref(getLastMessageId() === messageId);
    const selection = () => {
      const message = getChatMessages(messageId, { include_swipes: true })[0];
      return JSON.stringify([message?.swipe_id, message?.swipes?.[message.swipe_id]]);
    };
    let renderedSelection = selection();
    const updateError = ref('');
    const updateStatus = ref('');
    const read = () => {
      const stored = readData();
      updateError.value = String(stored.stat_data?._更新错误 || stored.embers_update_error || '');
      const data = stored.stat_data;
      const message = getChatMessages(messageId, { include_swipes: true })[0];
      const content = message?.swipes?.[message.swipe_id] ?? '';
      updateStatus.value = updateReceiptStatus(content, data?._叙事回执 || '', turnReceipt(messageId, message?.swipe_id ?? 0, content), updateError.value);
      if (data?._卡标识 !== 'death-adaptation') throw Error('此楼层不是余烬之后存档');
      session.value =
        data._初始化完成 && readRuntime(stored)
          ? { stat_data: Schema.parse(data), death_adaptation_runtime: readRuntime(stored)! }
          : null;
      return Schema.parse(data);
    };
    const state = shallowRef(read());
    const previous = () => {
      if (messageId < 1) return null;
      const data = getVariables({ type: 'message', message_id: messageId - 1 })?.stat_data;
      return data?._卡标识 === 'death-adaptation' ? Schema.parse(data) : null;
    };
    const baseline = shallowRef(previous());
    const updateBlock = ref(
      /<UpdateVariable>[\s\S]*?<\/UpdateVariable>/.test(getChatMessages(messageId)[0]?.message ?? ''),
    );
    const busy = ref(false);
    const error = ref('');
    const confirm = async (id: string, proposal: Proposal) => {
      if (busy.value) return;
      busy.value = true;
      error.value = '';
      try {
        if (!navigator.locks) throw Error('请使用 localhost 或 HTTPS 的新版浏览器进行结算');
        const saved = await settleProposal(
          {
            exclusive: async (key, action) => await navigator.locks.request(key, action),
            context: () => ({ chatId: SillyTavern.getCurrentChatId(), latestMessageId: getLastMessageId() }),
            selection,
            read: readData,
            write: data => Mvu.replaceMvuData(data, { type: 'message', message_id: messageId }),
          },
          { chatId, messageId, selection: renderedSelection },
          id,
          proposal,
        );
        state.value = Schema.parse(saved.stat_data);
        session.value = { stat_data: state.value, death_adaptation_runtime: saved.death_adaptation_runtime };
      } catch (reason) {
        error.value = reason instanceof Error ? reason.message : String(reason);
      } finally {
        busy.value = false;
      }
    };
    const compose = (text: string) => {
      const input = $('#send_textarea', window.parent.document);
      const existing = String(input.val() || '');
      input.val(existing ? existing + '\n' + text : text).trigger('input').trigger('focus');
      toastr.info('已填入酒馆输入框，可补充后发送');
    };
    const edit = async (request: ArchiveEdit) => {
      if (busy.value) return;
      busy.value = true; error.value = '';
      try {
        if (!navigator.locks) throw Error('请使用 localhost 或 HTTPS 的新版浏览器');
        const pinnedSelection=renderedSelection;
        const saved = await editArchive({
          exclusive: async (key, action) => await navigator.locks.request(key, action),
          context: () => ({ chatId: SillyTavern.getCurrentChatId(), latestMessageId: getLastMessageId() }),
          selection: () => renderedSelection === selection() ? (request.kind === 'regenerate' ? pinnedSelection : renderedSelection) : selection(), read: readData,
          write: async data => {
            if (request.kind === 'regenerate') {
              const original=getChatMessages(messageId)[0];
              const block='<UpdateVariable>\n<JSONPatch>\n'+JSON.stringify(repairReplayPatch(request.base,request.patch),null,2)+'\n</JSONPatch>\n</UpdateVariable>';
              const message=/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/.test(original.message) ? original.message.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g,()=>block) : original.message+'\n'+block;
              const swipe=getChatMessages(messageId,{include_swipes:true})[0]?.swipe_id ?? 0;
              data.stat_data._叙事回执=turnReceipt(messageId,swipe,message);
              if(original.data?.embers_local_archive?.receipt===turnReceipt(messageId,swipe,original.message))
                data.embers_local_archive={...original.data.embers_local_archive,receipt:data.stat_data._叙事回执};
              // 同一次接口写入正文中的补丁与楼层变量，避免日后重解析再取到旧命令。
              await setChatMessages([{message_id:messageId,message,data:{...original.data,...data}}],{refresh:'none'});
              renderedSelection=selection();
            } else if (['supplement','remove','restore','classify','character','character-stats','roster'].includes(request.kind)) {
              const original=getChatMessages(messageId)[0];
              const swipe=getChatMessages(messageId,{include_swipes:true})[0]?.swipe_id ?? 0;
              const receipt=turnReceipt(messageId,swipe,original.message);
              const local=saveLocalArchive(state.value,Schema.parse(data.stat_data),original.data?.embers_local_archive,receipt);
              await setChatMessages([{message_id:messageId,data:{...original.data,...data,embers_local_archive:local}}],{refresh:'none'});
            } else await Mvu.replaceMvuData(data,{type:'message',message_id:messageId});
          },
        }, { chatId, messageId, selection: renderedSelection }, state.value, request);
        state.value = Schema.parse(saved.stat_data);
        session.value = { stat_data: state.value, death_adaptation_runtime: readRuntime(saved)! };
        updateError.value = state.value._更新错误;
        toastr.success(request.kind === 'focus' ? '查阅范围已更新' : '存档已更新');
        return true;
      } catch (reason) { error.value = reason instanceof Error ? reason.message : String(reason); toastr.error(error.value); return false; }
      finally { busy.value = false; }
    };
    const app = createApp({
      render: () =>
        state.value._初始化完成
          ? h(
              PanelFrame,
              {
                state: state.value,
                changes: stateChanges(baseline.value, state.value),
                hasPrevious: !!baseline.value,
                updateBlock: updateBlock.value,
              },
              {
                default: () => h(App, {
                  state: state.value, latest: latest.value, onEdit: edit, story:getChatMessages(messageId)[0]?.message || '',
                  changes: stateChanges(baseline.value, state.value),
                  updateBlock: updateBlock.value,
                  updateError: updateError.value,
                  updateStatus: updateStatus.value,
                  onCompose: (text: string) => {
                    const input = $('#send_textarea', window.parent.document);
                    const existing = String(input.val() || '');
                    input.val(existing ? `${existing}\n${text}` : text).trigger('input').trigger('focus');
                    toastr.info('已填入酒馆输入框，可补充目标与用法后发送');
                  },
                }, {
                  correction: () => [
                    h(MissingArchives,{state:state.value,latest:latest.value,busy:busy.value,story:getChatMessages(messageId)[0]?.message || '',onEdit:edit}),
                    h(Regenerate,{state:state.value,latest:latest.value,busy:busy.value,story:getChatMessages(messageId)[0]?.message || '',onEdit:edit}),
                    h(Correction, { state: state.value, latest: latest.value, busy: busy.value, onEdit: edit }),
                  ],
                  workshop: ({seed}: {seed?:import('../../src/schema').LibraryEntry}) => h(Workshop,{key:seed?.id,seed,state:state.value,latest:latest.value,chatId,messageId,selection:renderedSelection,persist:edit}),
                  settlement: () => session.value ? h(Settlement, {
                    session: session.value, messageId, latest: latest.value, busy: busy.value,
                    error: error.value, onConfirm: confirm, onCompose: compose,
                  }) : h('p', '此楼层尚无结算记录。'),
                }),
              },
            )
          : h('p', '本楼尚无角色存档，请从封面开始旅途。'),
    });
    app.mount('#app');
    finishLoading();
    // 定时刷新仅重读当前楼层快照，不调用任何时间推进或写入函数。
    const refresh = window.setInterval(() => {
      try {
        if (SillyTavern.getCurrentChatId() !== chatId) {
          window.location.reload();
          return;
        }
        state.value = read();
        baseline.value = previous();
        updateBlock.value = /<UpdateVariable>[\s\S]*?<\/UpdateVariable>/.test(
          getChatMessages(messageId)[0]?.message ?? '',
        );
        latest.value = getLastMessageId() === messageId && selection() === renderedSelection;
      } catch (error) {
        console.warn('[余烬之后] 无法读取楼层快照', error);
      }
    }, 1500);
    $(window).on('pagehide', () => {
      window.clearInterval(refresh);
      app.unmount();
    });
  } catch (error) {
    $('#app').text(`状态栏读取失败：${error instanceof Error ? error.message : String(error)}`);
    finishLoading();
  }
});
