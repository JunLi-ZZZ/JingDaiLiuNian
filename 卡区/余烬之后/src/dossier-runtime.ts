import { applyCommand } from './engine';
import type { Session } from './engine';
import { dossierRegistrations, syncDossierLocations } from './character-dossier';

/** 手动建档与同楼回放走同一登记内核；已有实体的实时属性保持原账本结果。 */
export function registerDossierEntities(input:Session, prefix='manual-dossier'):Session {
  let session=input;
  const version=session.stat_data._结算.状态版本;
  for(const [index,operation] of dossierRegistrations(session.stat_data).entries()){
    session=applyCommand(session,{...operation,id:prefix+'-'+version+'-'+index,
      branchId:session.stat_data._结算.分支ID,expectedVersion:session.stat_data._结算.状态版本}).session;
  }
  syncDossierLocations(session.stat_data);
  return session;
}
