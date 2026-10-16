/**
 * ============================================================================
 * ESQUEMAS DE DATOS Y CONTRATOS DE API (PARA DESARROLLO DE BACKEND Y BASE DE DATOS)
 * GOBIERNO REGIONAL DE LOS LAGOS - DIVISIÓN DE PLANIFICACIÓN (DIPLADER)
 * ============================================================================
 * Este archivo define los modelos y payloads JSON formales generados por la suite
 * de formularios, basados en la carpeta "Referencia de los procesos".
 *
 * FLUJO DEL PROCESO DE EVALUACIÓN (idéntico en las cuatro líneas):
 *   1. Registro de la iniciativa   -> graba datos de la Ficha IDI (BIP/MDSF)
 *   2. Evaluación y sus resultados -> graba el dictamen de la instancia activa
 *   3. Generación de la ficha de evaluación -> documento oficial imprimible (PDF)
 *
 * CICLO DE ITERACIONES (el proceso es iterativo):
 *   - PRIMER_INGRESO          -> primera instancia (todas las líneas)
 *   - RESPONDE_OBSERVACIONES  -> respuesta a observaciones (todas las líneas)
 *   - REEVALUACION            -> reevaluación (Circular 33, Menores a 5.000 UTM y Programas)
 * El ordinal de la iteración se calcula con las fechas del historial previo y
 * la instancia activa; no debe deducirse sólo de la categoría de instancia.
 *   Cuando el estado resultante contiene observaciones, la iniciativa vuelve a
 *   evaluación por una nueva iteración; cada etapa cerrada queda en el arreglo
 *   "iteraciones" del payload para persistencia y consulta desde el dashboard.
 *
 * NOTA METODOLÓGICA:
 * La "Ficha IDI" no es un formulario del GORE, sino la ficha base de referencia
 * emitida por el Banco Integrado de Proyectos (BIP) del Ministerio de Desarrollo
 * Social y Familia (MDSF) del Estado de Chile. Los procesos del GORE son:
 * 1. Evaluación de Pertinencia (para postular al MDSF o devolver a municipios)
 * 2. Evaluación Circular 33 (Postulación Anexo 1 y Evaluación Técnica DIPLADER)
 * 3. Evaluación Iniciativas Menores a 5.000 UTM (Revisiones con observaciones)
 * 4. Evaluación de Programas (Transferencias Subt. 24 y 33)
 * 5. Seguimiento y Control de Cartera (Matriz de plazos de 15 días y oficios)
 */

/** Bloque común a los cuatro modelos: estado de la iteración en curso. */
const BLOQUE_PROCESO_EVALUACION = {
  linea_evaluacion: { tipo: "string" },
  instancia_evaluacion: {
    tipo: "string",
    enum: ["Primer Ingreso", "Responde Observaciones", "Reevaluación"]
  },
  clave_instancia: {
    tipo: "string",
    enum: ["PRIMER_INGRESO", "RESPONDE_OBSERVACIONES", "REEVALUACION"]
  },
  numero_iteracion: {
    tipo: "integer",
    minimo: 1,
    descripcion: "Calculado desde las iteraciones previas fechadas y la instancia activa"
  },
  admite_reevaluacion: { tipo: "boolean", descripcion: "true en Circular 33, Menores a 5.000 UTM y Programas" },
  iteraciones_registradas: { tipo: "integer", descripcion: "Cantidad de iteraciones previas con fecha en el historial" }
};

/** Historial de etapas cerradas, con snapshot para conservar la evaluación completa. */
const HISTORIAL_ITERACIONES = [
  {
    numero: { tipo: "integer" },
    fecha: { tipo: "string", formato: "date" },
    instancia: { tipo: "string", enum: ["Primer Ingreso", "Responde Observaciones", "Reevaluación"] },
    estado: { tipo: "string", descripcion: "Estado o resultado de esa iteración" },
    detalle: { tipo: "text", descripcion: "Síntesis o fundamento del resultado" },
    registro: {
      tipo: "object",
      opcional: true,
      descripcion: "Snapshot inmutable de los campos de evaluación capturados al cerrar la instancia; el tipo de instancia se registra como atributo"
    }
  }
];

