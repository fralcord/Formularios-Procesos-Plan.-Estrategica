# Formularios de Procesos - Planificación Estratégica (GORE Los Lagos)

Módulo integral de **Formularios Web en HTML5, CSS3 y JavaScript puro (Vanilla)** para contener, estandarizar y digitalizar las cuatro líneas de evaluación técnica de la División de Planificación y Desarrollo Regional (DIPLADER).

El diseño está 100% desacoplado del backend, permitiendo al equipo de desarrollo implementar la persistencia (Base de Datos), endpoints de API y despliegue sin depender de frameworks frontend pesados.

---

## Navegación entre Pasos

Cada formulario cuenta con una barra de pestañas superior que refleja el orden del flujo:

| Pestaña | Contenido |
|---|---|
| `[1] Registro de la Iniciativa` | Identificación de la iniciativa, localización y antecedentes de postulación/oficio; los campos varían según el formulario. |
| `[2] Evaluación y sus Resultados` | Detalle del dictamen y estado; el tipo de instancia se registra como atributo de la evaluación. |
| `[3] Ficha de Evaluación (PDF)` | Vista de la ficha oficial de la evaluación; no incluye etiquetas de instancia ni bloques de respuesta/reevaluación. |
| `[4] Registro Documental Evaluación` | Constancia documental (N° registro, oficio, validador). |

Los controles del formulario (`no-print`) se ocultan al generar el PDF; únicamente la ficha oficial se muestra.
La aplicación actual es una interfaz cliente: el botón de generación produce un payload JSON, pero no guarda registros de forma persistente en una base de datos ni cambia por sí mismo el estado de una iniciativa en un sistema central.

## Publicación en línea

El sitio se publica desde este repositorio con **GitHub Pages** al enviar cambios a `main`, o manualmente mediante **Deploy forms to GitHub Pages** en Actions. El flujo publica sólo la portada, los cuatro formularios, estilos, scripts y recursos necesarios; no publica el README ni la carpeta `Referencia de los procesos`. La actualización tarda lo que dure el flujo, no es instantánea al guardar un archivo.

`https://fralcord.github.io/Formularios-Procesos-Plan.-Estrategica/`

La página publicada es **pública** y accesible para cualquier persona en Internet, aunque el código fuente de este repositorio sea privado. Antes de publicar, mantén los ejemplos ficticios: el flujo publica el código y los datos de muestra presentes en los formularios. Los formularios no envían ni guardan registros en un servidor: cada usuario trabaja en su propio navegador y genera su propio JSON. Una vez habilitado **GitHub Actions** como fuente en **Settings → Pages**, el despliegue usa `GITHUB_TOKEN`; no requiere un token personal.

## Flujo General del Proceso

La plataforma organiza la captura en módulos independientes, no en una secuencia obligatoria. El **Registro de la Iniciativa**, la **Evaluación y sus Resultados** y el **Registro Documental** se pueden completar en cualquier orden. El ciclo iterativo aplica sólo a las instancias de evaluación:

```text
┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
│ Registro de la Iniciativa│   │ Evaluación y Resultados  │   │ Registro Documental      │
│ Completable independiente│   │ Ciclo de instancias      │   │ Completable independiente│
└──────────────────────────┘   └────────────┬─────────────┘   └──────────────────────────┘
                                             │
                        observaciones: archivar etapa y abrir la siguiente
                                             └──► Responde Observaciones ──► Reevaluación ...
```

1. **Registro de la Iniciativa** *(módulo independiente)*: se identifican la iniciativa y sus antecedentes de postulación. Según el formulario, incluye proceso presupuestario, código BIP/IDI, nombre, unidades formuladora y técnica, sector o subtítulo, localización, etapa, costo total y antecedentes del oficio de postulación. No es requisito previo para editar o completar la evaluación ni el registro documental.
2. **Evaluación y sus Resultados** *(módulo con ciclo iterativo propio)*: el profesional registra el dictamen técnico, las observaciones por área y el estado resultante; el estado se presenta después del detalle de la evaluación. El selector identifica **Primer Ingreso**, **Responde Observaciones** o **Reevaluación** como atributo de la entrada evaluativa. Sólo el avance entre instancias valida y archiva los snapshots de esta evaluación en el payload; el historial se destina a la base de datos para el dashboard. El N° de iteración se calcula con los registros archivados y la instancia activa. Desde aquí se genera la **Ficha de Evaluación en PDF**, documento oficial de la DIPLADER, sin mostrar etiquetas de instancia ni bloques de respuesta/reevaluación.
3. **Ficha de Evaluación (PDF)**: permite visualizar y exportar la ficha oficial de la iteración en curso; en impresión se ocultan los controles del formulario y se muestra únicamente esta sección.
4. **Registro Documental Evaluación** *(módulo independiente)*: permite dejar constancia de la ficha emitida: N° de registro, fecha, profesional que registra, referencia del oficio y enlace validador Ley N° 19.799. No se exige para continuar el ciclo de evaluación ni se modifica al avanzar entre instancias.

