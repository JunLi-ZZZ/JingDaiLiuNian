// 仅生成内部主题的静态SVG，角色文字由Vue插值编码。
const circle=(r:number,extra='')=>'<circle cx="150" cy="150" r="'+r+'" '+extra+'/>';
const ray=(a:number,r1:number,r2:number)=>'<path transform="rotate('+a+' 150 150)" d="M150 '+(150-r1)+'V'+(150-r2)+'"/>';
export function ornament(motif:string){
 let shape='';
 if(motif==='seal')shape=circle(68)+circle(60,'stroke-dasharray="2 10"')+'<path d="M150 110L175 150L150 190L125 150Z M144 150H156"/>';
 if(motif==='crystal')shape='<path d="M150 31L242 150L150 269L58 150Z M150 61L217 150L150 239L83 150Z M150 31V269 M58 150H242 M150 61L83 150L150 181L217 150Z"/>'+circle(106,'stroke-dasharray="1 16"');
 if(motif==='orbit')shape=circle(112)+circle(103,'stroke-dasharray="65 12 4 12"')+circle(68)+[0,60,120].map(a=>'<ellipse cx="150" cy="150" rx="96" ry="31" transform="rotate('+a+' 150 150)"/>').join('')+Array.from({length:36},(_,i)=>ray(i*10,119,i%3?122:128)).join('');
 if(motif==='inscription')shape=[0,22.5,45,67.5].map(a=>'<rect x="76" y="76" width="148" height="148" transform="rotate('+a+' 150 150)"/>').join('')+circle(110,'stroke-dasharray="3 7"')+'<path d="M150 110L190 150L150 190L110 150Z M135 150H165 M150 135V165"/>';
 if(motif==='filigree')shape=circle(118)+circle(110)+Array.from({length:12},(_,i)=>'<ellipse cx="150" cy="111" rx="25" ry="68" transform="rotate('+i*30+' 150 150)"/>').join('')+circle(39)+circle(31,'stroke-dasharray="1 5"');
 if(motif==='crown')shape=Array.from({length:24},(_,i)=>ray(i*15,i%2?89:74,i%2?117:139)).join('')+circle(86)+circle(67,'stroke-dasharray="12 7"')+'<path d="M85 165L76 108L120 138L150 85L180 138L224 108L215 165Z M99 179H201 M112 191H188"/>';
 if(motif==='aperture')shape=[0,30,60,90,120,150].map(a=>'<ellipse cx="150" cy="150" rx="119" ry="65" transform="rotate('+a+' 150 150)"/>').join('')+circle(47)+circle(35)+Array.from({length:48},(_,i)=>ray(i*7.5,127,i%4?129:138)).join('');
 if(motif==='confluence')shape='<ellipse cx="125" cy="150" rx="100" ry="63" transform="rotate(-48 150 150)"/><ellipse cx="175" cy="150" rx="100" ry="63" transform="rotate(-48 150 150)"/><ellipse cx="125" cy="150" rx="107" ry="70" transform="rotate(-48 150 150)"/><ellipse cx="175" cy="150" rx="107" ry="70" transform="rotate(-48 150 150)"/>'+circle(131,'stroke-dasharray="1 5"')+circle(140,'stroke-dasharray="24 90"')+'<path d="M150 125L175 150L150 175L125 150Z"/>';
 return '<svg viewBox="0 0 300 300" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true">'+shape+'</svg>';
}
