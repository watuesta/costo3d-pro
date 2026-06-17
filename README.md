# Costo 3D Pro 🛠️

**Multi-Item Production Engine** - Calculadora profesional de costos para impresión 3D

Una herramienta web moderna y potente para calcular de forma precisa los costos de producción de piezas impresas en 3D, considerando múltiples variables como consumo de energía, desperdicio de filamento, costos de setup y márgenes de ganancia.

## 🚀 Características

✅ **Cálculo Multi-Piezas** - Agrega múltiples piezas en una sola cotización  
✅ **Variables Completas** - Hardware, electricidad, filamento, desperdicio, laborales y márgenes  
✅ **Desglose Visual** - Barra de progreso interactiva mostrando distribución de costos  
✅ **Generador de Markdown** - Exporta cotizaciones formateadas al portapapeles  
✅ **Soporte Múltiples Impresoras** - Configurable para diferentes modelos y potencias  
✅ **Interfaz Moderna** - Diseño dark mode profesional con Tailwind CSS  
✅ **Responsive** - Funciona perfectamente en desktop, tablet y móvil  
✅ **Sin Dependencias Externas** - Vanilla JavaScript puro, cero librerías

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Características Principales](#características-principales)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Guía de Usuario](#guía-de-usuario)
- [Licencia](#licencia)

## 🔧 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere instalación de dependencias
- No requiere servidor backend

## 📦 Instalación

### Opción 1: Archivo Local
1. Descarga todos los archivos del proyecto
2. Abre `index.html` en tu navegador web
3. ¡Listo! La aplicación está funcionando

### Opción 2: Servidor Web (Recomendado)

#### 🐍 Con Python (Opción Recomendada)

**Paso 1: Crear entorno virtual**
```bash
# En la carpeta del proyecto
python3 -m venv venv

# Activar entorno (macOS/Linux)
source venv/bin/activate

# Activar entorno (Windows)
venv\Scripts\activate
```

**Paso 2: Ejecutar servidor**
```bash
# Desde la carpeta del proyecto con entorno activado
python -m http.server 8000
```

**Paso 3: Acceder**
Abre en tu navegador: `http://localhost:8000`

**Detener servidor:** Presiona `Ctrl + C` en la terminal

---

## 💻 Uso Básico

### Paso 1: Configurar Hardware
1. Selecciona tu impresora 3D del dropdown
2. Ajusta potencia (Watts) si es necesario
3. Establece el precio de energía (COP/kWh)

### Paso 2: Ingresar Datos del Proyecto
1. Especifica el nombre del proyecto
2. Define el precio del filamento por kilogramo
3. Ajusta el porcentaje de desperdicio (% de filamento usado que se pierde)

### Paso 3: Agregar Piezas
1. Haz clic en "+ Añadir" para cada pieza
2. Completa:
   - **Placa**: Número identificador
   - **Gramos**: Peso de filamento
   - **Tiempo**: Duración de impresión (formato h.m, ej: 2.45 = 2h 45min)

### Paso 4: Configurar Ganancia
Ajusta los sliders:
- **Setup (Fijo)**: Costo fijo por trabajo
- **Margen Ganancia**: Porcentaje de rentabilidad
- **Desperdicio (Wastage)**: Pérdida de material

### Paso 5: Calcular
1. Haz clic en "✓ Calcular Todo"
2. Verás confirmación del cálculo
3. Los resultados se mostrarán instantáneamente

### Exportar Cotización
- Haz clic en "📋 Copiar Markdown" para copiar la cotización formateada
- Pégala donde necesites (emails, documentos, etc.)

### Nueva Cotización
- Haz clic en "🔄 Nueva Cotización"
- Confirma la acción
- Todo se resetea a valores iniciales

## 🎯 Características Principales

### Cálculo Detallado de Costos
- **Filamento**: Costo base × peso ÷ 1000
- **Desperdicio**: Filamento × porcentaje de desperdicio
- **Energía**: (Watts ÷ 1000) × (Minutos ÷ 60) × Precio/kWh
- **Setup**: Costo fijo configurável
- **Ganancia**: (Total Costos) × Margen %
- **Precio Final**: Total Costos + Ganancia

### Desglose Visual
- Barra de progreso con código de colores:
  - 🔵 Filamento: Azul
  - 🟡 Energía: Amarillo quemado
  - 🟩 Ganancia: Verde
  - 🟪 Setup: Púrpura
  - 🟥 Desperdicio: Rosa

### Exportación de Markdown
Genera automáticamente reportes con:
- Fecha actual
- Modelo de impresora
- Nombre del proyecto
- Detalle de piezas
- Resumen económico completo
- Precio total sugerido

## 📁 Estructura del Proyecto

```
costo3d-pro/
├── index.html          # Estructura HTML principal
├── css/
│   └── styles.css      # Estilos personalizados
├── js/
│   └── main.js         # Lógica JavaScript
├── favicon.svg         # Icono de la aplicación
└── README.md           # Este archivo
```

## 🛠️ Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **JavaScript (Vanilla)** - Lógica y cálculos
- **Tailwind CSS** - Framework de utilidades
- **Google Fonts** - Tipografía Inter

## 📖 Guía de Usuario

### Atajos Útiles
| Acción | Resultado |
|--------|-----------|
| Cambiar impresora | Actualiza watios automáticamente |
| Mover sliders | Recalcula instantáneamente |
| Agregar/Eliminar piezas | Actualiza totales automáticamente |
| Copiar Markdown | Copia cotización formateada |
| Nueva Cotización | Resetea todo a valores iniciales |

### Consejos
- El sistema recalcula automáticamente con cada cambio
- Los valores se expresan en COP (Pesos Colombianos)
- El tiempo se ingresa en formato decimal: horas.minutos (2.30 = 2h 30min)
- Puedes agregar múltiples piezas para comparar consumos
- El setup es un costo fijo por trabajo, no por pieza

### Impresoras Preconfiguradas
- **Bambulab A1** (95W)
- **Bambulab P2S** (180W)

Puedes modificar los watts manualmente para otras impresoras.

## 🎨 Personalización

### Cambiar Valores por Defecto
Edita `js/main.js`:
```javascript
// Valores por defecto de inputs
<input type="number" id="wattsInput" value="95" ... >  // Watts
<input type="number" id="kwhPrice" value="864" ... >   // COP/kWh
<input type="number" id="priceSpool" value="85000" ... > // Precio filamento
<input type="range" id="laborRange" value="12000" ... > // Setup
<input type="range" id="marginRange" value="30" ... >   // Margen %
<input type="range" id="wasteRange" value="10" ... >    // Desperdicio %
```

### Agregar Nuevas Impresoras
En `index.html`, dentro del `<select id="printerModel">`:
```html
<option value="150">Mi Impresora (150W)</option>
```

## 🐛 Troubleshooting

**P: Los precios no se actualizan**
- R: Verifica que completaste todos los campos
- R: Haz clic en "Calcular Todo"

**P: El Markdown no se copia**
- R: Intenta hacer clic nuevamente en "Copiar Markdown"
- R: Verifica permisos del navegador para clipboard

**P: Los valores persisten al recargar**
- R: Es comportamiento normal - no hay persistencia en localStorage

## 📞 Soporte

Para reportar bugs o sugerir mejoras, por favor documenta:
- Navegador y versión
- Pasos para reproducir
- Resultado esperado vs actual

## 📄 Licencia

Este proyecto está disponible de forma libre para uso personal y comercial.

---

**Desarrollado con ❤️ para profesionales de impresión 3D**

v1.0.0 - 2026