### Avance y cierre del proceso

El estado registrado en **Evaluación y sus Resultados** determina si corresponde habilitar otra instancia; esta regla no conecta ni bloquea los módulos de Registro de la Iniciativa o Registro Documental. Antes de avanzar, el sistema comprueba sólo los campos requeridos de la instancia evaluativa actual y que exista una fecha no anterior a las ya registradas. Si el resultado contiene observaciones, el botón **"Continuar a la siguiente instancia"** archiva una copia de la evaluación y abre una nueva entrada para la misma iniciativa. **Primer Ingreso**, **Responde Observaciones** y **Reevaluación** se registran como atributos de esa entrada (en `proceso.instancia_evaluacion` y `proceso.clave_instancia`), no como bloques de captura separados. La ficha PDF no muestra el tipo de instancia ni campos específicos de respuesta o reevaluación.

| Resultado | Consecuencia |
|---|---|
| **RECOMENDADO** | **Fin del proceso.** La iniciativa queda con recomendación técnica favorable. |
| **Resultado con OBSERVACIONES** | El postulante responde las observaciones y la iniciativa vuelve a evaluación, dando origen a una nueva iteración. |

> El detalle de las firmas electrónicas y de la emisión de oficios se realiza en otra instancia; la ficha oficial en PDF no incluye pie de firma.

## Ciclo de Iteraciones

Cada resultado que exige observaciones devuelve la iniciativa al postulante y abre una nueva iteración:

| Instancia | Descripción |
|---|---|
| **Primer Ingreso** | Primera evaluación técnica de la iniciativa. |
| **Responde Observaciones** | Nueva entrada de evaluación asociada a la misma iniciativa, identificada por la instancia `RESPONDE_OBSERVACIONES` en el registro de base de datos. |
| **Reevaluación** | Nueva entrada de evaluación asociada a la misma iniciativa, identificada por la instancia `REEVALUACION` en el registro de base de datos. |

| Línea de evaluación | Primer Ingreso | Responde Observaciones | Reevaluación |
|---|---|---|---|
| Evaluación de Pertinencia | Disponible | Disponible | **No aplica** |
| Circular N° 33 | Disponible | Disponible | Disponible |
| Iniciativas Menores a 5.000 UTM | Disponible | Disponible | Disponible |
| Evaluación de Programas | Disponible | Disponible | Disponible |

En cada formulario, el selector **"Instancia de Evaluación"** asigna el tipo de entrada evaluativa. El número de iteración se calcula sumando una a la cantidad de etapas previas archivadas, usando como mínimo el ordinal inicial de la instancia seleccionada. Las etapas cerradas desde el botón se archivan con sus campos de evaluación y fecha. Las iteraciones se conservan en el payload como datos para la base de datos y el dashboard, pero no se presentan como historial, etiquetas ni secciones de respuesta/reevaluación en las fichas PDF.

> **Alcance de validación:** esta versión es una plataforma cliente sin API ni servidor. Las comprobaciones al avanzar y el snapshot del historial se ejecutan en el navegador; cualquier API futura debe repetirlas en el servidor (campos obligatorios, orden cronológico, continuidad de instancia y preservación del snapshot), sin confiar en datos validados sólo por el cliente.

---

## Estructura de los Formularios

Los cuatro formularios comparten la navegación y el ciclo de evaluación, pero los campos del registro se adaptan a cada línea. El orden de captura vigente es:

