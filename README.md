# Formularios de Procesos - Planificación Estratégica (GORE Los Lagos)

Módulo integral de **Formularios Web en HTML5, CSS3 y JavaScript puro (Vanilla)** para contener, estandarizar y digitalizar las cuatro líneas de evaluación técnica de la División de Planificación y Desarrollo Regional (DIPLADER).

El diseño está 100% desacoplado del backend, permitiendo al equipo de desarrollo implementar la persistencia (Base de Datos), endpoints de API y despliegue sin depender de frameworks frontend pesados.

---

## Navegación entre Pasos

Cada formulario cuenta con una barra de pestañas superior que refleja el orden del flujo:

| Pestaña | Contenido |
|---|---|
| `[1] Registro de la Iniciativa` | Datos iniciales de la Ficha IDI y cuadro de financiamiento. |
| `[2] Evaluación y sus Resultados` | Dictamen, observaciones, estado, iteraciones y bloques de respuesta/reevaluación. |
| `[3] Ficha de Evaluación (PDF)` | Vista de la ficha oficial de la iteración en curso; al imprimir, solo esta sección se exporta. |
| `[4] Registro Documental Evaluación` | Constancia documental (N° registro, oficio, validador). |

Los controles del formulario (`no-print`) se ocultan al generar el PDF; únicamente la ficha oficial se muestra.

## Flujo General del Proceso

El proceso de evaluación es **iterativo** y se describe en cuatro pasos:

```text
1. Registro de la Iniciativa ──► 2. Evaluación y sus Resultados ──► 3. Ficha de Evaluación (PDF) ──► 4. Registro Documental
       (grabar datos)              (grabar datos)                       (exportar PDF)               (grabar datos)
             ▲                             │                                   │                          │
             │                             │                                   ▼                          │
             │                             │                     resultado RECOMENDADO (fin) ◄────────────┘
             └──── la unidad formuladora responde ◄── resultado con OBSERVACIONES
```

1. **Registro de la Iniciativa** *(grabar datos)*: se graban los datos tomados de la Ficha IDI del Banco Integrado de Proyectos (BIP / MDSF): código BIP/IDI, nombre oficial, unidad formuladora, unidad técnica, localización (provincia, comuna), sector, etapa postulada, más el proceso presupuestario y el cuadro de financiamiento. **Se registra una sola vez por iniciativa.**
2. **Evaluación y sus Resultados** *(grabar datos)*: el profesional evaluador registra el dictamen técnico, las observaciones por área, el estado resultante, el N° de iteración y el historial de iteraciones. Como salida de este paso se genera la **Ficha de Evaluación en PDF**, documento oficial de la DIPLADER.
3. **Ficha de Evaluación (PDF)**: se visualiza y exporta la ficha oficial de la iteración en curso; en impresión se ocultan los controles del formulario y se muestra únicamente esta sección.
4. **Registro Documental Evaluación** *(grabar datos)*: se deja constancia documental de la ficha emitida: N° de registro, fecha de registro, profesional que registra, referencia del oficio asociado en la instancia de Oficios y enlace validador Ley N° 19.799.

### Cierre del proceso

Al cerrar el **Registro Documental Evaluación** se determina el resultado del ciclo:

| Resultado | Consecuencia |
|---|---|
| **RECOMENDADO** | **Fin del proceso.** La iniciativa queda con recomendación técnica favorable. |
| **Resultado con OBSERVACIONES** | El postulante responde las observaciones y la iniciativa vuelve a evaluación, dando origen a una nueva iteración. |

> El detalle de las firmas electrónicas y de la emisión de oficios se realiza en otra instancia; la ficha oficial en PDF no incluye pie de firma.

## Ciclo de Iteraciones

Cada resultado que exige observaciones devuelve la iniciativa al postulante y abre una nueva iteración:

| Instancia | N° iteración | Descripción |
|---|---|---|
| **Primer Ingreso** | 1 | Primera evaluación técnica de la iniciativa. |
| **Responde Observaciones** | 2 | El postulante responde y adjunta los antecedentes que subsanan las observaciones emitidas. |
| **Reevaluación** | 3 | Verificación de lo subsanado y emisión de un nuevo resultado técnico. |

