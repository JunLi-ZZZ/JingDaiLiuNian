import { createApp, h, shallowRef, ref } from 'vue';
import $ from 'jquery';
import App from './App.vue';
import Workshop from './Workshop.vue';
import Correction from './Correction.vue';
import Settlement from './Settlement.vue';
import { editSession } from '../../src/settlement';
import type { ArchiveEdit } from '../../src/settlement';
import { createPreviewSession } from './preview-state';
import { applyCommand } from '../../src/engine';
import type { Command } from '../../src/engine';
import type { Schema } from '../../src/schema';
import './page.css';
import { resolveBattleCard, battleToken } from '../../src/output-cards';

$(function () {
  const session = shallowRef(createPreviewSession());
  const notice = ref('');
  const eventId = ref('');
  function action(name: string) {
    try {
      if (name === 'reset') {
        session.value = createPreviewSession();
        notice.value = '已重新开始。';
        eventId.value = '';
        return;
      }
      const state = session.value.stat_data;
      const common = {
        id: `preview-${state._结算.状态版本 + 1}`,
        branchId: 'preview',
        expectedVersion: state._结算.状态版本,
      };
      let command: Command;
      switch (name) {
        case 'attack':
          command = {
            ...common,
            kind: 'strike',
            actorId: 'beast',
            targetId: 'player',
            abilityId: 'arc',
          };
          break;
        case 'strike':
          command = { ...common, kind: 'strike', actorId: 'player', targetId: 'beast', abilityId: 'strike' };
          break;
        // 五分钟指当前位面的游戏时间，由调用层换算为统一刻度。
        case 'wait': {
          const rate = state._时空.位面目录[state._时空.当前地点.位面ID].时钟.本地每起源秒;
          if (!rate || rate <= 0) throw Error('当地时间倍率未设置');
          command = { ...common, kind: 'advance', seconds: 300 / rate };
          break;
        }
        case 'revive':
          command = { ...common, kind: 'revive' };
          break;
        case 'release':
          command = {
            ...common,
            kind: 'release',
            actorId: 'player',
            targetId: 'beast',
            abilityId: 'adapt-player-electric',
          };
          break;
        default:
          throw Error('未知试演操作');
      }
      const result = applyCommand(session.value, command);
      session.value = result.session;
      notice.value = result.result;
      if (command.kind === 'strike') eventId.value = command.id;
    } catch (error) {
      notice.value = error instanceof Error ? error.message : String(error);
    }
  }
  function customize(profile: Partial<Schema['_开局']['档案']>) {
    try {
      session.value = createPreviewSession(profile);
      notice.value = '已使用自定义角色重新开始。';
      eventId.value = '';
    } catch (error) {
      notice.value = error instanceof Error ? error.message : String(error);
    }
  }
  const app = createApp({
    render: () =>
      h(App, {
        state: session.value.stat_data,
        preview: true,
        notice: notice.value,
        battleCard: eventId.value ? resolveBattleCard(session.value, battleToken(session.value, eventId.value)) : null,
        onCompose: (text: string) => { notice.value = '已填入行动：' + text; },
        onEdit: (edit: ArchiveEdit) => {
          try { session.value = editSession(session.value, edit); notice.value = '修改已保存到本页演示存档'; }
          catch (error) { notice.value = error instanceof Error ? error.message : String(error); }
        },
        onAction: action,
        onCustomize: customize,
      }, {
        workshop: ({seed}: {seed?:import('../../src/schema').LibraryEntry}) => h(Workshop,{key:seed?.id,seed,state:session.value.stat_data,preview:true,latest:true}),
        correction: () => h(Correction, {state:session.value.stat_data, latest:true, busy:false, onEdit:(edit:ArchiveEdit) => {
          try { session.value=editSession(session.value,edit); notice.value='补记已保存'; }
          catch(error){ notice.value=String(error); }
        }}),
        settlement: () => h(Settlement,{session:session.value, messageId:0, latest:true, busy:false,error:'',onCompose:(text:string)=>{notice.value=text;}}),
      }),
  });
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
