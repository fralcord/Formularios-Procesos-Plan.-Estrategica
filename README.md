# Formularios de Evaluación de Procesos – Planificación Estratégica (GORE Los Lagos · DIPLADER)

Documento técnico para **Informática** y sus herramientas de IA. Describe el propósito, la arquitectura, la lógica de negocio, el contrato de datos (payload JSON) y la guía para desplegar en un sitio propio.

- Sitio de pruebas (GitHub Pages): https://fralcord.github.io/Formularios-Procesos-Plan.-Estrategica/
- Repositorio: `fralcord/Formularios-Procesos-Plan.-Estrategica` (rama `main`)

---

## 1. Propósito y alcance

Suite de **4 formularios web** que digitalizan el ciclo de evaluación de iniciativas de inversión del Gobierno Regional de Los Lagos:

| Formulario | Archivo | Línea |
|---|---|---|
| Evaluación de Pertinencia | [pertinencia.html](pertinencia.html) | Pertinencia regional |
| Circular 33 | [circular-33.html](circular-33.html) | Iniciativas Circular 33 (subtítulos 22, 29, 31) |
| Menores a 5.000 UTM | [evaluacion-5000-utm.html](evaluacion-5000-utm.html) | Proyectos FNDR < 5.000 UTM |
| Evaluación de Programas | [evaluacion-programas.html](evaluacion-programas.html) | Programas (22, 24, 29, 33, etc.) |

Más el portal [index.html](index.html) (flujo general, tarjetas de acceso y visor interactivo de la especificación técnica/esquemas).

**Lo que hace el sistema**
1. El evaluador registra la iniciativa, evalúa, obtiene un resultado y emite una **ficha de evaluación imprimible/PDF**.
2. Genera un **payload JSON** estandarizado (botón de guardar → modal con *Copiar* / *Descargar .json*) pensado para API REST, base de datos, dashboard y procesamiento de datos.

**Lo que NO hace (importante)**
- **No persiste datos**: no hay backend, base de datos ni autenticación. Todo ocurre en el navegador; al recargar se pierde lo ingresado. La persistencia es la tarea de Informática (ver sección 11).
- Los datos de ejemplo cargables son **ficticios/demostrativos**.

---

## 2. Arquitectura

- HTML + CSS + JavaScript **vanilla**, sin framework, sin npm, sin build. Se abre `index.html` directamente o se sirve como archivos estáticos.
- Sin dependencias externas en tiempo de ejecución (sin CDN obligatorio).
- Codificación **UTF-8**; idioma de interfaz y de claves de datos: español.
- Cada formulario contiene su JS específico *inline* (al final del HTML) y reutiliza los módulos compartidos de `js/`.

### Estructura de archivos

```
index.html                    Portal, flujo general, visor de esquemas
pertinencia.html              Formulario Pertinencia
circular-33.html              Formulario Circular 33
evaluacion-5000-utm.html      Formulario Menores a 5.000 UTM
evaluacion-programas.html     Formulario Programas
css/styles.css                Estilos (variables CSS: --primary #003e6b, --secondary #0284c7 …)
css/print.css                 @media print / @page; .no-print se oculta al imprimir
js/app.js                     Lógica compartida (serialización, moneda, fechas, modal JSON, iteraciones, financiamiento)
js/schemas.js                 Contrato formal de datos: window.AppSchemas
js/localizacion.js            Provincias/comunas de Los Lagos (selectores enlazados)
js/erd-selector.js            Selector multi-nivel de articulación ERD y Programa de Gobierno
js/erd-regional-data.js       Catálogo ERD regional (window.datosRegionalesERD5000)
js/gobernador-data.js         Catálogo Programa Gobernador (window.datosProgramaGobernador)
assets/                       Logos institucionales (gore-los-lagos.png, core-los-lagos.png)
Referencia de los procesos/   Expedientes reales de referencia (PDF/xlsx/docx) – NO se publica
.github/workflows/deploy-pages.yml   Despliegue a GitHub Pages
```

### Módulos clave de [js/app.js](js/app.js)

