# Formularios de Procesos - Planificación Estratégica (GORE Los Lagos)

Módulo integral de **Formularios Web en HTML5, CSS3 y JavaScript puro (Vanilla)** para contener, estandarizar y digitalizar las cuatro líneas de evaluación técnica de la División de Planificación y Desarrollo Regional (DIPLADER).

El diseño está 100% desacoplado del backend, permitiendo al equipo de desarrollo implementar la persistencia (Base de Datos), endpoints de API y despliegue sin depender de frameworks frontend pesados.

---

## Navegación entre Pasos

Cada formulario cuenta con una barra de pestañas superior que refleja el orden del flujo:

| Pestaña | Contenido |
|---|---|
| `[1] Registro de la Iniciativa` | Identificación de la iniciativa, localización y antecedentes de postulación/oficio; los campos varían según el formulario. |
| `[2] Evaluación y sus Resultados` | Dictamen, observaciones, estado, iteraciones y bloques de respuesta/reevaluación. |
| `[3] Ficha de Evaluación (PDF)` | Vista de la ficha oficial de la iteración en curso; al imprimir, solo esta sección se exporta. |
| `[4] Registro Documental Evaluación` | Constancia documental (N° registro, oficio, validador). |

Los controles del formulario (`no-print`) se ocultan al generar el PDF; únicamente la ficha oficial se muestra.
La aplicación actual es una interfaz cliente: el botón de generación produce un payload JSON, pero no guarda registros de forma persistente en una base de datos ni cambia por sí mismo el estado de una iniciativa en un sistema central.

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

1. **Registro de la Iniciativa** *(grabar datos)*: se identifican la iniciativa y sus antecedentes de postulación. Según el formulario, incluye proceso presupuestario, código BIP/IDI, nombre, unidades formuladora y técnica, sector o subtítulo, localización, etapa, costo total y antecedentes del oficio de postulación. Estos datos se mantienen separados de la evaluación de cada iteración.
2. **Evaluación y sus Resultados** *(grabar datos)*: el profesional evaluador registra el dictamen técnico, las observaciones por área, el estado resultante, el N° de iteración y el historial de iteraciones. Como salida de este paso se genera la **Ficha de Evaluación en PDF**, documento oficial de la DIPLADER.
3. **Ficha de Evaluación (PDF)**: se visualiza y exporta la ficha oficial de la iteración en curso; en impresión se ocultan los controles del formulario y se muestra únicamente esta sección.
4. **Registro Documental Evaluación** *(grabar datos)*: se deja constancia documental de la ficha emitida: N° de registro, fecha de registro, profesional que registra, referencia del oficio asociado en la instancia de Oficios y enlace validador Ley N° 19.799.

### Avance y cierre del proceso

El estado registrado en **Evaluación y sus Resultados** determina si corresponde habilitar otra instancia. El botón **"Continuar a la siguiente instancia"** lleva a **Responde Observaciones** cuando el resultado contiene observaciones; desde esa instancia abre **Reevaluación** en las líneas que la admiten. Si el resultado no exige observaciones, el ciclo termina con la emisión de la ficha oficial.

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
| Iniciativas Menores a 5.000 UTM | Disponible | Disponible | Disponible |
| Evaluación de Programas | Disponible | Disponible | Disponible |

En cada formulario, el selector **"Instancia de Evaluación"** determina qué bloques se muestran y qué se imprime. El botón **"Continuar a la siguiente instancia"** calcula la instancia siguiente a partir del estado registrado: si el estado contiene observaciones habilita "Responde Observaciones" y, desde esa instancia, "Reevaluación" en las líneas que la admiten.

---

## Estructura de los Formularios

Los cuatro formularios comparten la navegación y el ciclo de evaluación, pero los campos del registro se adaptan a cada línea. El orden de captura vigente es:

