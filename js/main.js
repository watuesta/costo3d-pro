/* -----------------------  GLOBAL STATE  ----------------------- */
let partsCount = 0;
window.currentItemsInfo = [];
let wasteCost = 0; // para exportar al markdown

/* -----------------------  HELPERS  -------------------------- */
function formatCurrency(val) { return '$ ' + Number(val).toLocaleString('es-CO', { maximumFractionDigits: 0 }); }

function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* -----------------------  MODEL SYNC  ------------------------ */
function syncWatts() {
  const model = document.getElementById('printerModel').value;
  document.getElementById('wattsInput').value = model;
}

/* -----------------------  PARTS ROWS  ----------------------- */
function addPartRow(name="", weight="", time="") {
  partsCount++;
  const container = document.getElementById('partsContainer');
  let nameOptions='';
  for (let i=1;i<=10;i++){
    const num=i<10?`0${i}`:`${i}`;
    nameOptions+=`<option value="Placa ${num}">${num} - Placa</option>`;
  }
  const row=document.createElement('div');
  row.className='part-row grid grid-cols-4 gap-2 sm:gap-1 items-center bg-white/5 p-4 sm:p-2.5 rounded-lg sm:rounded-xl border border-white/5';
  row.id=`part-${partsCount}`;
  // Solo un campo de tiempo (h.m)
  row.innerHTML=`
    <div class="col-span-1 min-w-0">
      <select class="part-name w-full bg-transparent text-base sm:text-xs outline-none font-medium px-2 sm:px-1 uppercase text-blue-400 cursor-pointer">${nameOptions}</select>
    </div>
    <div class="col-span-1 flex items-center gap-2 sm:gap-1 min-w-0"><input type="number" value="${weight}" class="part-weight w-full bg-transparent text-base sm:text-xs outline-none border-b border-white/10 text-center" min="0"><span class="text-sm sm:text-[9px] opacity-50 flex-shrink-0 font-medium">g</span></div>
    <div class="col-span-1 flex items-center gap-2 sm:gap-1 min-w-0">
      <input type="number" value="${time}" step="0.01" placeholder="h.m" min="0"
             class="part-time w-full bg-transparent text-base sm:text-xs outline-none border-b border-white/10 text-center"><span class="text-sm sm:text-[9px] opacity-50 flex-shrink-0 font-medium">h/m</span>
    </div>
    <div class="col-span-1 flex justify-end flex-shrink-0"><button onclick="removePart(${partsCount})" class="text-rose-500 font-bold text-3xl sm:text-xl leading-none">&times;</button></div>`;
  container.appendChild(row);
}
function removePart(id){
  const row=document.getElementById(`part-${id}`);
  if (row && document.querySelectorAll('.part-row').length>1){ row.remove(); calculate(false); }
}

/* -----------------------  SLIDER LABELS  -------------------- */
function updateSliderLabel(id,val,isCurrency=false){
  const display=isCurrency?`$ ${Number(val).toLocaleString('es-CO')}`:`${val}%`;
  document.getElementById(id).innerText=display;
  calculate(false);
}