| Función / módulo | Rol |
|---|---|
| `serializeForm(form)` | Convierte el formulario en objeto JSON (ver sección 6) |
| `parseValue`, `parseCurrencyValue` | Tipado: números, booleanos, códigos con cero inicial se mantienen string; moneda → entero en pesos |
| `formatPesosInput`, `initCurrencyInputs` | Inputs con `data-format-currency`: muestran `1.234.567`, el valor lógico es entero |
| `configurarFechasDesdePostulacion`, `validarFechasDesdePostulacion` | Regla: ninguna fecha puede ser anterior a la fecha del oficio de postulación |
| `showJsonModal`, `copyJsonToClipboard`, `downloadJsonFile` | Modal con el payload |
| `AppIteracion` | Motor de iteraciones del proceso (sección 5) |
| `serializarEvaluacion` | `serializeForm` + bloque `proceso` |
| `mostrarSoloFicha` | Vista de impresión de la ficha |
| `recalculateTable`, `addTableRow`, `removeTableRow` | Tablas dinámicas con totales |
| `sincronizarEvaluacionFinanciamiento`, `calcularCostoTotalPresentado/Recomendado`, `renderizarFilasFichaFinanciamiento` | Financiamiento presentado vs recomendado (sección 7) |

---

## 3. Flujo de usuario (todos los formularios)

Cada formulario tiene **4 pestañas/pasos**:

1. **Registro de la Iniciativa** – datos de identificación, localización, tipología, financiamiento, oficio de postulación, articulación estratégica.
2. **Evaluación y sus Resultados** – evaluación técnica, *cuadro de financiamiento de evaluación* (confirmar/modificar lo propuesto), resultado y observaciones.
3. **Ficha de Evaluación (PDF)** – vista imprimible con referencia a los datos de los pasos 1 y 2 (se imprime con el navegador → Guardar como PDF).
4. **Registro Documental** – antecedentes/documentos de respaldo (`registro_documental_evaluacion.*`).

Al final, el botón de guardar genera el payload.

### Instancias del ciclo

`PRIMER_INGRESO` → `RESPONDE_OBSERVACIONES` → `REEVALUACION` (esta última **no existe en Pertinencia**).

### Resultados posibles por línea

| Línea | Resultados |
|---|---|
| Pertinencia | PERTINENTE · OBSERVADO |
| Circular 33 | RECOMENDADO TÉCNICAMENTE · OBSERVADO |
| Menores a 5.000 UTM | RECOMENDADO TÉCNICAMENTE · OBSERVADO · DADO DE BAJA |
| Programas | RECOMENDADO · OBSERVADO |

Todo estado que coincida con `/OBSERV/i` **abre una nueva iteración**.

---

## 4. Reglas de negocio y validaciones

- Fechas: todas deben ser ≥ fecha del oficio de postulación (validación nativa `setCustomValidity` + `validarFechasDesdePostulacion` antes de generar el payload).
- Moneda: se ingresa en **pesos**; el payload lleva enteros. La ficha imprime en **M$** (pesos / 1.000).
- Localización: provincia → comuna dependientes (`localizacion.js`).
- Circular 33: el **desglose por clasificador** es obligatorio cuando `subtitulo = 29` y estado `RECOMENDADO TÉCNICAMENTE` (`validarDesgloseC33`).
- 5.000 UTM: financiamiento fijo FNDR / subtítulo 31 / ítem 02 PROYECTOS; las asignaciones (001–007 y 999) dependen de la etapa. Las filas vacías se filtran del payload.
- Circular 33: subtítulos 22, 29 y 31 con catálogo propio de ítems y asignaciones.
- Pertinencia: filtra filas de financiamiento vacías y calcula `costo_total`.

---

## 5. Motor de iteraciones (`AppIteracion`)

Configuración **declarativa** por atributos `data-*` en el contenedor `#selectorInstancia`:

`data-nombre-campo` (campo de instancia, `instancia_evaluacion`), `data-permite-reevaluacion`, `data-tabla-iteraciones`, `data-panel-evaluacion` (panel del paso 2), `data-campo-estado`, `data-campo-fecha`, `data-campo-detalle`, `data-paso-evaluacion`.

