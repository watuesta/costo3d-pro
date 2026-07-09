/* -----------------------  GLOBAL STATE  ----------------------- */
let partsCount = 0;
window.currentItemsInfo = [];
let wasteCost = 0; // para exportar al markdown

/* -----------------------  HELPERS  -------------------------- */
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function formatCurrency(val) { return '$ ' + Number(val).toLocaleString('es-CO', { maximumFractionDigits: 0 }); }

function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* -----------------------  PDF STYLES  ------------------------ */
const pdfStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
  #pdf-container { font-family: 'Inter', sans-serif; color: #1e293b; background: white; width: 850px; padding: 50px; box-sizing: border-box; }
  .pdf-header { border-bottom: 3px solid rgba(0,255,65,0.3); display:flex; justify-content:space-between; align-items:center; padding:15px 0; }
  .pdf-logo { font-size:24px; font-weight:900; line-height:1.2; }
  .meta-grid { display:flex; justify-content:center; gap:35%; margin-top:15px; background:#f8fafc; padding:10px 40px; border-radius:0; font-size:12px; color:#475569; border:1px solid rgba(0,255,65,0.15); }
  .section-box { margin-bottom:30px; border:1px solid rgba(0,255,65,0.12); border-radius:0; background:white; box-shadow:0 2px 4px rgba(0,0,0,0.03); }
  table.items-table { width:100%; font-size:12px; text-align:left; border-collapse: collapse; }
  th.table-header { padding:8px 12px; background:rgba(0,255,65,0.04); color:#16a34a; border-bottom:2px solid rgba(0,255,65,0.2); font-weight:600; letter-spacing:0.3em; text-transform:uppercase; font-size:10px; }
  td.table-cell { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#334155; }
  .chart-box { padding-top:25px; }
  .charts-row-container { display:flex; justify-content:center; gap:30px; height:240px; padding-top:20px; border-radius:0; background:#f8fafc; border:1px solid rgba(0,255,65,0.08); position:relative; }
  .chart-bar-wrapper { display:flex; flex-direction:column; justify-content:flex-end; height:100%; align-items:center; }
  .bar-container { width:32px; border-radius:0; }
  .bar-name { font-size:9px; color:#16a34a; text-transform:uppercase; letter-spacing:0.2em; margin-top:4px; }
  .gradient-dark { background: linear-gradient(#052e16, #14532d); }
  .gradient-mid { background: linear-gradient(#14532d, #166534); }
  .gradient-green { background: linear-gradient(#15803d, #22c55e); }
  .gradient-light { background: linear-gradient(#22c55e, #4ade80); }
  .gradient-bright { background: linear-gradient(#4ade80, #86efac); }
  .total-card { margin-top:30px; background:rgba(0,255,65,0.04); border:1px solid rgba(0,255,65,0.2); color:#16a34a; text-align:center; padding:25px; border-radius:0; }
  .total-card .amount { font-size:36px; font-weight:900; }
`;
if (!document.getElementById('pdf-styles')) {
  var s = document.createElement('style');
  s.id = 'pdf-styles';
  s.textContent = pdfStyles;
  document.head.appendChild(s);
}

/* -----------------------  MODEL SYNC  ------------------------ */
function syncWatts() {
  const model = document.getElementById('printerModel').value;
  document.getElementById('wattsInput').value = model;
}

/* -----------------------  PARTS ROWS  ----------------------- */
let plateCounter = 0;

function addPartRow(weight="", time="") {
  partsCount++;
  plateCounter++;
  const container = document.getElementById('partsContainer');
  const row=document.createElement('div');
  row.className='part-row grid grid-cols-4 gap-2 items-center bg-white/5 p-2 rounded-none border border-white/5';
  row.id=`part-${partsCount}`;
  const num=plateCounter<10?`0${plateCounter}`:`${plateCounter}`;
  row.innerHTML=`
    <div class="col-span-1 text-xs font-bold text-[#00ff41] text-center py-1">${num}</div>
    <div class="col-span-1 flex items-center gap-1"><input type="number" value="${weight}" inputmode="numeric" class="part-weight w-full bg-transparent text-xs outline-none border-b border-white/10 text-center"><span class="text-[9px] opacity-50">g</span></div>
    <div class="col-span-1 flex items-center gap-1">
      <input type="number" value="${time}" step="0.01" inputmode="decimal" placeholder="h.m"
             class="part-time w-full bg-transparent text-xs outline-none border-b border-white/10 text-center"><span class="text-[9px] opacity-50">h/m</span>
    </div>
    <div class="col-span-1 flex justify-end"><button onclick="removePart(${partsCount})" class="text-[#00ff41] font-bold text-xl">&times;</button></div>`;
  container.appendChild(row);
  calculate(false);
  var tt = document.getElementById('totalTime');
  if (tt) document.getElementById('partsContainer').appendChild(tt);
}
function removePart(id){
  const row=document.getElementById(`part-${id}`);
  if (row && document.querySelectorAll('.part-row').length>1){ row.remove(); calculate(false); renumberPlates(); }
}
function renumberPlates() {
  const rows = document.querySelectorAll('.part-row');
  rows.forEach((row, idx) => {
    const num = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
    row.querySelector('.col-span-1:first-child').textContent = num;
  });
  plateCounter = rows.length;
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

  /* PROJECT NAME VALIDATION */
  if (!document.getElementById('projectName').value.trim()) {
    if (showAlert) alert('El nombre del proyecto es obligatorio');
    return;
  }

  /* PARTS */
  let totalWeight=0,totalMinutes=0;
  window.currentItemsInfo=[];
  document.querySelectorAll('.part-row').forEach(row=>{
    const num=row.querySelector('.col-span-1:first-child').textContent.trim();
    const name=`Placa ${num}`;
    const w=parseFloat(row.querySelector('.part-weight').value)||0;
    // parse tiempo h.m -> horas + minutos
    const tStr=(row.querySelector('.part-time').value || '').replace(',', '.');
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
    totalTimeEl.className='text-xs font-medium text-[#00ff41] mt-2';
    document.getElementById('partsContainer').appendChild(totalTimeEl);
  }
  totalTimeEl.innerText=`Total: ${totalHours}h ${remMins}m`;

}

/* -----------------------  PROGRESS BAR & BREAKDOWN  ---------- */
function updateVisuals(filament,energy,waste,labor,profit,total){
  const segs=[
    {el:document.getElementById('segFilament'), pct:filament/total*100, label:'F'},
    {el:document.getElementById('segEnergy'),   pct:energy   /total*100, label:'E'},
    {el:document.getElementById('segWaste'),    pct:waste    /total*100, label:'W'},
    {el:document.getElementById('segLabor'),    pct:labor    /total*100, label:'S'},
    {el:document.getElementById('segProfit'),   pct:profit   /total*100, label:'G'},
  ];
  segs.forEach(s=>{
    s.el.style.width=`${s.pct.toFixed(2)}%`;
    s.el.textContent=s.pct>=3?s.label+' '+s.pct.toFixed(0)+'%':'';
  });

  const listEl=document.getElementById('breakdownList');
  listEl.innerHTML='';
  const data=[
    {label:'Filamento + Wastage',val:filament,color:'#14532d'},
    {label:'Energía (kWh)',      val:energy, color:'#15803d'},
    {label:'Desperdicio (Waste)',val:waste,  color:'#22c55e'},
    {label:'Setup / Labor',       val:labor,  color:'#4ade80'},
    {label:'Margen Ganancia',     val:profit, color:'#86efac'}
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
    alert('Markdown copiado al portapapeles');
  } catch (_) {
    const txtArea = document.createElement('textarea');
    txtArea.value = md;
    document.body.appendChild(txtArea);
    txtArea.select();
    document.execCommand('copy');
    document.body.removeChild(txtArea);
    alert('Markdown copiado (fallback)');
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
  plateCounter = 0;
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

/* -----------------------  PDF EXPORT  --------------------------- */
async function generatePdf() {
  if (typeof window.getProjectData !== 'function') return alert('No se pueden cargar datos');

  const data = window.getProjectData();
  if (!data || !Number(data.finalPrice)) {
    return alert('Primero calcula los costos antes de exportar el PDF.');
  }

  try {
    const getPct = (v) => ((v / data.chart.totalSum) * 100).toFixed(1);

    const bars = [
      { key: 'filament', label: 'Filamento', color: 'gradient-dark', val: data.chart.filament },
      { key: 'energy',   label: 'Energía',   color: 'gradient-mid', val: data.chart.energy },
      { key: 'waste',    label: 'Desperdicio', color: 'gradient-green', val: data.chart.waste },
      { key: 'labor',    label: 'Setup',     color: 'gradient-light', val: data.chart.labor },
      { key: 'profit',   label: 'Ganancia',   color: 'gradient-bright', val: data.chart.profit },
    ];
    const maxVal = Math.max(...bars.map(b => b.val), 1);

    let itemsRows = '';
    data.items.forEach((item, i) => {
      itemsRows += `<tr><td class="table-cell">${i + 1}</td><td class="table-cell">${item}</td></tr>`;
    });

    let chartBars = '';
    bars.forEach(b => {
      const pct = getPct(b.val);
      const h = Math.max((b.val / maxVal) * 160, 8);
      chartBars += `<div class="chart-bar-wrapper">
        <div style="display:flex;align-items:flex-end;gap:6px;">
          <div class="bar-container ${b.color}" style="height:${h}px;"></div>
          <span style="font-size:12px;font-weight:700;color:#1e293b;padding-bottom:4px;">${pct}%</span>
        </div>
        <div class="bar-name">${b.label}</div>
      </div>`;
    });

    const breakdownRows = bars.map(b =>
      `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;">
        <span style="color:#64748b">${b.label}</span>
        <span style="font-weight:600;color:#1e293b">${formatCurrency(b.val)}</span>
      </div>`
    ).join('');

    const html = `<div id="pdf-container">
      <div class="pdf-header">
        <div class="pdf-logo"><span style="color:#1e293b">Costo</span> <span style="color:#16a34a">3D</span> <span style="color:#1e293b">Pro</span></div>
        <div style="font-size:11px;color:#64748b;text-align:right">
          <div>${data.projectName}</div>
          <div>${new Date().toLocaleDateString('es-CO')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <span>🖨️ ${data.printer}</span>
        <span>⏱️ ${Math.floor(data.totalMinutes / 60)}h ${data.totalMinutes % 60}m</span>
      </div>

      <div class="section-box" style="padding:20px">
        <h3 style="font-size:12px;font-weight:600;color:#1e293b;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.2em">Piezas</h3>
        <table class="items-table">
          <thead><tr><th class="table-header">#</th><th class="table-header">Detalle</th></tr></thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>

      <div class="section-box chart-box" style="padding:20px">
        <h3 style="font-size:12px;font-weight:600;color:#1e293b;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.2em">Distribución de Costos</h3>
        <div class="charts-row-container">${chartBars}</div>
        <div style="margin-top:20px;border-top:1px solid #e2e8f0;padding-top:12px">${breakdownRows}</div>
      </div>

      <div class="total-card">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.2em">Precio de Venta Sugerido</div>
        <div class="amount">${formatCurrency(data.finalPrice)}</div>
      </div>

      <div style="text-align:center;font-size:9px;color:#94a3b8;margin-top:20px">
        Generado por Costo 3D Pro
      </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:850px;background:white;z-index:9999';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 850,
      windowWidth: 850,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = 210;
    const pdfH = (canvas.height / canvas.width) * pdfW;
    let offset = 0;
    const maxH = 297;

    if (pdfH <= maxH) {
      doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    } else {
      while (offset < pdfH) {
        if (offset > 0) doc.addPage();
        const sliceH = Math.min(pdfH - offset, maxH);
        const srcY = (offset / pdfH) * canvas.height;
        const srcH = (sliceH / pdfH) * canvas.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = srcH;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceH);
        offset += maxH;
      }
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;
    const projectSlug = (data.projectName || 'cotizacion').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${projectSlug}_${dateStr}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Revisa la consola para más detalles.');
  }
}

/* ----------------------- DATA BRIDGE FOR EXPORT -------------------- */
window.getProjectData = function() {
  // Función para obtener los valores actuales sin depender de variables globales
  const priceSpool   = Number(document.getElementById('priceSpool').value)||0;
  const watts        = Number(document.getElementById('wattsInput').value)||0;
  const kwhPrice     = Number(document.getElementById('kwhPrice').value)||0;
  const laborFixed   = Number(document.getElementById('laborRange').value)||0;
  const marginPercent= Number(document.getElementById('marginRange').value)||0;
  const wastePercent = Number(document.getElementById('wasteRange').value)||0;

  let totalWeight=0,totalMinutes=0;
  window.currentItemsInfo=[];
  
  // Recolectar datos de cada fila de pieza
  document.querySelectorAll('.part-row').forEach(row => {
    const num = row.querySelector('.col-span-1:first-child').textContent.trim();
    const name = `Placa ${num}`;
    const w = parseFloat(row.querySelector('.part-weight').value) || 0;
    const tStr = (row.querySelector('.part-time').value || '').replace(',', '.');
    let hrs=0, mins=0;
    if(tStr.includes('.')){
      const parts = tStr.split('.');
      hrs = parseInt(parts[0]) || 0;
      mins = parseInt((parts[1] || '').slice(0,2)) || 0;
    } else {
      hrs = parseInt(tStr) || 0;
    }
    totalWeight += w; 
    totalMinutes += (hrs * 60) + mins;
    window.currentItemsInfo.push(`${name} (${w}g, ${hrs}h ${mins}m)`);
  });

  const costFilamentBase = (totalWeight / 1000) * priceSpool;
  const costWaste = costFilamentBase * (wastePercent / 100);
  const totalFilamentCost = costFilamentBase + costWaste;
  const costEnergy = (watts / 1000) * (totalMinutes / 60) * kwhPrice;
  const productionCostTotal = totalFilamentCost + costEnergy + laborFixed;
  const profitAmount = productionCostTotal * (marginPercent / 100);
  const finalPrice = productionCostTotal + profitAmount;

  return {
    projectName: document.getElementById('projectName').value || 'Sin nombre',
    printer: document.getElementById('printerModel') ? document.getElementById('printerModel').options[document.getElementById('printerModel').selectedIndex].text : '',
    totalMinutes,
    productionCostTotal,
    profitAmount,
    finalPrice,
    marginPercent,
    items: window.currentItemsInfo, // Ya procesadas para el PDF
    chart: {
      filament: totalFilamentCost,
      energy: costEnergy,
      waste: costWaste,
      labor: laborFixed,
      profit: profitAmount,
      totalSum: productionCostTotal
    }
  };
};