/* -----------------------  CALCULATE  ------------------------ */
function calculate(showAlert=true){
  /* INPUTS */
  const priceSpool   = Number(document.getElementById('priceSpool').value)||0;
  const watts        = Number(document.getElementById('wattsInput').value)||0;
  const kwhPrice     = Number(document.getElementById('kwhPrice').value)||0;
  const laborFixed   = Number(document.getElementById('laborRange').value)||0;
  const marginPercent= Number(document.getElementById('marginRange').value)||0;
  const wastePercent = Number(document.getElementById('wasteRange').value)||0;

  /* PARTS */
  let totalWeight=0,totalMinutes=0;
  window.currentItemsInfo=[];
  document.querySelectorAll('.part-row').forEach(row=>{
    const name=row.querySelector('.part-name').value;
    const w=parseFloat(row.querySelector('.part-weight').value)||0;
    // parse tiempo h.m -> horas + minutos
    const tStr=row.querySelector('.part-time').value || '';
    let hrs=0, mins=0;
    if(tStr.includes('.')){
      const parts=tStr.split('.');
      hrs=parseInt(parts[0])||0;
      const frac=(parts[1]||'');
      // primeras dos cifras del fraccional = minutos
      mins=parseInt(frac.slice(0,2))||0;
    }else{
      hrs=parseInt(tStr)||0;
    }
    totalWeight+=w; totalMinutes+=(hrs*60)+mins;
    window.currentItemsInfo.push(`${name} (${w}g, ${hrs}h ${mins}m)`);
  });

  /* COSTS */
  const costFilamentBase=(totalWeight/1000)*priceSpool;
  const costWaste=costFilamentBase*(wastePercent/100);
  wasteCost = costWaste;   // guardado para markdown
  const totalFilamentCost=costFilamentBase+costWaste;
  const costEnergy=(watts / 1000) * (totalMinutes / 60) * kwhPrice;
  const productionCostTotal=totalFilamentCost+costEnergy+laborFixed;
  const profitAmount=productionCostTotal*(marginPercent/100);
  const finalPrice=productionCostTotal+profitAmount;

  /* UI */
  document.getElementById('realCostTotal').innerText=formatCurrency(productionCostTotal);
  document.getElementById('finalPrice').innerText=formatCurrency(finalPrice);
  updateVisuals(totalFilamentCost,costEnergy,costWaste,laborFixed,profitAmount,totalFilamentCost+costEnergy+laborFixed);

  /* TOTAL DE TIEMPO EN PIEZAS ------------------------------------ */
  const totalHours = Math.floor(totalMinutes/60);
  const remMins   = totalMinutes%60;
  let totalTimeEl=document.getElementById('totalTime');
  if(!totalTimeEl){
    totalTimeEl=document.createElement('div');
    totalTimeEl.id='totalTime';
    totalTimeEl.className='text-xs font-medium text-slate-400 mt-2';
    document.getElementById('partsContainer').appendChild(totalTimeEl);
  }
  totalTimeEl.innerText=`Total: ${totalHours}h ${remMins}m`;
  
  // Mostrar alerta solo si es una llamada del usuario
  if(showAlert) {
    alert('✅ Cálculo completado exitosamente');
  }
}

/* -----------------------  PROGRESS BAR & BREAKDOWN  ---------- */
function updateVisuals(filament,energy,waste,labor,profit,total){
  const segF=document.getElementById('segFilament');
  const segE=document.getElementById('segEnergy');
  const segW=document.getElementById('segWaste');   // NUEVO
  const segL=document.getElementById('segLabor');
  const segP=document.getElementById('segProfit');

  segF.style.width=`${(filament/total*100).toFixed(2)}%`;
  segE.style.width=`${(energy   /total*100).toFixed(2)}%`;
  segW.style.width=`${(waste    /total*100).toFixed(2)}%`; // NUEVO
  segL.style.width=`${(labor    /total*100).toFixed(2)}%`;
  segP.style.width=`${(profit   /total*100).toFixed(2)}%`;

  const listEl=document.getElementById('breakdownList');
  listEl.innerHTML='';
  const data=[
    {label:'Filamento + Wastage',val:filament,color:'#3b82f6'},
    {label:'Energía (kWh)',      val:energy, color:'#f59e0b'},
    {label:'Desperdicio (Waste)',val:waste,  color:'#ec4899'}, // NUEVO
    {label:'Setup / Labor',       val:labor,  color:'#a855f7'},
    {label:'Margen Ganancia',     val:profit, color:'#22c55e'}
  ];
  data.forEach(item=>{
    const row=document.createElement('div');
    row.className='flex justify-between items-center';
    row.innerHTML=`<div class="flex items-center"><span class="w-2 h-4 rounded-full mr-3" style="background-color:${item.color}"></span><span class="text-slate-400">${item.label}</span></div><span class="font-mono font-bold text-white">${formatCurrency(item.val)}</span>`;
    listEl.appendChild(row);
  });
}

/* ------------------------------------------------------------------
   Copiar markdown – versión definitiva
-------------------------------------------------------------------*/
async function copyMarkdown() {
  const finalPrice = document.getElementById('finalPrice').innerText.trim();
  const printer =
    document.getElementById('printerModel')
      .options[document.getElementById('printerModel').selectedIndex].text;
  const projectName = document.getElementById('projectName').value || 'Sin nombre';
  const today = getFormattedDate();

  let md = `🛠️ COTIZACIÓN Costo 3D Pro\nFecha: ${today}\n`;
  md += `-------------------------------------------------------\nImpresora: ${printer}\n`;
  md += `-------------------------------------------------------\n🚧 PROYECTO\n${projectName}\n`;
  md += `-------------------------------------------------------\n📦 DETALLE DE PIEZAS:\n`;
  window.currentItemsInfo.forEach(item => {
    md += `- ${item}\n`;
  });

  md += `-------------------------------------------------------\n📊 RESUMEN ECONÓMICO\n`;
  md += `-------------------------------------------------------\n`;
  document.querySelectorAll('#breakdownList > div').forEach(row => {
    const label = row.firstChild.textContent.trim();
    const val   = row.lastChild.textContent.trim();
    if (label && val) md += `- ${label}: ${val}\n`;
  });

  md += `- Desperdicio: ${formatCurrency(wasteCost)}\n`;
  md += `-------------------------------------------------------\nTOTAL SUGERIDO: ${finalPrice}\n`;
  md += `-------------------------------------------------------`;

  /* Copiar al portapapeles */
  try {
    await navigator.clipboard.writeText(md);
    alert('✅ Markdown copiado al portapapeles');
  } catch (_) {
    const txtArea = document.createElement('textarea');
    txtArea.value = md;
    document.body.appendChild(txtArea);
    txtArea.select();
    document.execCommand('copy');
    document.body.removeChild(txtArea);
    alert('✅ Markdown copiado (fallback) ✔️');
  }
}