Lógica:
- `numeroActual` = máx(mínimo de la instancia, iteraciones archivadas con fecha + 1).
- `controlesEtapa`: inputs con `name` dentro del panel del paso 2 **que no estén dentro de una `table`**.
- `archivarEtapa`: agrega una fila al historial (`numero`, `fecha`, `instancia`, `estado`, `detalle` y un JSON oculto `registro` con `campos`).
- `limpiarEtapa`: limpia los campos del paso 2 para la nueva iteración.
- `avanzar`: valida → archiva → limpia → pasa a la siguiente instancia.

Payload resultante: bloque `proceso` (`modelo`, `linea_evaluacion`, `instancia_evaluacion`, `clave_instancia`, `numero_iteracion`, `admite_reevaluacion`, `iteraciones_registradas`) y la tabla `iteraciones` (historial).

> **Limitación conocida:** el cuadro de financiamiento de evaluación está dentro de una `table`, por lo que **no se archiva** en el snapshot de cada iteración; en el payload final queda solo el valor vigente (última iteración).

---

## 6. Serialización a payload (`serializeForm`)

- Campos con nombre con puntos → objetos anidados: `oficio_postulacion.fecha` → `{ "oficio_postulacion": { "fecha": ... } }`.
- `table[data-table-id="X"]` → arreglo `X` con un objeto por `tbody tr[data-table-row]`, usando `data-field` como clave.
- Inputs con `data-format-currency` → entero en pesos.
- Los valores se tipan con `parseValue` (número, booleano, string; los códigos con cero inicial se conservan como string).

---

## 7. Financiamiento: presentado vs recomendado

### Paso 1 – "Fuente de financiamiento" (lo presentado)
Tabla `fuentes_financiamiento` (tbody: `c33_fin_body`, `financiamiento_5000_body`, `prog_fin_body`). Por línea: `fuente`, `item`, `clasificador`, `solicitado_ano_actual`, `solicitado_ano_siguiente`, `costo_total`.

### Paso 2 – cuadro de financiamiento de evaluación (Circular 33, 5.000 UTM, Programas)
Replica el cuadro del paso 1 **como referencia y a la vez editable**: el evaluador confirma lo propuesto o lo modifica con el resultado de la evaluación.
- `data-table-id="fuentes_financiamiento_evaluacion"` (tbody: `c33_eval_fin_body`, `financiamiento_5000_eval_body`, `prog_eval_fin_body`).
- Por línea: `fuente`, `item`, `clasificador`, `presentado_ano_actual`, `presentado_ano_siguiente` (solo lectura), `recomendado_ano_actual`, `recomendado_ano_siguiente` (editables), `costo_total_presentado`, `costo_total_recomendado`.
- Las filas se vinculan a las del paso 1 mediante `dataset.evalKey`. Mientras el usuario no edite, **lo recomendado sigue a lo presentado**; al editar una celda se marca `dataset.editado` y deja de seguirlo.
- La función evita reconstruir el DOM si las filas no cambian (así no se pierde el foco al teclear).
- Pie de tabla y resumen: "Costo total presentado / recomendado".

### Totales en el payload
- `costo_total_presentado` = suma de lo presentado (años actual + siguiente).
- `costo_total_recomendado` = suma de lo recomendado.
- Estos dos reemplazan a `costo_total` en Circular 33, 5.000 UTM y Programas. **Pertinencia mantiene `costo_total`** (no tiene paso de financiamiento de evaluación).

### Ficha de evaluación
Muestra la tabla con encabezados "RECOMENDADO AÑO …" (valores recomendados, en M$). No muestra línea de costo total.

---

## 8. Circular 33 – desglose por clasificador

Aplica con subtítulo 29 y resultado RECOMENDADO TÉCNICAMENTE.
- Editor `contenteditable` (`c33_desglose_editor`) + textarea oculto `c33_desglose_valor` → campo `evaluacion_c33.desglose_clasificador`.
- Acepta: pegar tablas HTML (Excel/Word), texto tabulado o imágenes.
- Las celdas de las tablas pegadas son **editables** (texto y números). Pegar texto en una celda inserta texto plano; pegar una tabla fuera de celda agrega otra tabla.
- Se sanea con `sanitizarTablasC33` / `sanitizarDesgloseGuardadoC33`; el valor guardado es HTML **sin** `contenteditable`.
- **Seguridad:** el backend debe volver a sanear este HTML antes de almacenarlo o renderizarlo.