| Formulario | Orden y campos del Registro de la Iniciativa |
|---|---|
| **Evaluación de Pertinencia** | Proceso presupuestario (año), etapa a la que postula, código BIP/IDI y nombre de la iniciativa, unidad formuladora y unidad técnica, sector/tipología y costo total (M$), provincia/comuna/localidad, descripción del proyecto, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación. |
| **Circular N° 33** | Proceso presupuestario (año) y subtítulo, código BIP/IDI y nombre de iniciativa/acción, unidad formuladora y unidad técnica, sector y costo total, provincia/comuna/localidad o sector, descripción del proyecto, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación. |
| **Iniciativas Menores a 5.000 UTM** | Proceso presupuestario (año) y etapa a la que postula (opciones: Diseño y Ejecución), código IDI/BIP y nombre de la iniciativa, unidad formuladora y unidad técnica, sector, partidas de financiamiento FNDR/Subtítulo 31, provincia/comuna/localidad o sector, descripción de la iniciativa, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación. |
| **Evaluación de Programas** | Proceso presupuestario (año) y sector, código IDI/BIP y nombre del programa, unidad formuladora y unidad técnica, provincia/comuna/localidad o sector, N° y fecha del oficio de postulación, ingreso a Oficina de Partes e ingreso a Evaluación; costo total se conserva al final del registro. |

Los campos de oficio y sus fechas de ingreso se capturan como antecedentes de la iniciativa. En los cuatro formularios, bajo la fecha del oficio se muestra el **Año de Postulación** calculado; no es un campo editable ni se duplica en el payload. Las fichas distinguen el **Proceso Presupuestario** ingresado de ese año derivado; si no se registra la fecha del oficio, el año de postulación se muestra como “-”. En Circular N° 33 y Programas, el **Costo Total** se ingresa en pesos, se serializa como valor numérico en pesos y las fichas lo presentan convertido a **M$** (pesos divididos por 1.000). En Pertinencia y Menores a 5.000 UTM, el costo se construye sumando las partidas de la lista de financiamiento y los montos solicitados para el proceso presupuestario y el año siguiente, ingresados en **pesos**. En Pertinencia se mantienen seleccionables el ítem y la asignación presupuestaria. En Menores a 5.000 UTM, la fuente FNDR, el subtítulo 31 **Iniciativas de Inversión** y el ítem 02 **Proyectos** son fijos; la lista de asignaciones disponibles (001, 002, 003, 004, 005, 006, 007 y 999) sigue la referencia visual de esa ficha. El total por partida y el total general se calculan automáticamente; la ficha presenta el desglose y los totales en **M$**, y el `costo_total` del payload se deriva de la lista en pesos. La captura no incluye sector por partida. En la evaluación de Menores a 5.000 UTM se registran, antes de las observaciones generales y solo para el payload de base de datos, el lineamiento, ítem, objetivo y actividad/programa de la ERD, además del pilar, eje/letra y fundamento de articulación con el Programa del Gobernador Regional; el lineamiento ERD y el pilar son obligatorios. Estos campos no se incluyen en la ficha PDF. En Pertinencia y Circular N° 33, la descripción del proyecto se registra después de provincia, comuna y localidad; Menores a 5.000 UTM también captura una descripción para incluirla en su ficha PDF, cuyo proponente se obtiene de la unidad formuladora. La etapa postulada solo está incluida en Pertinencia y en el formulario **Menores a 5.000 UTM**; en este último el selector ofrece únicamente **Diseño** y **Ejecución**. El subtítulo de Circular N° 33 es independiente de las listas de financiamiento de Pertinencia y Menores a 5.000 UTM.

La grilla mantiene juntos los campos que forman pares o grupos —por ejemplo, código y nombre, unidades, localización y fechas— en pantallas amplias; en pantallas pequeñas los campos se apilan para facilitar su captura.

La arquitectura restante del flujo es:

1. **Paso 1: Registro de la Iniciativa**, con la estructura propia indicada arriba.
2. **Paso 2: Evaluación y sus Resultados**
   - Selector de instancia para registrar el atributo correspondiente e indicador calculado del N° de iteración en curso.
   - Dictamen técnico, desglose de observaciones sectoriales específicas, estado de la evaluación (OBSERVADO / RECOMENDADO / SIN OBSERVACIONES / PERTINENTE), profesional evaluador y fecha.
   - **Primer Ingreso**, **Responde Observaciones** y **Reevaluación** se almacenan como atributos de cada entrada; no se habilitan bloques de captura dedicados para respuesta o reevaluación.
   - Las iteraciones se archivan en el payload y se consultarán desde la base de datos para el dashboard; ninguna línea presenta una tabla de historial en el formulario o PDF.
   - **Salida del paso: Ficha de Evaluación (PDF)**, documento oficial de la DIPLADER, que se previsualiza en la tercera pestaña del formulario.
3. **Paso 3: Ficha de Evaluación (PDF)**
   - Vista e impresión de la ficha oficial correspondiente a la iteración en curso.