/**
 * Paso 3 del flujo: constancia documental de la ficha de evaluación emitida.
 * La firma electrónica y la emisión de oficios ocurren en otra instancia, por
 * lo que aquí sólo se referencia el registro y su identificador.
 */
const BLOQUE_REGISTRO_DOCUMENTAL = {
  numero_registro: { tipo: "string", opcional: true, descripcion: "N° de registro documental interno de la DIPLADER" },
  fecha_registro: { tipo: "string", formato: "date", opcional: true },
  registrado_por: { tipo: "string", descripcion: "Profesional que realiza el registro documental" },
  referencia_oficio: {
    tipo: "string",
    opcional: true,
    descripcion: "N° de oficio u ORD emitido en la instancia de Oficios de la DIPLADER"
  },
  fecha_oficio: { tipo: "string", formato: "date", opcional: true },
  destinatario_oficio: { tipo: "string", opcional: true },
  url_validador_docdigital: { tipo: "string", opcional: true, descripcion: "Enlace validador Ley N° 19.799" },
  constancia_registro: { tipo: "text", opcional: true, descripcion: "Dónde se conserva, a quién se remitió, observaciones de archivo" }
};

/** Cierre del ciclo evaluativo al registrar documentalmente la ficha. */
const BLOQUE_CIERRE_CICLO = {
  resultado_ciclo: {
    tipo: "string",
    enum: ["RECOMENDADO", "CON_OBSERVACIONES"],
    descripcion: "RECOMENDADO cierra el proceso; CON_OBSERVACIONES abre una nueva iteración"
  },
  fin_de_proceso: { tipo: "boolean", descripcion: "true cuando el resultado es RECOMENDADO" },
  detalle_cierre: { tipo: "text", opcional: true }
};