---

## 9. Contrato de datos

La definición formal vive en [js/schemas.js](js/schemas.js) (`window.AppSchemas`), con modelos `pertinencia`, `circular33`, `evaluacion5000Utm`, `evaluacionProgramas` y `seguimientoCartera`, y bloques compartidos (`BLOQUE_PROCESO_EVALUACION`, `HISTORIAL_ITERACIONES`, `BLOQUE_REGISTRO_DOCUMENTAL`, `BLOQUE_CIERRE_CICLO`). El visor de [index.html](index.html) los presenta interactivamente. **Fuente de verdad: `schemas.js` + las funciones `guardarFormulario*` de cada HTML.**

Claves principales por formulario:

| Formulario | Claves |
|---|---|
| Pertinencia | `evaluacion_pertinencia.*`, `resolucion.*`, `trazabilidad.*`, `tipologia`, `codigo_bip`, `localizacion.*`, `fuentes_financiamiento`, `costo_total` |
| Circular 33 | `subtitulo`, `codigo_bip`, `nombre_accion`, `provincia`, `comuna`, `evaluacion_c33.*`, `fuentes_financiamiento`, `fuentes_financiamiento_evaluacion`, `costo_total_presentado`, `costo_total_recomendado` |
| 5.000 UTM | `codigo_idi`, `evaluacion_tecnica.*` (observaciones por área, ERD, Gobernador), `control_evaluacion.*`, ambas tablas de financiamiento, ambos costos |
| Programas | `codigo_idi`, `nombre_programa`, `subtitulo`, `evaluacion.*`, ambas tablas, ambos costos |
| Todos | `proceso`, `iteraciones`, `registro_documental_evaluacion.*` |

### Ejemplo reducido (Circular 33)

```json
{
  "proceso": {
    "modelo": "EvaluacionCircular33",
    "instancia_evaluacion": "PRIMER_INGRESO",
    "numero_iteracion": 1,
    "admite_reevaluacion": true
  },
  "subtitulo": "29",
  "fuentes_financiamiento": [
    { "fuente": "FNDR", "item": "…", "clasificador": "…",
      "solicitado_ano_actual": 100000000, "solicitado_ano_siguiente": 50000000, "costo_total": 150000000 }
  ],
  "fuentes_financiamiento_evaluacion": [
    { "fuente": "FNDR", "presentado_ano_actual": 100000000, "recomendado_ano_actual": 90000000,
      "presentado_ano_siguiente": 50000000, "recomendado_ano_siguiente": 50000000,
      "costo_total_presentado": 150000000, "costo_total_recomendado": 140000000 }
  ],
  "costo_total_presentado": 150000000,
  "costo_total_recomendado": 140000000
}
```
(Para el ejemplo real y completo, pulse el botón de guardar en el formulario con cualquiera de los ejemplos cargados.)

### Sugerencia de modelo relacional
- `iniciativa` (código BIP/IDI, nombre, línea, localización, tipología).
- `evaluacion` (FK iniciativa, instancia, número de iteración, estado, fechas, `costo_total_presentado`, `costo_total_recomendado`, payload JSON completo).
- `financiamiento_linea` (FK evaluacion, tipo = `presentado`/`evaluacion`, fuente, ítem, clasificador, montos por año).
- `documento` (FK evaluacion, registro documental).
Guardar además el JSON crudo (columna JSON) para trazabilidad. Dashboard: agrupar por línea, estado, comuna/provincia y comparar `costo_total_presentado` vs `costo_total_recomendado`.

---

## 10. Catálogos y datos de apoyo

- **Localización:** [js/localizacion.js](js/localizacion.js) – provincias y comunas de Los Lagos.
- **ERD regional:** [js/erd-regional-data.js](js/erd-regional-data.js) y **Programa Gobernador:** [js/gobernador-data.js](js/gobernador-data.js), usados por [js/erd-selector.js](js/erd-selector.js) (secciones plegables de selección múltiple). Si cambia la estrategia, solo se actualizan estos archivos.
- **Ejemplos precargados:** `cargarEjemploCircular33`, `cargarEjemploEvaluacionC33`, `cargarEjemplo5000UtmConObs` / `SinObs`, `cargarEjemploProgramaSalud` / `Renal`, `cargarEjemploPertinenciaFavorable` / `Observada` (botones en cada formulario; útiles para pruebas).