4. **Paso 4: Registro Documental Evaluación**
   - Profesional que registra, número, fecha y destinatario del oficio asociado en la instancia de Oficios de la DIPLADER.
   - Constancia del registro y, donde corresponda, enlace validador Ley N° 19.799.
   - Enlace validador Ley N° 19.799 y constancia del registro.
   - La ficha oficial en PDF **no incluye pie de firma**: las firmas y la emisión de oficios se realizan en otra instancia.

---

## Estructura de Archivos del Proyecto

```text
├── index.html                   # Portal, flujograma general y panel central de las 4 líneas
├── pertinencia.html             # 1. Evaluación de Pertinencia Regional (ORD a MDSF u Oficio con Observaciones)
├── circular-33.html             # 2. Circular N° 33 (Anexo 1 con C.A.E. y Evaluación DIPLADER de Vehículos/Maquinarias)
├── evaluacion-5000-utm.html     # 3. Evaluación Menores a 5.000 UTM (Generales, Estudio Preinversional, Presupuesto, EETT, Planos, Anexos y Terreno)
├── evaluacion-programas.html    # 4. Evaluación de Programas (Transferencias Subtítulo 24 y Subtítulo 33)
├── css/
│   ├── styles.css               # Estilos institucionales GORE Los Lagos (responsivo, grillas, tabs, flujograma)
│   └── print.css                # Estilos oficiales para impresión limpia y exportación a PDF institucional
├── assets/
│   ├── gore-los-lagos.png        # Logotipo del Gobierno Regional de Los Lagos
│   └── core-los-lagos.png        # Logotipo del Consejo Regional de Los Lagos
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
   - El bloque azul **"Instancia de Evaluación"** se ubica sobre las pestañas y aplica a todo el formulario. Determina la instancia seleccionada y los bloques que corresponda mostrar; el N° de iteración se calcula a partir de las etapas archivadas.
3. **Navegación entre Pasos**
    - Cada formulario cuenta con las pestañas superiores:
      - `[1] Registro de la Iniciativa`
      - `[2] Evaluación y sus Resultados`
      - `[3] Ficha de Evaluación (PDF)`
      - `[4] Registro Documental Evaluación`
4. **Avance de iteración**
   - Al registrar un estado con observaciones, el botón **"Continuar a la siguiente instancia"** activa la instancia correspondiente y posiciona el formulario en el paso de evaluación.
   - El botón **"Continuar a la siguiente instancia"** archiva automáticamente el snapshot de la evaluación concluida; no se capturan iteraciones anteriores manualmente en el formulario.
5. **Botones de Caso Real ("Cargar Caso...")**
   - **Pertinencia**: *Caso Tehuaco* (Dalcahue, emisión ORD 1628 a MDSF) y *Caso Maillen* (Puerto Montt, Oficio 1644 con observaciones).
   - **Circular 33**: *Maquinaria Chiloé* (Anexo 1 con C.A.E.) y *Camión Aljibe Los Muermos* (Evaluación técnica).
   - **Menores a 5.000 UTM**: *Rev-2* (Puyehue con observaciones sectoriales) y *Rev-6* (Puyehue, reevaluación sin observaciones, con el historial de la Rev-2 ya cargado).
   - **Programas**: *Salud Osorno* (`40065461-0`) y *Cuidados Renales Puerto Montt* (`40080639-0`).
6. **Impresión / Exportación a PDF Oficial**
   - El botón **"Imprimir / Guardar PDF"** activa los estilos de `css/print.css`, ocultando la interfaz de captura y enviando a la impresora o convertidor PDF la **Ficha de Evaluación** con la identificación acotada y la evaluación de la iteración en curso. El historial no se imprime; sus snapshots se destinan a la base de datos y el dashboard.
   - Los logotipos institucionales del GORE y CORE aparecen en la cabecera de las cuatro fichas y se incluyen al exportarlas a PDF.
   - En **Pertinencia**, la ficha presenta los antecedentes del proyecto en una tabla, la evaluación numerada y los datos del profesional y fecha. Utiliza los campos disponibles; no incorpora descripción del proyecto ni fuente y montos de financiamiento, que no se capturan actualmente.
7. **Generar Payload JSON para Base de Datos**
   - El botón **"Generar carga útil JSON"** serializa la información en formato JSON estructurado, agregando el bloque `proceso` con la instancia activa y el número de iteración, además de los snapshots archivados. El payload está destinado a persistencia en la API REST o base de datos y posterior consulta por el dashboard.

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