window.AppSchemas = {

  /**
   * 1. EVALUACIÓN DE PERTINENCIA REGIONAL
   * Base de entrada: Datos de Ficha IDI (BIP / MDSF)
   * Salida GORE: Dictamen de pertinencia regional, coherencia ERD / Plan Gobernador y emisión de ORD/Oficio.
   */
  pertinencia: {
    nombre_modelo: "EvaluacionPertinenciaRegional",
    descripcion: "Dictamen de pertinencia regional FNDR con base en la Ficha IDI del BIP/MDSF",
    referencia_base: "Ficha IDI (Banco Integrado de Proyectos - MDSF)",
    flujo: ["Registro de la iniciativa", "Evaluación y sus resultados", "Ficha de evaluación (PDF)"],
    instancias_admitidas: ["PRIMER_INGRESO", "RESPONDE_OBSERVACIONES"],
    campos: {
      proceso_presupuestario_ano: { tipo: "integer", descripcion: "Año presupuestario (ej: 2026 / 2027)" },
      codigo_bip: { tipo: "string", descripcion: "Código BIP con dígito verificador ej: '40052180-0'" },
nombre_iniciativa: { tipo: "string", descripcion: "Nombre oficial en la Ficha IDI" },
      tipologia: { tipo: "string", enum: ["01", "02", "03"] },
      etapa_postulacion: { tipo: "string", enum: ["Ejecución", "Diseño", "Factibilidad", "Prefactibilidad"] },
      sector: { tipo: "string", enum: ["Salud", "Agua Potable Rural (SSR)", "Deporte", "Seguridad", "Educación", "Recursos Naturales y Medio Ambiente", "Multisectorial", "Fomento Productivo", "Desarrollo Social", "Otros"] },
      unidad_formuladora: { tipo: "string", descripcion: "Nombre de la unidad formuladora" },
      unidad_tecnica: { tipo: "string", descripcion: "Unidad técnica responsable de la revisión (ej: DOH MOP, DIPLADER)" },
      localizacion: {
        provincia: { tipo: "string", enum: ["LLANQUIHUE", "CHILOÉ", "OSORNO", "PALENA", "REGIONAL"] },
        comuna: { tipo: "string", enum: ["Calbuco", "Cochamó", "Fresia", "Frutillar", "Llanquihue", "Los Muermos", "Maullín", "Puerto Montt", "Puerto Varas", "Ancud", "Castro", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena", "Provincial", "Regional"] },
        localidad: { tipo: "string", opcional: true }
      },
      descripcion_proyecto: {
        tipo: "text",
        opcional: true,
        descripcion: "Descripción general del proyecto capturada en el Registro de la Iniciativa"
      },
      oficio_postulacion: {
        numero: { tipo: "string", opcional: true, descripcion: "N° de oficio de postulación (puede incluir letras)" },
        fecha: {
          tipo: "string",
          formato: "date",
          opcional: true,
          descripcion: "La ficha deriva de esta fecha el año de postulación"
        },
        fechaIngresoOficinaPartes: { tipo: "string", formato: "date", opcional: true },
        fechaIngresoEvaluacion: { tipo: "string", formato: "date", opcional: true }
      },

      fuentes_financiamiento: {
        tipo: "array",
        descripcion: "Partidas de financiamiento de subtítulo 31; los montos se capturan y almacenan en pesos",
        elementos: {
          fuente: { tipo: "string", valor_predeterminado: "FNDR" },
          subtitulo: { tipo: "string", valor_predeterminado: "31" },
          grupo_inversion: { tipo: "string", enum: ["01 ESTUDIOS BÁSICOS", "02 PROYECTOS", "03 PROGRAMAS DE INVERSIÓN"] },
          item: { tipo: "string", descripcion: "Código del ítem presupuestario (01, 02 o 03)" },
          clasificador: { tipo: "string", descripcion: "Código de clasificador seleccionado para el ítem" },
          clasificador_descripcion: { tipo: "string", descripcion: "Nombre del clasificador presupuestario" },
          solicitado_ano_actual: { tipo: "number", unidad: "pesos" },
          solicitado_ano_siguiente: { tipo: "number", unidad: "pesos" },
          costo_total: { tipo: "number", unidad: "pesos", descripcion: "Suma de los montos solicitados de ambos años para la partida" }
        }
      },
      costo_total: { tipo: "number", unidad: "pesos", descripcion: "Total derivado de sumar las partidas de fuentes_financiamiento; la ficha lo presenta convertido a M$" },
      // Evaluación Estratégica Regional GORE Los Lagos
evaluacion_pertinencia: {
        erd_lineamiento: { tipo: "string", opcional: true, descripcion: "Lineamiento estratégico ERD (campo de texto libre)" },
        erd_item: { tipo: "string", opcional: true },
        erd_objetivo: { tipo: "string", opcional: true },
        erd_actividad: { tipo: "string", opcional: true },
        gob_pilar: { tipo: "string", opcional: true, descripcion: "Pilares del Programa Regional del Gobernador seleccionados (múltiples, separados por ;)" },
        gob_letra: { tipo: "string", opcional: true, descripcion: "Letra/Eje específico del programa" },
        gob_fundamento: { tipo: "text", opcional: true, descripcion: "Justificación de la articulación con el plan del Gobernador" },
        analisis_tecnico: { tipo: "text", descripcion: "Dictamen de viabilidad territorial y priorización FNDR" }
      },
      // Resolución y Acto Administrativo
      resolucion: {
        estado_pertinencia: { tipo: "string", enum: ["PERTINENTE_A_MDSF", "CON_OBSERVACIONES"] },
        oficio_materia: { tipo: "string" },
        observaciones_devolucion: { tipo: "text", opcional: true, descripcion: "Requerimientos para subsanación del municipio" }
      },
      // Trazabilidad de Trámite y Control 15 Días
trazabilidad: {
        ord_ingreso_numero: { tipo: "string" },
        fecha_ord_ingreso: { tipo: "string", formato: "date" },
        fecha_ingreso_oficina_partes: { tipo: "string", formato: "date" },
        evaluador_nombre: { tipo: "string" },
        fecha_derivacion_evaluador: { tipo: "string", formato: "date" },
        fecha_evaluacion: { tipo: "string", formato: "date" },
        cumple_15_dias_habiles: { tipo: "boolean" }
      },
      // Instancia de evaluación asociada al registro de la iniciativa.
      proceso_evaluacion: BLOQUE_PROCESO_EVALUACION,
      // Historial de las instancias evaluativas para persistencia y dashboard
      iteraciones: HISTORIAL_ITERACIONES,
      // Paso 3: Registro Documental Evaluación y cierre del ciclo
      registro_documental_evaluacion: BLOQUE_REGISTRO_DOCUMENTAL,
      cierre_ciclo: BLOQUE_CIERRE_CICLO
    }
  },

  /**
   * 2. EVALUACIÓN Y FICHA RESUMEN CIRCULAR 33
   * Referencia: Subtítulo 22 (Estudios Básicos), Subtítulo 29 (Activos No Financieros) y Emergencias.
   */
  circular33: {
    nombre_modelo: "Circular33Iniciativa",
    descripcion: "Ficha Resumen (Anexo N° 1) y Ficha de Evaluación Técnica Circular 33",
    flujo: ["Registro de la iniciativa (Anexo 1)", "Evaluación y sus resultados", "Ficha de evaluación (PDF)"],
    instancias_admitidas: ["PRIMER_INGRESO", "RESPONDE_OBSERVACIONES", "REEVALUACION"],
    campos: {
      proceso_presupuestario_ano: { tipo: "integer", descripcion: "Año del proceso presupuestario; la ficha deriva el año de postulación de la fecha del oficio" },
      subtitulo: { tipo: "integer", enum: [22, 29, 31] },
      codigo_bip: { tipo: "string" },
      nombre_accion: { tipo: "string" },
      region: { tipo: "string", default: "Región de Los Lagos" },
      sector: { tipo: "string", enum: ["Salud", "Agua Potable Rural (SSR)", "Deporte", "Seguridad", "Educación", "Recursos Naturales y Medio Ambiente", "Multisectorial", "Fomento Productivo", "Desarrollo Social", "Otros"] },
      provincia: { tipo: "string" },
      comuna: { tipo: "string" },
      localizacion: {
        localidad: { tipo: "string", opcional: true }
      },
      descripcion_proyecto: {
        tipo: "text",
        opcional: true,
        descripcion: "Descripción general de la iniciativa capturada en el Registro de la Iniciativa"
      },
      unidad_formuladora: { tipo: "string" },
      unidad_tecnica: { tipo: "string" },
      costo_total: { tipo: "number", descripcion: "Costo total expresado en pesos; las fichas lo muestran convertido a M$" },
      oficio_postulacion: {
        numero: { tipo: "string", opcional: true },
        fecha: { tipo: "string", formato: "date", opcional: true, descripcion: "La ficha deriva de esta fecha el año de postulación" },
        fechaIngresoOficinaPartes: { tipo: "string", formato: "date", opcional: true },
        fechaIngresoEvaluacion: { tipo: "string", formato: "date", opcional: true }
      },
      cronograma: {
        fecha_licitacion_mes_ano: { tipo: "string" },
        fecha_adjudicacion_mes_ano: { tipo: "string" },
        fecha_inicio_mes_ano: { tipo: "string" }
      },
      evaluacion_c33: {
        item: { tipo: "string" },
        estado: { tipo: "string", enum: ["OBSERVADO", "RECOMENDADO", "RECHAZADO"] },
        texto_observaciones: { tipo: "text" },
        evaluador_nombre: { tipo: "string" },
        fecha_evaluacion: { tipo: "string", formato: "date" }
      },
      proceso_evaluacion: BLOQUE_PROCESO_EVALUACION,
      iteraciones: HISTORIAL_ITERACIONES,
      // Paso 3: Registro Documental Evaluación y cierre del ciclo
      registro_documental_evaluacion: BLOQUE_REGISTRO_DOCUMENTAL,
      cierre_ciclo: BLOQUE_CIERRE_CICLO
    }
  },

  /**
   * 3. FICHA DE EVALUACIÓN INICIATIVAS MENORES A 5.000 UTM
   * Referencia: Rev-2 (Observaciones sectoriales) y Rev-6 (Sin observaciones / Recomendado)
   */
  evaluacion5000Utm: {
    nombre_modelo: "FichaEvaluacion5000UTM",
    descripcion: "Evaluación técnica de iniciativas clasificadas como Menores a 5.000 UTM",
    flujo: ["Registro de la iniciativa", "Evaluación y sus resultados", "Ficha de evaluación (PDF)"],
    instancias_admitidas: ["PRIMER_INGRESO", "RESPONDE_OBSERVACIONES", "REEVALUACION"],
    campos: {
      proceso_presupuestario_ano: { tipo: "integer", descripcion: "Año del proceso presupuestario; el año de postulación se deriva de la fecha del oficio" },
      etapa_postulacion: { tipo: "string", enum: ["Diseño", "Ejecución"] },
      codigo_idi: { tipo: "string" },
      nombre_iniciativa: { tipo: "string" },
      descripcion_proyecto: { tipo: "text", opcional: true, descripcion: "Descripción de la iniciativa incluida en la ficha de evaluación" },
      sector: { tipo: "string", enum: ["Salud", "Agua Potable Rural (SSR)", "Deporte", "Seguridad", "Educación", "Recursos Naturales y Medio Ambiente", "Multisectorial", "Fomento Productivo", "Desarrollo Social", "Otros"] },
      provincia: { tipo: "string" },
      comuna: { tipo: "string" },
      localizacion: {
        localidad: { tipo: "string", opcional: true }
      },
      unidad_formuladora: { tipo: "string" },
      unidad_tecnica: { tipo: "string" },
      fuentes_financiamiento: {
        tipo: "array",
        descripcion: "Partidas de financiamiento de subtítulo 31; los montos se capturan y almacenan en pesos",
        elementos: {
          fuente: { tipo: "string", valor_predeterminado: "FNDR" },
          subtitulo: { tipo: "string", valor_predeterminado: "31" },
          grupo_inversion: { tipo: "string", enum: ["01 ESTUDIOS BÁSICOS", "02 PROYECTOS", "03 PROGRAMAS DE INVERSIÓN"] },
          item: { tipo: "string", descripcion: "Código del ítem presupuestario (01, 02 o 03)" },
          clasificador: { tipo: "string", descripcion: "Código de asignación seleccionado para el ítem" },
          clasificador_descripcion: { tipo: "string", descripcion: "Nombre de la asignación presupuestaria" },
          solicitado_ano_actual: { tipo: "number", unidad: "pesos" },
          solicitado_ano_siguiente: { tipo: "number", unidad: "pesos" },
          costo_total: { tipo: "number", unidad: "pesos", descripcion: "Suma de los montos solicitados de ambos años para la partida" }
        }
      },
      costo_total: { tipo: "number", unidad: "pesos", descripcion: "Total derivado de sumar las partidas de fuentes_financiamiento; la ficha lo presenta convertido a M$" },
      oficio_postulacion: {
        numero: { tipo: "string", opcional: true },
        fecha: { tipo: "string", formato: "date", opcional: true, descripcion: "La ficha deriva de esta fecha el año de postulación" },
        fechaIngresoOficinaPartes: { tipo: "string", formato: "date", opcional: true },
        fechaIngresoEvaluacion: { tipo: "string", formato: "date", opcional: true }
      },
      evaluacion_tecnica: {
        estado_resultado: { tipo: "string", enum: ["SIN OBSERVACIONES", "OBSERVADO", "RECOMENDADO", "RECHAZADO"] },
        lineamiento_estrategico_erd: { tipo: "string", opcional: true, descripcion: "Lineamiento Estratégico de la ERD Los Lagos" },
        item_erd: { tipo: "string", opcional: true, descripcion: "Ítem de la ERD asociado a la iniciativa" },
        objetivo_estrategico_erd: { tipo: "text", opcional: true },
        actividad_programa_erd: { tipo: "text", opcional: true },
        pilar_programa_gobernador_regional: { tipo: "string", opcional: true, descripcion: "Pilar del Programa del Gobernador Regional" },
        eje_letra_programa_gobernador: { tipo: "string", opcional: true, descripcion: "Eje o letra específica del Programa del Gobernador Regional" },
        articulacion_programa_regional_gobernador: { tipo: "text", opcional: true, descripcion: "Fundamento de articulación con el Programa Regional del Gobernador" },
        observaciones_generales: { tipo: "text" },
        observaciones_estudio_preinversional: { tipo: "text" },
        observaciones_presupuesto: { tipo: "text" },
        observaciones_ttr_eett: { tipo: "text" },
        observaciones_planos_ingenieria: { tipo: "text" },
        observaciones_anexos: { tipo: "text" },
        observaciones_terreno_otros: { tipo: "text" },
        sintesis_evaluacion: { tipo: "text" }
      },
      control_evaluacion: {
        evaluador_nombre: { tipo: "string" },
        evaluador_cargo: { tipo: "string" },
        fecha_evaluacion: { tipo: "string", formato: "date" }
      },
      proceso_evaluacion: BLOQUE_PROCESO_EVALUACION,
      iteraciones: HISTORIAL_ITERACIONES,
      // Paso 3: Registro Documental Evaluación y cierre del ciclo
      registro_documental_evaluacion: BLOQUE_REGISTRO_DOCUMENTAL,
      cierre_ciclo: BLOQUE_CIERRE_CICLO
    }
  },

  /**
   * 4. EVALUACIÓN Y PERTINENCIA DE PROGRAMAS
   * Referencia: Subtítulo 24 (Transferencias Corrientes) y Subtítulo 33 (Transferencias de Capital)
   */
  evaluacionProgramas: {
    nombre_modelo: "EvaluacionProgramasRegional",
    descripcion: "Evaluación y pertinencia de programas de salud, medio ambiente y fomento",
    flujo: ["Registro de la iniciativa", "Evaluación y sus resultados", "Ficha de evaluación (PDF)"],
    instancias_admitidas: ["PRIMER_INGRESO", "RESPONDE_OBSERVACIONES", "REEVALUACION"],
    campos: {
      proceso_presupuestario_ano: { tipo: "integer", descripcion: "Año del proceso presupuestario; el año de postulación se deriva de la fecha del oficio" },
      codigo_idi: { tipo: "string" },
      localizacion: {
        provincia: { tipo: "string" },
        comuna: { tipo: "string" },
        localidad: { tipo: "string", opcional: true }
      },
      sector: { tipo: "string" },
      nombre_programa: { tipo: "string" },
      unidad_formuladora: { tipo: "string" },
      unidad_tecnica: { tipo: "string" },
      costo_total: { tipo: "number", descripcion: "Costo total expresado en pesos; las fichas lo muestran convertido a M$" },
      oficio_postulacion: {
        numero: { tipo: "string", opcional: true },
        fecha: { tipo: "string", formato: "date", opcional: true, descripcion: "La ficha deriva de esta fecha el año de postulación" },
        fechaIngresoOficinaPartes: { tipo: "string", formato: "date", opcional: true },
        fechaIngresoEvaluacion: { tipo: "string", formato: "date", opcional: true }
      },
      evaluacion: {
        estado: { tipo: "string", enum: ["RECOMENDADO", "OBSERVADO", "RECHAZADO"] },
        fecha: { tipo: "string", formato: "date" },
        erd_lineamiento: { tipo: "string", opcional: true, descripcion: "Lineamiento Estratégico ERD Los Lagos" },
        erd_item: { tipo: "string", opcional: true, descripcion: "Ítem ERD asociado al programa" },
        erd_objetivo: { tipo: "text", opcional: true, descripcion: "Objetivo Estratégico ERD" },
        erd_actividad: { tipo: "text", opcional: true, descripcion: "Actividad o Programa ERD" },
        gob_pilar: { tipo: "string", opcional: true, descripcion: "Pilar del Programa del Gobernador Regional" },
        gob_letra: { tipo: "string", opcional: true, descripcion: "Eje o letra específica del Programa del Gobernador Regional" },
        gob_fundamento: { tipo: "text", opcional: true, descripcion: "Fundamento de articulación con el Programa Regional del Gobernador" },
        texto_evaluacion: { tipo: "text" },
        evaluador_nombre: { tipo: "string" }
      },
      proceso_evaluacion: BLOQUE_PROCESO_EVALUACION,
      iteraciones: HISTORIAL_ITERACIONES,
      // Paso 3: Registro Documental Evaluación y cierre del ciclo
      registro_documental_evaluacion: BLOQUE_REGISTRO_DOCUMENTAL,
      cierre_ciclo: BLOQUE_CIERRE_CICLO
    }
  },

  /**
   * 5. SEGUIMIENTO DE CARTERA Y MATRIZ GENERAL
   * Referencia: Archivos Excel de control de gestión y plazos de 15 días hábiles
   */
  seguimientoCartera: {
    nombre_modelo: "SeguimientoIniciativaCartera",
    descripcion: "Registro de control de ingreso, alineación ERD/Gobernador y plazos de 15 días",
    campos: {
      numero_correlativo: { tipo: "integer" },
      codigo_bip: { tipo: "string" },
      verificador: { tipo: "string" },
      nombre_iniciativa: { tipo: "string" },
      provincia: { tipo: "string" },
      comuna: { tipo: "string" },
      sector: { tipo: "string" },
      etapa: { tipo: "string" },
      monto_propuesto_m: { tipo: "number" },
      monto_recomendado_m: { tipo: "number" },
      alineamiento_erd: {
        lineamiento: { tipo: "string" },
        item: { tipo: "string" },
        objetivo: { tipo: "string" },
        actividad: { tipo: "string" }
      },
      plan_gobernador: {
        pilar: { tipo: "string" },
        letra_linea: { tipo: "string" },
        descripcion_enlace: { tipo: "text" }
      },
      beneficiarios: {
        hombres: { tipo: "integer" },
        mujeres: { tipo: "integer" },
        total: { tipo: "integer" }
      },
      ingreso: {
        unidad_tecnica: { tipo: "string" },
        unidad_formuladora: { tipo: "string" },
        ord_ingreso_numero: { tipo: "string" },
        fecha_ord_ingreso: { tipo: "string", formato: "date" },
        fecha_ingreso_oficina_partes: { tipo: "string", formato: "date" }
      },
      evaluacion_tramite: {
        evaluador_asignado: { tipo: "string" },
        fecha_derivacion_evaluador: { tipo: "string", formato: "date" },
        cumple_15_dias_habiles: { tipo: "boolean" },
        numero_iteraciones: { tipo: "integer" },
        estado_proyecto: { tipo: "string", enum: ["Recomendado", "Observado", "En Trámite", "Pendiente"] },
        fecha_recomendacion_final: { tipo: "string", formato: "date", opcional: true }
      },
      iteraciones: [
        {
          ord_gore_observaciones: { tipo: "string" },
          fecha_ord_gore: { tipo: "string", formato: "date" },
          ord_respuesta_observaciones: { tipo: "string" },
          fecha_ord_respuesta: { tipo: "string", formato: "date" },
          estado_iteracion: { tipo: "string", enum: ["OBSERVADO", "SIN OBSERVACIONES"] }
        }
      ]
    }
  }
};