| Línea de evaluación | Primer Ingreso | Responde Observaciones | Reevaluación |
|---|---|---|---|
| Evaluación de Pertinencia | Disponible | Disponible | **No aplica** |
| Circular N° 33 | Disponible | Disponible | Disponible |
| Iniciativas < 5.000 UTM | Disponible | Disponible | Disponible |
| Evaluación de Programas | Disponible | Disponible | Disponible |

En cada formulario, el selector **"Instancia de Evaluación"** determina qué bloques se muestran y qué se imprime. El botón **"Continuar a la siguiente instancia"** calcula la instancia siguiente a partir del estado registrado: si el estado contiene observaciones habilita "Responde Observaciones" y, desde esa instancia, "Reevaluación" en las líneas que la admiten.

---

## Estructura Estandarizada de los Módulos

Los cuatro módulos comparten la misma arquitectura del flujo general:

1. **Paso 1: Registro de la Iniciativa**
   - **Proceso Presupuestario (Año)** aplicado transversalmente (ej. 2026, 2027).
   - Insumos de la **Ficha IDI** del Banco Integrado de Proyectos (BIP / MDSF): Código BIP/IDI, Nombre oficial, Unidad formuladora, unidad técnica, Localización (Provincia, Comuna), Sector, Etapa postulada.
   - Cuadro de Financiamiento Solicitado al FNDR con cálculo dinámico de totales.
2. **Paso 2: Evaluación y sus Resultados**
   - Selector de instancia e indicador del N° de iteración en curso.
   - Dictamen técnico, desglose de observaciones sectoriales específicas, estado de la evaluación (OBSERVADO / RECOMENDADO / SIN OBSERVACIONES / PERTINENTE), profesional evaluador y fecha.
   - Bloque **2.1 Respuesta del Postulante a Observaciones**, activo desde la instancia N° 2.
   - Bloque **2.2 Reevaluación**, activo sólo en la instancia N° 3 y en las líneas que la admiten.
   - Tabla **2.3 Historial de Iteraciones** con las iteraciones previas de la iniciativa.
   - **Salida del paso: Ficha de Evaluación (PDF)**, documento oficial de la DIPLADER, que se previsualiza en la cuarta pestaña del formulario.
3. **Paso 3: Registro Documental Evaluación**
   - N° de registro documental, fecha de registro y profesional que registra.
   - Referencia del oficio asociado en la instancia de Oficios de la DIPLADER.
   - Enlace validador Ley N° 19.799 y constancia del registro.
   - La ficha oficial en PDF **no incluye pie de firma**: las firmas y la emisión de oficios se realizan en otra instancia.

---

## Estructura de Archivos del Proyecto

```text
├── index.html                   # Portal, flujograma general y panel central de las 4 líneas
├── pertinencia.html             # 1. Evaluación de Pertinencia Regional (ORD a MDSF u Oficio con Observaciones)
├── circular-33.html             # 2. Circular N° 33 (Anexo 1 con C.A.E. y Evaluación DIPLADER de Vehículos/Maquinarias)
├── evaluacion-5000-utm.html     # 3. Evaluación Menores a 5.000 UTM (Presupuesto, EETT, Planos, Anexos, Terreno)
├── evaluacion-programas.html    # 4. Evaluación de Programas (Transferencias Subtítulo 24 y Subtítulo 33)
├── css/
│   ├── styles.css               # Estilos institucionales GORE Los Lagos (responsivo, grillas, tabs, flujograma)
│   └── print.css                # Estilos oficiales para impresión limpia y exportación a PDF institucional
├── js/
│   ├── app.js                   # Controlador cliente, auto-cálculos, visor JSON y motor de iteraciones
│   └── schemas.js               # Contrato formal de modelos y esquemas JSON para el equipo de Base de Datos
└── Referencia de los procesos/  # Expedientes y documentos de referencia oficial
    ├── Evaluacion Pertinencia/  # Casos reales ORD 1628, Oficio 1644 y Listado Proyectos 2026
    ├── Evaluacion Circular 33/  # Ficha Anexo 1, FICHA 22-6-26, FICHA 9-9-26 y C33 FRG
    ├── Evaluacion Menores a 5000 UTM/ # Rev-2 (Observado) y Rev-6 (Sin observaciones)
    └── Evaluacion Programas/    # Casos reales Ficha 40065461-0 y 40080639-0
```