| Formulario | Orden y campos del Registro de la Iniciativa |
|---|---|
| **Evaluación de Pertinencia** | Proceso presupuestario (año), etapa a la que postula, código BIP/IDI y nombre de la iniciativa, unidad formuladora y unidad técnica, sector/tipología y costo total, provincia/comuna/localidad o sector, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación. |
| **Circular N° 33** | Proceso presupuestario (año) y subtítulo, código BIP/IDI y nombre de iniciativa/acción, unidad formuladora y unidad técnica, sector y costo total, provincia/comuna/localidad o sector, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación. |
| **Iniciativas Menores a 5.000 UTM** | Proceso presupuestario (año) y etapa a la que postula (opciones: Diseño y Ejecución), código IDI/BIP y nombre de la iniciativa, unidad formuladora y unidad técnica, sector y costo total, provincia/comuna/localidad o sector, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación. |
| **Evaluación de Programas** | Proceso presupuestario (año) y sector, código IDI/BIP y nombre del programa, unidad formuladora y unidad técnica, provincia/comuna/localidad o sector, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación; costo total se conserva al final del registro. |

Los campos de oficio y sus fechas de ingreso se capturan como antecedentes de la iniciativa. La etapa postulada solo está incluida en Pertinencia y en el formulario **Menores a 5.000 UTM**; en este último el selector ofrece únicamente **Diseño** y **Ejecución**. El subtítulo corresponde a Circular N° 33. No se debe asumir que los cuatro formularios tienen un cuadro común de financiamiento FNDR.

La grilla mantiene juntos los campos que forman pares o grupos —por ejemplo, código y nombre, unidades, localización y fechas— en pantallas amplias; en pantallas pequeñas los campos se apilan para facilitar su captura.

La arquitectura restante del flujo es:

1. **Paso 1: Registro de la Iniciativa**, con la estructura propia indicada arriba.
2. **Paso 2: Evaluación y sus Resultados**
   - Selector de instancia e indicador del N° de iteración en curso.
   - Dictamen técnico, desglose de observaciones sectoriales específicas, estado de la evaluación (OBSERVADO / RECOMENDADO / SIN OBSERVACIONES / PERTINENTE), profesional evaluador y fecha.
   - Bloque **2.1 Respuesta del Postulante a Observaciones**, activo desde la instancia N° 2.
   - Bloque **2.2 Reevaluación**, activo sólo en la instancia N° 3 y en las líneas que la admiten.
   - Tabla **2.3 Historial de Iteraciones** con las iteraciones previas de la iniciativa.
   - **Salida del paso: Ficha de Evaluación (PDF)**, documento oficial de la DIPLADER, que se previsualiza en la tercera pestaña del formulario.
3. **Paso 3: Ficha de Evaluación (PDF)**
   - Vista e impresión de la ficha oficial correspondiente a la iteración en curso.
4. **Paso 4: Registro Documental Evaluación**
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

## Retroalimentación de colegas

El repositorio del proyecto es privado. Una vez que el administrador invite a un colega como colaborador y este acepte, podrá abrir la pestaña **Issues** del repositorio, seleccionar **Retroalimentación sobre formularios** y describir el formulario, sección, observación y mejora propuesta. La plantilla permite distinguir problemas de campos, presentación, comportamiento y textos.

El repositorio privado permite compartir el código y recibir comentarios, pero no publica una vista web interactiva. Para probar los formularios, el colega debe descargar o clonar el repositorio autorizado y abrir `index.html` en un navegador; luego puede registrar la retroalimentación en Issues.

La retroalimentación debe usar ejemplos ficticios. No adjuntar ni incluir datos personales, información reservada o antecedentes de casos reales en los comentarios. El acceso al repositorio también permite consultar los archivos y materiales de referencia que contiene.

---

## Contrato de Datos (extracto)

El payload generado por cada formulario incluye, además de los datos de la iniciativa y de la evaluación:

```json
{
  "proceso": {
    "modelo": "FichaEvaluacion5000UTM",
    "linea_evaluacion": "Iniciativas Menores a 5.000 UTM",
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