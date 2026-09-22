import { finishLoading } from '../loaded';
import { readRuntime } from '../../src/runtime-store';
import $ from 'jquery';
import { createApp, h, shallowRef, ref } from 'vue';
import { resolveBattleCard, resolveDossierCard, resolveSceneCard, battleToken } from '../../src/output-cards';
import type { DossierCard, PublicBattleCard, SceneCard } from '../../src/output-cards';
import { Schema } from '../../src/schema';
import BattleCard from './BattleCard.vue';
import Scene from './SceneCard.vue';
import Dossier from './DossierCard.vue';
import './page.css';

$(async () => {
  try {
    await waitGlobalInitialized('Mvu');
    const messageId=getCurrentMessageId(), chatId=SillyTavern.getCurrentChatId();
    const kind=$('body').attr('data-kind');
    const scene=shallowRef<SceneCard|null>(null);
    const dossier=shallowRef<DossierCard|null>(null), battle=shallowRef<PublicBattleCard|null>(null), waiting=ref('');
    const read=()=>{
      if(SillyTavern.getCurrentChatId()!==chatId)return;
      try {
        const data=Mvu.getMvuData({type:'message',message_id:messageId});
        const state=Schema.parse(data.stat_data);
        if(['check','death','travel','growth','quest','snapshot'].includes(kind||'')) {
          const next=resolveSceneCard({stat_data:state,death_adaptation_runtime:readRuntime(data)!},kind!,$('body').attr('data-id')||'');
          if(!_.isEqual(next,scene.value))scene.value=next;
        }else if(kind==='combat') {
          const session={stat_data:state,death_adaptation_runtime:readRuntime(data)!};
          battle.value=resolveBattleCard(session,battleToken(session,$('body').attr('data-id')||''));
        }else if(kind) {
          const next=resolveDossierCard(state,kind,$('body').attr('data-id')||'');
          if(!_.isEqual(next,dossier.value))dossier.value=next;
        }else {
          const token='<DACombat>'+JSON.stringify({分支ID:$('body').attr('data-branch'),事件ID:$('body').attr('data-event')})+'</DACombat>';
          const next=resolveBattleCard({stat_data:state,death_adaptation_runtime:readRuntime(data)!},token);
          if(!_.isEqual(next,battle.value))battle.value=next;
        }
        waiting.value='';
      }catch(reason) {
        dossier.value=null;battle.value=null;scene.value=null;
        waiting.value=reason instanceof Error?reason.message:String(reason);
      }
    };
    read();
    const app=createApp({render:()=>scene.value?h(Scene,{card:scene.value}):dossier.value?h(Dossier,{card:dossier.value}):battle.value?h(BattleCard,{card:battle.value}):h('details',{class:'card-pending'},[
      h('summary','档案待同步'),h('p','本楼资料就绪后会自动显示；若变量更新失败，可在状态栏修复。'),h('small',waiting.value),
    ])});
    app.mount('#app');finishLoading();
    // 变量重生或补记可能晚于正文卡载入；同楼更新后就地显示，无需重新生成正文。
    const timer=window.setInterval(read,1500);
    $(window).on('pagehide',()=>{window.clearInterval(timer);app.unmount();});
  }catch(reason){$('#app').addClass('card-pending').text('档案暂不可用：'+String(reason));finishLoading();}
});
