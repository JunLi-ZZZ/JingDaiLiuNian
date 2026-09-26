// 来源：光栅卡实验/八阶规范 0.1.0；正式组件独立副本，保留实验原文件。
// 展示排序独立于正式数值；原初本源为特殊序列。
export const gradeThemes = [
 {grade:'凡尘',id:'dust',order:1,category:'base',material:'雾银刻印',subtitle:'细刻 · 磨砂 · 素银',a:'#b7bbc2',b:'#f5f3ec',c:'#78828c',foil:.07,tilt:3,glow:.06,motif:'seal',description:'让少量银光掠过细刻线。朴素，也值得被认真收藏。'},
 {grade:'凝华',id:'jade',order:2,category:'base',material:'翠晶凝光',subtitle:'切面 · 晶格 · 翠膜',a:'#4eae67',b:'#d5f7c9',c:'#247653',foil:.13,tilt:4,glow:.11,motif:'crystal',description:'光在晶格间凝聚，边角浮现清透的翡翠切面。'},
 {grade:'罕世',id:'azure',order:3,category:'base',material:'深蓝衍射',subtitle:'双环 · 干涉 · 冷蓝',a:'#4595e5',b:'#d6efff',c:'#175fa2',foil:.20,tilt:5,glow:.16,motif:'orbit',description:'细密光栅与冷蓝双环交错，转动时显现层层干涉。'},
 {grade:'史铭',id:'violet',order:4,category:'base',material:'紫箔铭刻',subtitle:'叠印 · 凹版 · 紫银',a:'#a46ad8',b:'#f0dbff',c:'#753aa2',foil:.25,tilt:6,glow:.21,motif:'inscription',description:'紫银箔沉入铭刻，在规整与错位之间留下精密的印痕。'},
 {grade:'传遗',id:'gold',order:5,category:'base',material:'古金织纹',subtitle:'花丝 · 双框 · 古金',a:'#d2b02b',b:'#fff2b8',c:'#9e732b',foil:.29,tilt:7,glow:.27,motif:'filigree',description:'双重金框包裹纤细花丝，光像温暖的金液流经纹章。'},
 {grade:'神御',id:'crimson',order:6,category:'base',material:'绯金冠冕',subtitle:'冠环 · 放射 · 绯金',a:'#de5260',b:'#ffe0b6',c:'#a92340',foil:.33,tilt:8,glow:.34,motif:'crown',description:'深绯与金光向外放射，冠冕般的尖拱收束整个光场。'},
 {grade:'本源',id:'amber',order:7,category:'base',material:'琥珀源环',subtitle:'偏环 · 纵深 · 琥珀',a:'#ee903d',b:'#ffe3b1',c:'#b65326',foil:.38,tilt:9,glow:.41,motif:'aperture',description:'偏心源环层层展开，琥珀光在深处汇成一个沉静的中心。'},
 {grade:'原初本源',id:'primal',order:8,category:'special',material:'玄珠全谱',subtitle:'交会 · 全谱 · 玄珠',a:'#dc7ba9',b:'#fff0dd',c:'#79c9cf',foil:.43,tilt:10,glow:.49,motif:'confluence',description:'全谱光流在玄黑珠面交会，两道完整的环围出开放的中心。'},
];
export function resolveTheme(grade:string){return gradeThemes.find(t=>t.grade===grade)||{...gradeThemes[0],grade:grade||'未鉴定',id:'unknown',order:0,category:'unknown',material:'待识之印',foil:.04};}