/* ------------------------------------------------------------------
   Confirmación para Nueva Cotización
-------------------------------------------------------------------*/
function confirmClearAll() {
  if (confirm('¿Estás seguro de que deseas crear una nueva cotización? Se borrará toda la información actual.')) {
    clearAll();
  }
}
// Clear all data and copy current markdown to clipboard
function clearAll() {
  // Generate markdown of current state before clearing
  const finalPrice = document.getElementById('finalPrice').innerText.trim();
  const printer =
    document.getElementById('printerModel')
      .options[document.getElementById('printerModel').selectedIndex].text;
  const projectName = document.getElementById('projectName').value || 'Sin nombre';
  const today = getFormattedDate();

  let md = `🛠️ COTIZACIÓN PROFESIONAL 3D\nFecha: ${today}\n`;
  md += `-------------------------------------------------------\nImpresora: ${printer}\n`;
  md += `-------------------------------------------------------\n🚧 PROYECTO\n${projectName}\n`;
  md += `-------------------------------------------------------\n📦 DETALLE DE PIEZAS:\n`;
  window.currentItemsInfo.forEach(item => {
    md += `- ${item}\n`;
  });

  md += `-------------------------------------------------------\n📊 RESUMEN ECONÓMICO\n`;
  md += `-------------------------------------------------------\n`;
  document.querySelectorAll('#breakdownList > div').forEach(row => {
    const label = row.firstChild.textContent.trim();
    const val   = row.lastChild.textContent.trim();
    if (label && val) md += `- ${label}: ${val}\n`;
  });

  md += `- Desperdicio: ${formatCurrency(wasteCost)}\n`;
  md += `-------------------------------------------------------\nTOTAL SUGERIDO: ${finalPrice}\n`;
  md += `-------------------------------------------------------`;

  // Copy to clipboard
  navigator.clipboard.writeText(md).catch(() => {
    const txtArea = document.createElement('textarea');
    txtArea.value = md;
    document.body.appendChild(txtArea);
    txtArea.select();
    document.execCommand('copy');
    document.body.removeChild(txtArea);
  });

  // Reset all fields and state
  document.getElementById('partsContainer').innerHTML = '';
  partsCount = 0;
  window.currentItemsInfo = [];
  wasteCost = 0;
  
  // Reset inputs to defaults
  document.getElementById('printerModel').value = '95';
  syncWatts();
  document.getElementById('wattsInput').value = '95';
  document.getElementById('kwhPrice').value = '864';
  document.getElementById('priceSpool').value = '85000';
  document.getElementById('projectName').value = '';
  document.getElementById('laborRange').value = '12000';
  document.getElementById('valLabor').innerText = '$ 12.000';
  document.getElementById('marginRange').value = '30';
  document.getElementById('valMargin').innerText = '30%';
  document.getElementById('wasteRange').value = '10';
  document.getElementById('valWaste').innerText = '10%';
  
  // Limpiar COMPLETAMENTE todo a 0
  document.getElementById('realCostTotal').innerText = formatCurrency(0);
  document.getElementById('finalPrice').innerText = formatCurrency(0);
  
  // Limpiar barra de progreso
  document.getElementById('segFilament').style.width = '0%';
  document.getElementById('segEnergy').style.width = '0%';
  document.getElementById('segWaste').style.width = '0%';
  document.getElementById('segLabor').style.width = '0%';
  document.getElementById('segProfit').style.width = '0%';
  
  // Limpiar breakdown completamente
  document.getElementById('breakdownList').innerHTML = '';
  
  // Limpiar total de tiempo
  const totalTimeEl = document.getElementById('totalTime');
  if (totalTimeEl) totalTimeEl.remove();
  
  // Agregar una fila vacía después de limpiar
  addPartRow();
}

/* -----------------------  INICIALIZACIÓN  -------------------- */
window.addEventListener('load',()=>{
  // Agregar una fila por defecto al cargar
  addPartRow();
});