---

## 11. Despliegue en el sitio de Informática

**Opción simple (recomendada para iniciar):** copiar estos elementos a cualquier servidor web estático (IIS, Nginx, Apache, SharePoint/portal intranet):

`index.html`, `pertinencia.html`, `circular-33.html`, `evaluacion-5000-utm.html`, `evaluacion-programas.html`, carpetas `css/`, `js/`, `assets/`.

No requiere build ni servidor de aplicaciones. Rutas relativas; funciona bajo cualquier subcarpeta. Servir con `Content-Type` UTF-8. **No** publicar `README.md` ni `Referencia de los procesos/` (documentos reales).

**Integración con backend (trabajo pendiente para Informática):**
1. Hoy el payload solo se muestra en un modal. Para enviarlo, reemplazar en cada `guardarFormulario*` la llamada `showJsonModal(...)` por un `fetch('/api/…', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })` (o añadir el envío manteniendo el modal).
2. Implementar el endpoint que valide contra [js/schemas.js](js/schemas.js), re-sanee `desglose_clasificador` y almacene.
3. Agregar autenticación (SSO/AD institucional) y control de roles: el front no la trae.
4. Persistencia/borradores: no existe; considerar guardar el payload por iniciativa e historial de iteraciones, y permitir recargarlo en el formulario (requiere una función de "cargar payload", no implementada).
5. Dashboard: consumir las tablas derivadas de sección 9.

Referencia del despliegue actual: [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) (en cada push a `main` copia los HTML, `css/`, `js/` y `assets/` a `_site`).

---

## 12. Impresión / PDF

- Paso 3 usa [css/print.css](css/print.css): `@page` define márgenes; elementos con clase `.no-print` (selectores, botones, pestañas) se ocultan; `mostrarSoloFicha` deja solo la ficha.
- La ficha referencia datos del paso 1 y del paso 2 (incluye la tabla de financiamiento recomendado en M$). Se genera con *Imprimir → Guardar como PDF*.

---

## 13. Limitaciones conocidas

- Sin persistencia, autenticación ni envío a servidor (ver sección 11).
- El cuadro de financiamiento de evaluación no se archiva por iteración (solo el valor vigente).
- `seguimientoCartera` existe en `schemas.js`, pero ningún formulario lo implementa.
- Pertinencia aún usa `costo_total` (no distingue presentado/recomendado).
- Los datos viven en el DOM: los pasos ocultos no son editables hasta activar su pestaña.
- El sitio de pruebas en GitHub Pages es público; no ingresar datos reales.

---

## 14. Pruebas y mantenimiento

- Abrir cualquier HTML en el navegador y usar los botones de ejemplo; revisar el payload en el modal.
- Pruebas automatizadas: no hay suite; se verificó con Playwright (tipeo de montos, sincronización presentado/recomendado, edición del desglose). Al automatizar, los paneles de pasos ocultos requieren activar la pestaña antes (`cambiarPasoC33('evaluacion')`, etc.) o usar `evaluate`.
- Al agregar un campo: (1) agregarlo con `name`/`data-field` en el HTML, (2) actualizar `js/schemas.js`, (3) actualizar este README.
- Entorno Windows + Google Drive: pueden aparecer archivos `desktop.ini` dentro de `.git\refs` que rompen `git pull`; eliminarlos.

## 15. Guía rápida para herramientas de IA

- Fuente de verdad del contrato: `js/schemas.js`; lógica compartida: `js/app.js`; lógica específica y funciones de guardado: bloque `<script>` al final de cada HTML.
- No hay build: editar y recargar. Mantener español, UTF-8 y nombres de claves existentes (consumidores aguas abajo dependen de ellos).
- Cambios en financiamiento deben aplicarse en forma coherente a los tres formularios (Circular 33, 5.000 UTM, Programas).
- Las claves `costo_total_presentado` y `costo_total_recomendado` son el insumo del dashboard; no renombrar.