---

## Guía de Uso de los Formularios

1. **Apertura Directa**
   - No requiere dependencias externas ni `npm install`. Basta con abrir `index.html` en cualquier navegador web.
2. **Selección de la instancia**
   - El bloque azul **"Instancia de Evaluación"** se ubica sobre las pestañas y aplica a todo el formulario. Determina el N° de iteración y los bloques de respuesta y reevaluación visibles.
3. **Navegación entre Pasos**
    - Cada formulario cuenta con las pestañas superiores:
      - `[1] Registro de la Iniciativa`
      - `[2] Evaluación y sus Resultados`
      - `[3] Ficha de Evaluación (PDF)`
      - `[4] Registro Documental Evaluación`
4. **Avance de iteración**
   - Al registrar un estado con observaciones, el botón **"Continuar a la siguiente instancia"** activa la instancia correspondiente y posiciona el formulario en el paso de evaluación.
   - El botón **"+ Agregar Iteración Anterior"** permite incorporar al historial las iteraciones ya concluidas.
5. **Botones de Caso Real ("Cargar Caso...")**
   - **Pertinencia**: *Caso Tehuaco* (Dalcahue, emisión ORD 1628 a MDSF) y *Caso Maillen* (Puerto Montt, Oficio 1644 con observaciones).
   - **Circular 33**: *Maquinaria Chiloé* (Anexo 1 con C.A.E.) y *Camión Aljibe Los Muermos* (Evaluación técnica).
   - **Menores a 5.000 UTM**: *Rev-2* (Puyehue con observaciones sectoriales) y *Rev-6* (Puyehue, reevaluación sin observaciones, con el historial de la Rev-2 ya cargado).
   - **Programas**: *Salud Osorno* (`40065461-0`) y *Cuidados Renales Puerto Montt* (`40080639-0`).
6. **Impresión / Exportación a PDF Oficial**
   - El botón **"Imprimir / Guardar PDF"** activa los estilos de `css/print.css`, ocultando la interfaz de captura y enviando a la impresora o convertidor PDF la **Ficha de Evaluación** con la identificación acotada, la evaluación de la iteración en curso y el historial de iteraciones.
7. **Generar Payload JSON para Base de Datos**
   - El botón **"Generar carga útil JSON"** serializa la información completa en formato JSON estructurado, agregando el bloque `proceso` con la instancia activa, el número de iteración y el historial. Listo para enviar a la API REST o base de datos.

---

## Contrato de Datos (extracto)

El payload generado por cada formulario incluye, además de los datos de la iniciativa y de la evaluación:

```json
{
  "proceso": {
    "modelo": "FichaEvaluacion5000UTM",
    "linea_evaluacion": "Iniciativas menores a 5.000 UTM",
    "instancia_evaluacion": "Reevaluación",
    "clave_instancia": "REEVALUACION",
    "numero_iteracion": 3,
    "admite_reevaluacion": true,
    "iteraciones_registradas": 1
  },
  "iteraciones": [
    { "numero": 1, "fecha": "2026-08-05", "instancia": "Primer Ingreso", "estado": "OBSERVADO", "detalle": "Rev-2..." }
  ],
  "registro_documental_evaluacion": {
    "numero_registro": "REG-DIP-2026-0142",
    "fecha_registro": "2026-08-28",
    "registrado_por": "Diego Alexis Castro Henríquez",
    "referencia_oficio": "ORD. GR. N° 1780 del 2026-08-28",
    "url_validador_docdigital": "https://doc.digital.gob.cl/validador/..."
  }
}
```

Los esquemas completos de los cuatro modelos y del seguimiento de cartera están en `js/schemas.js`, disponibles también como visor interactivo en `index.html`.