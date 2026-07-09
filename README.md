# Costo 3D Pro

**Multi-Item Production Engine** — Calculadora profesional de costos para impresión 3D en COP.

## Características

- Cálculo multi-piezas con numeración automática
- Variables: hardware, electricidad, filamento, desperdicio, setup y margen
- Desglose visual con barra de progreso (verdes degradados)
- Exportación PDF profesional con gráfico de costos
- Exportación Markdown al portapapeles
- Tema Matrix / cyberpunk (negro, verde neón, rejilla)
- Responsive (mobile-first, `text-xs md:text-[10px]`)

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Características Principales](#características-principales)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Guía de Usuario](#guía-de-usuario)
- [Licencia](#licencia)

## Requisitos

Navegador moderno (Chrome, Firefox, Safari, Edge). Sin dependencias que instalar.

## Instalación

Abrir `index.html` directamente o servir localmente:

```sh
python3 -m http.server 8000
# luego http://localhost:8000
```

## Uso

1. Seleccionar impresora (Watts se auto-sincronizan)
2. Ingresar **nombre del proyecto** (obligatorio)
3. Agregar piezas (gramos, tiempo en formato `h.m` ej: `1.30` = 1h 30m)
4. Ajustar setup, margen y desperdicio (sliders)
5. "Calcular Todo" — muestra precio final y desglose
6. "Exportar PDF" o "Copiar Markdown" para exportar

## Cálculo de Costos

- **Filamento**: (peso / 1000) × precio/kg
- **Desperdicio**: filamento × % desperdicio
- **Energía**: (Watts / 1000) × (minutos / 60) × precio kWh
- **Setup**: costo fijo por trabajo
- **Ganancia**: (total costos) × margen %
- **Precio final**: total costos + ganancia

### Desglose Visual
Barra de progreso segmentada con 5 tonos de verde (oscuro → claro):
- `green-900` Filamento — `green-700` Energía — `green-500` Desperdicio — `green-400` Setup — `green-300` Ganancia

### Exportación PDF
- html2canvas + jsPDF, formato A4
- Fondo blanco, acentos verdes `#16a34a`, barras gradient green
- Nombre: `{proyecto}_{ddMMyyyy}.pdf`

### Exportación Markdown
Copia al portapapeles con fecha, impresora, proyecto, piezas, resumen y total.

## Estructura

```
costo3d-pro/
├── index.html          # Entry point (CDN: Tailwind, jsPDF, html2canvas, Google Fonts)
├── css/styles.css      # Matrix theme (neon green, grid bg, card styles)
├── js/main.js          # Toda la lógica (~547 líneas, scope global)
├── favicon.svg         # Icono verde neón
└── README.md
```

## Tecnologías

- HTML5 / CSS3 / Vanilla JS (global scope, sin módulos ni bundler)
- Tailwind CSS (CDN)
- jsPDF + html2canvas (CDN)
- Google Fonts (Inter)

## Consejos

- COP (formato `es-CO`, ej: `$ 1.234.567`)
- Tiempo: `h.m` (`1.30` = 1h 30m)
- Placas se numeran y reordenan automáticamente
- Sliders recalculan al instante
- Las piezas se agregan con el botón al final del listado (flujo con teclado)
- Nombre del proyecto obligatorio para calcular

## Impresoras Preconfiguradas

| Modelo | Watts |
|--------|-------|
| Bambulab A1 | 95W |
| Bambulab P2S | 180W |

Los watts se pueden editar manualmente para otras impresoras.

## Personalización

Editar `value` en inputs de `index.html` para cambiar defaults. Agregar `<option>` al `<select>` para nuevas impresoras.

## Licencia

Uso libre para uso personal y comercial.
