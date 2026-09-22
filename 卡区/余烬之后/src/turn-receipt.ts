/** 只标识当前楼层当前消息页的文本，避免同楼重复解析简写动作。 */
export function turnReceipt(messageId:number,swipeId:number,content:string) {
 let hash=2166136261;
 for(const char of content)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return messageId+':'+swipeId+':'+(hash>>>0);
}
