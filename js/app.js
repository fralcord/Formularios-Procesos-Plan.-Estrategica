/**
 * ============================================================================
 * UTILIDADES COMUNES Y CONTROLADOR CLIENTE DE FORMULARIOS
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initAutoCalculations();
  initModalJsonViewer();
  AppSeguimiento.init();
});

function initModalJsonViewer() {
  // Compatibilidad con versiones previas del código: el modal JSON se genera
  // bajo demanda al abrir la vista de payload. No hace falta inicializar nada
  // aquí para que el formulario siga funcionando.
}

const AppSeguimiento = {
  STORAGE_KEY: 'gore_iniciativas_seguimiento',
  DEFAULT_STATUS: 'EN_EVALUACION',
  STATUS_LABELS: {
    EN_EVALUACION: 'En evaluación',
    CON_OBSERVACIONES: 'Con observaciones',
    EVALUADA: 'Evaluada',
    RECHAZADA: 'Rechazada'
  },

  normalizarTexto(valor) {
    return String(valor ?? '').trim();
  },

  garantizarCamposEstado(form) {
    if (!form) return;

    const estadoInput = form.querySelector('input[name="estado_proceso"]') || document.createElement('input');
    if (!form.querySelector('input[name="estado_proceso"]')) {
      estadoInput.type = 'hidden';
      estadoInput.name = 'estado_proceso';
      form.appendChild(estadoInput);
    }

    const fechaIngreso = form.querySelector('input[name="fecha_ingreso_evaluacion"]') || document.createElement('input');
    if (!form.querySelector('input[name="fecha_ingreso_evaluacion"]')) {
      fechaIngreso.type = 'hidden';
      fechaIngreso.name = 'fecha_ingreso_evaluacion';
      form.appendChild(fechaIngreso);
    }

    const fechaActualizacion = form.querySelector('input[name="fecha_ultima_actualizacion"]') || document.createElement('input');
    if (!form.querySelector('input[name="fecha_ultima_actualizacion"]')) {
      fechaActualizacion.type = 'hidden';
      fechaActualizacion.name = 'fecha_ultima_actualizacion';
      form.appendChild(fechaActualizacion);
    }

    const badge = form.querySelector('[data-estado-proceso-badge]');
    if (!badge) {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'status-badge info';
      badgeEl.setAttribute('data-estado-proceso-badge', 'true');
      badgeEl.textContent = 'ESTADO: EN EVALUACIÓN';
      const primerBloque = form.querySelector('.form-section-card, .paso-contenedor, .form-grid');
      if (primerBloque) {
        primerBloque.insertAdjacentElement('afterend', badgeEl);
      } else {
        form.insertBefore(badgeEl, form.firstChild);
      }
    }
  },

  obtenerValorAnidado(obj, ruta) {
    if (!obj || !ruta) return '';
    return ruta.split('.').reduce((actual, clave) => actual && actual[clave] !== undefined ? actual[clave] : '', obj);
  },

  resolverEstado(data) {
    const estadoExplcito = this.normalizarTexto(data?.estado_proceso?.estado || data?.estado_proceso || '');
    if (estadoExplcito) {
      const clave = estadoExplcito.toUpperCase().replace(/\s+/g, '_');
      if (this.STATUS_LABELS[clave]) return clave;
      if (/OBSERV/.test(clave)) return 'CON_OBSERVACIONES';
      if (/(PERTINENTE|EVALUADA|EVALUADO|RECOMENDADO|ACEPT|APROB|SIN_OBSERVACIONES)/.test(clave)) return 'EVALUADA';
      if (/(RECHAZ|NO_PERTINENTE|DENEG|DESCART)/.test(clave)) return 'RECHAZADA';
    }

    const candidatos = [
      this.obtenerValorAnidado(data, 'resolucion.estado_pertinencia'),
      this.obtenerValorAnidado(data, 'evaluacion_c33.estado'),
      this.obtenerValorAnidado(data, 'evaluacion_tecnica.estado_resultado'),
      this.obtenerValorAnidado(data, 'evaluacion.estado'),
      this.obtenerValorAnidado(data, 'resultado.estado'),
      this.obtenerValorAnidado(data, 'estado_resultado_evaluacion')
    ].filter(v => this.normalizarTexto(v));

    for (const valor of candidatos) {
      const texto = String(valor).toUpperCase();
      if (/(OBSERV|CON_OBSERV)/.test(texto)) return 'CON_OBSERVACIONES';
      if (/(PERTINENTE|RECOMENDADO|ACEPT|APROB|SIN_OBSERVACIONES|VISTO_BUENO|VISTO BUENO)/.test(texto)) return 'EVALUADA';
      if (/(RECHAZ|NO_PERTINENTE|DENEG|DESCART)/.test(texto)) return 'RECHAZADA';
    }

    return this.DEFAULT_STATUS;
  },

  identificarIniciativa(data) {
    const candidatos = [
      data?.codigo_bip,
      data?.codigo,
      data?.nombre_iniciativa,
      data?.nombre_accion,
      data?.nombre_proyecto,
      data?.proceso?.nombre_iniciativa
    ].filter(v => this.normalizarTexto(v));

    if (candidatos.length) {
      const base = this.normalizarTexto(candidatos[0]).replace(/\s+/g, ' ');
      return base.length > 80 ? base.slice(0, 80) : base;
    }

    return 'iniciativa-' + Date.now();
  },

  obtenerColeccion() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  },

  guardar(form) {
    if (!form || !('localStorage' in window)) return null;

    this.garantizarCamposEstado(form);

    const payload = serializeForm(form);
    const estado = this.resolverEstado(payload);
    const instancia = AppIteracion && typeof AppIteracion.actual === 'function'
      ? AppIteracion.actual(form.dataset.selectorId || 'selectorInstancia')
      : 'PRIMER_INGRESO';

    const fechaActual = new Date().toISOString();
    const fechaIngresoEvaluacion = this.normalizarTexto(payload?.oficio_postulacion?.fechaIngresoEvaluacion || payload?.registro_documental?.fechaIngresoEvaluacion || payload?.fecha_ingreso_evaluacion || '') || fechaActual.slice(0, 10);

    const registro = {
      id: this.identificarIniciativa(payload),
      linea: form.dataset.linea || 'general',
      estado,
      estado_label: this.STATUS_LABELS[estado] || 'En evaluación',
      instancia: AppIteracion && AppIteracion.ETIQUETAS ? AppIteracion.ETIQUETAS[instancia] || instancia : instancia,
      clave_instancia: instancia,
      fecha_ingreso_evaluacion: fechaIngresoEvaluacion,
      fecha_ultima_actualizacion: fechaActual,
      nombre_iniciativa: this.identificarIniciativa(payload),
      payload
    };

    const coleccion = this.obtenerColeccion();
    const indice = coleccion.findIndex(item => item.id === registro.id);
    if (indice >= 0) {
      coleccion[indice] = registro;
    } else {
      coleccion.unshift(registro);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(coleccion));

    const hidden = form.querySelector('input[name="estado_proceso"]');
    if (hidden) hidden.value = estado;

    const fechaIngresoInput = form.querySelector('input[name="fecha_ingreso_evaluacion"]');
    if (fechaIngresoInput && !fechaIngresoInput.value) {
      fechaIngresoInput.value = fechaIngresoEvaluacion;
    }

    const fechaActualizacionInput = form.querySelector('input[name="fecha_ultima_actualizacion"]');
    if (fechaActualizacionInput) {
      fechaActualizacionInput.value = fechaActual;
    }

    const badge = form.querySelector('[data-estado-proceso-badge]');
    if (badge) {
      badge.textContent = 'ESTADO: ' + (this.STATUS_LABELS[estado] || 'En evaluación').toUpperCase();
      badge.dataset.estado = estado;
      badge.className = 'status-badge ' + (estado === 'EN_EVALUACION' ? 'info' : estado === 'CON_OBSERVACIONES' ? 'warning' : estado === 'EVALUADA' ? 'success' : 'danger');
    }

    return registro;
  },

  sincronizarEstadoFormulario(form) {
    if (!form) return;
    this.garantizarCamposEstado(form);

    const payload = serializeForm(form);
    const estado = this.resolverEstado(payload);
    const badge = form.querySelector('[data-estado-proceso-badge]');
    if (badge) {
      badge.textContent = 'ESTADO: ' + (this.STATUS_LABELS[estado] || 'En evaluación').toUpperCase();
      badge.dataset.estado = estado;
      badge.className = 'status-badge ' + (estado === 'EN_EVALUACION' ? 'info' : estado === 'CON_OBSERVACIONES' ? 'warning' : estado === 'EVALUADA' ? 'success' : 'danger');
    }

    const hidden = form.querySelector('input[name="estado_proceso"]');
    if (hidden) hidden.value = estado;

    const fechaIngreso = form.querySelector('input[name="fecha_ingreso_evaluacion"]');
    const ingreso = this.normalizarTexto(payload?.oficio_postulacion?.fechaIngresoEvaluacion || payload?.registro_documental?.fechaIngresoEvaluacion || payload?.fecha_ingreso_evaluacion || '');
    if (fechaIngreso && ingreso && !fechaIngreso.value) {
      fechaIngreso.value = ingreso;
    }

    const fechaActualizacion = form.querySelector('input[name="fecha_ultima_actualizacion"]');
    if (fechaActualizacion) {
      fechaActualizacion.value = new Date().toISOString();
    }
  },

  renderDashboard() {
    const host = document.getElementById('dashboardProcesos');
    if (!host) return;

    const iniciativas = this.obtenerColeccion();
    const total = iniciativas.length;
    const enEvaluacion = iniciativas.filter(item => item.estado === 'EN_EVALUACION').length;
    const conObservaciones = iniciativas.filter(item => item.estado === 'CON_OBSERVACIONES').length;
    const evaluadas = iniciativas.filter(item => item.estado === 'EVALUADA').length;

    host.innerHTML = `
      <div class="status-dashboard-grid">
        <div class="status-card status-card-info">
          <span class="status-label">Total</span>
          <strong>${total}</strong>
        </div>
        <div class="status-card status-card-warning">
          <span class="status-label">En evaluación</span>
          <strong>${enEvaluacion}</strong>
        </div>
        <div class="status-card status-card-alert">
          <span class="status-label">Con observaciones</span>
          <strong>${conObservaciones}</strong>
        </div>
        <div class="status-card status-card-success">
          <span class="status-label">Evaluadas</span>
          <strong>${evaluadas}</strong>
        </div>
      </div>
    `;
  },

  init() {
    document.querySelectorAll('form').forEach(form => {
      if (form.dataset.trackerReady === 'true') return;
      form.dataset.trackerReady = 'true';

      this.sincronizarEstadoFormulario(form);

      form.addEventListener('input', () => this.sincronizarEstadoFormulario(form));
      form.addEventListener('change', () => this.sincronizarEstadoFormulario(form));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const registro = this.guardar(form);
        if (registro) {
          this.renderDashboard();
        }
      });
    });

    this.renderDashboard();
  }
};

/**
 * Serializa cualquier formulario HTML en un objeto plano y estructurado.
 * Lee todos los campos con atributo 'name', estructurando objetos anidados
 * mediante puntos (ej: "responsable.nombre" -> { responsable: { nombre: '...' } })
 * y recolectando filas de tablas marcadas con 'data-table-row'.
 */
function serializeForm(formElement) {
  const formData = new FormData(formElement);
  const result = {};

  // Procesar inputs simples
  for (const [key, value] of formData.entries()) {
    // Si el campo pertenece a una fila de tabla dinámica, lo procesamos por separado
    if (key.includes('[]') || key.startsWith('_table_')) continue;

    if (key.includes('.')) {
      const parts = key.split('.');
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = parseValue(value);
    } else {
      result[key] = parseValue(value);
    }
  }

  // Procesar tablas dinámicas con data-table-id
  const dynamicTables = formElement.querySelectorAll('table[data-table-id]');
  dynamicTables.forEach(table => {
    const tableId = table.getAttribute('data-table-id');
    const rows = table.querySelectorAll('tbody tr[data-table-row]');
    const tableData = [];

    rows.forEach(row => {
      const rowObj = {};
      const inputs = row.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const fieldName = input.getAttribute('data-field') || input.name;
        if (fieldName) {
          rowObj[fieldName] = parseValue(input.value);
        }
      });
      // Solo agregar si tiene algún dato
      if (Object.values(rowObj).some(v => v !== '' && v !== null && v !== undefined)) {
        tableData.push(rowObj);
      }
    });

    result[tableId] = tableData;
  });

  return result;
}

function parseValue(val) {
  if (val === '') return '';
  if (val === 'true') return true;
  if (val === 'false') return false;
  // Si parece número y no empieza con 0 a menos que sea 0 o decimal
  if (!isNaN(val) && !isNaN(parseFloat(val))) {
    // Preservar códigos con guiones o ceros a la izquierda como string
    if (typeof val === 'string' && val.length > 1 && val.startsWith('0') && !val.includes('.')) {
      return val;
    }
    return Number(val);
  }
  return val;
}

/**
 * Muestra el modal con el JSON formateado listo para el equipo de backend
 */
function showJsonModal(title, jsonData) {
  let modal = document.getElementById('jsonModal');
  if (!modal) {
    createJsonModal();
    modal = document.getElementById('jsonModal');
  }

  document.getElementById('modalTitle').textContent = title || 'Carga Útil de Datos (Payload JSON para Backend)';
  const viewer = document.getElementById('jsonViewerContent');
  viewer.textContent = JSON.stringify(jsonData, null, 2);

  modal.classList.add('active');
}

function closeJsonModal() {
  const modal = document.getElementById('jsonModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function copyJsonToClipboard() {
  const content = document.getElementById('jsonViewerContent').textContent;
  navigator.clipboard.writeText(content).then(() => {
    alert('Estructura de datos JSON copiada al portapapeles correctamente.');
  }).catch(() => {
    alert('No fue posible copiar al portapapeles. Seleccione el texto y copie manualmente.');
  });
}

function downloadJsonFile(filename) {
  const content = document.getElementById('jsonViewerContent').textContent;
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'formulario_datos.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createJsonModal() {
  const modalHtml = `
    <div id="jsonModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h4 id="modalTitle">Payload JSON</h4>
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeJsonModal()">Cerrar</button>
        </div>
        <div class="modal-body">
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">
            Estructura estandarizada generada a partir del formulario, lista para consumo en API REST o base de datos.
          </p>
          <pre id="jsonViewerContent" class="json-viewer"></pre>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" onclick="downloadJsonFile()">Descargar .json</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="copyJsonToClipboard()">Copiar al Portapapeles</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/* ==========================================================================
   MOTOR DE ITERACIONES DEL PROCESO DE EVALUACIÓN
   --------------------------------------------------------------------------
   El proceso de evaluación es iterativo:
     1) Registro de la iniciativa   -> 2) Evaluación y resultados -> 3) Ficha PDF
   Cuando el resultado exige observaciones, el postulante responde y la
   iniciativa vuelve a evaluación. Instancias formales del ciclo:
     PRIMER_INGRESO            (todas las líneas)
     RESPONDE_OBSERVACIONES    (todas las líneas)
     REEVALUACION              (Circular 33, < 5.000 UTM y Programas)
   ========================================================================== */

const AppIteracion = {

  CLAVES: ['PRIMER_INGRESO', 'RESPONDE_OBSERVACIONES', 'REEVALUACION'],

  ETIQUETAS: {
    PRIMER_INGRESO: 'Primer Ingreso',
    RESPONDE_OBSERVACIONES: 'Responde Observaciones',
    REEVALUACION: 'Reevaluación'
  },

  /**
   * Normaliza una etiqueta visible a clave técnica: "Reevaluación" -> REEVALUACION.
   * Se eliminan tildes y se convierten los espacios en guiones bajos, porque las
   * claves del modelo no llevan diacríticos.
   */
  normalizar(valor) {
    return String(valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  },

  /** Convierte la etiqueta visible ("Primer Ingreso") a clave técnica. */
  claveDesdeValor(valor) {
    const normalizado = this.normalizar(valor);
    return this.CLAVES.includes(normalizado) ? normalizado : 'PRIMER_INGRESO';
  },

  /** Número de iteración que corresponde a cada instancia. */
  numeroDe(clave) {
    if (clave === 'RESPONDE_OBSERVACIONES') return 2;
    if (clave === 'REEVALUACION') return 3;
    return 1;
  },

  /** Instancia seleccionada según la configuración declarativa del selector. */
  actual(selectorId) {
    const cfg = this.config(selectorId);
    const sel = document.querySelector('input[name="' + cfg.nombre + '"]:checked');
    return this.claveDesdeValor(sel ? sel.value : 'Primer Ingreso');
  },

  /** Lee la configuración declarativa (data-*) del contenedor del selector. */
  config(selectorId) {
    const el = document.getElementById(selectorId || 'selectorInstancia');
    if (!el) return { nombre: 'instancia_evaluacion', permiteReevaluacion: false };
    return {
      nombre: el.dataset.nombreCampo || 'instancia_evaluacion',
      permiteReevaluacion: el.dataset.permiteReevaluacion === 'true',
      bloqueRespuesta: el.dataset.bloqueRespuesta || '',
      bloqueReevaluacion: el.dataset.bloqueReevaluacion || '',
      campoIteracion: el.dataset.campoIteracion || '',
      tagsPrint: (el.dataset.tagPrint || '').split(',').map(t => t.trim()).filter(Boolean),
      tagsIteracion: (el.dataset.tagIteracion || '').split(',').map(t => t.trim()).filter(Boolean),
      pasoEvaluacion: el.dataset.pasoEvaluacion || ''
    };
  },

  /**
   * Aplica la instancia seleccionada: muestra/oculta los bloques propios de
   * cada instancia, fija el número de iteración y actualiza las etiquetas de
   * la ficha imprimible. Es idempotente y no dispara la actualización de la
   * ficha, para evitar ciclos de actualización recursivos.
   */
  aplicar(selectorId) {
    const cfg = this.config(selectorId);
    const clave = this.actual(selectorId);
    const etiqueta = this.ETIQUETAS[clave];
    const numero = this.numeroDe(clave);

    // Bloques condicionales de la evaluación
    this.mostrarElemento(cfg.bloqueRespuesta, clave !== 'PRIMER_INGRESO');
    this.mostrarElemento(
      cfg.bloqueReevaluacion,
      cfg.permiteReevaluacion && clave === 'REEVALUACION'
    );

    // La instancia "Reevaluación" no existe en líneas sin iteración técnica
    if (!cfg.permiteReevaluacion) {
      document.querySelectorAll('input[name="' + cfg.nombre + '"]').forEach(radio => {
        if (this.normalizar(radio.value) === 'REEVALUACION') {
          const opcion = radio.closest('.instancia-option');
          if (opcion) opcion.style.display = 'none';
        }
      });
    }

    // Número de iteración
    if (cfg.campoIteracion) {
      const campo = document.getElementById(cfg.campoIteracion);
      if (campo && !campo.dataset.editado) campo.value = numero;
    }

    // Etiquetas de la ficha oficial
    cfg.tagsPrint.forEach(id => {
      const tag = document.getElementById(id);
      if (tag) tag.textContent = etiqueta.toUpperCase();
    });
    cfg.tagsIteracion.forEach(id => {
      const tag = document.getElementById(id);
      if (tag) tag.textContent = 'N° ' + numero;
    });
  },

  mostrarElemento(id, visible) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
  },

  /** Fija la instancia y refresca la ficha llamando al actualizador de la página. */
  establecer(clave, actualizarFn) {
    const cfg = this.config();
    const etiqueta = this.ETIQUETAS[clave] || clave;
    const radio = document.querySelector('input[name="' + cfg.nombre + '"][value="' + etiqueta + '"]');
    if (radio) radio.checked = true;
    if (typeof actualizarFn === 'function') actualizarFn();
  },

  /** Indica si un estado de evaluación obliga a abrir una nueva iteración. */
  exigeIteracion(estado) {
    if (!estado) return false;
    return /OBSERV/i.test(estado);
  },

  /**
   * Calcula la instancia siguiente a partir del estado de la evaluación actual.
   * Returns null cuando el proceso termina en esta iteración.
   */
  siguiente(estado, instanciaActual, selectorId) {
    const cfg = this.config(selectorId);
    if (this.exigeIteracion(estado)) return 'RESPONDE_OBSERVACIONES';
    if (instanciaActual === 'RESPONDE_OBSERVACIONES' && cfg.permiteReevaluacion) return 'REEVALUACION';
    return null;
  },

  /**
   * Avanza a la siguiente instancia del ciclo de iteración y deja el formulario
   * en el paso de evaluación, listo para el registro del nuevo resultado.
   */
  avanzar(estado, opciones) {
    const cfg = this.config(opciones.selectorId);
    const actual = this.actual(opciones.selectorId);
    const siguiente = this.siguiente(estado, actual, opciones.selectorId);

    if (!siguiente) {
      alert('El estado actual de la evaluación no genera una nueva instancia:\n' +
        'el proceso finaliza en esta iteración con la emisión de la ficha oficial.');
      return null;
    }

    this.establecer(siguiente, opciones.actualizar);
    if (cfg.pasoEvaluacion && typeof opciones.irAlPaso === 'function') {
      opciones.irAlPaso('evaluacion');
    }
    alert('Instancia activada: ' + this.ETIQUETAS[siguiente] + ' (iteración N° ' + this.numeroDe(siguiente) + ').\n' +
      'Registre en el paso de evaluación el resultado de esta nueva instancia.');
    return siguiente;
  }
};

/* ==========================================================================
   CONSTRUCCIÓN DEL PAYLOAD DE EVALUACIÓN
   ========================================================================== */

/**
 * Serializa el formulario y agrega el bloque "proceso" con la trazabilidad
 * de la iteración en curso, que no puede obtenerse sólo del FormData porque el
 * selector de instancia vive fuera del formulario.
 */
function serializarEvaluacion(formId, opciones) {
  const form = document.getElementById(formId);
  if (!form) return {};
  const data = serializeForm(form);
  const cfg = AppIteracion.config(opciones.selectorId);
  const clave = AppIteracion.actual(opciones.selectorId);

  data.proceso = {
    modelo: opciones.modelo,
    linea_evaluacion: opciones.linea,
    instancia_evaluacion: AppIteracion.ETIQUETAS[clave],
    clave_instancia: clave,
    numero_iteracion: parseInt(document.getElementById(cfg.campoIteracion)?.value, 10) || AppIteracion.numeroDe(clave),
    admite_reevaluacion: cfg.permiteReevaluacion,
    iteraciones_registradas: Array.isArray(data.iteraciones) ? data.iteraciones.length : 0
  };

  return data;
}

/* ==========================================================================
   HISTORIAL DE ITERACIONES EN LA FICHA IMPRIMIBLE
   ========================================================================== */

/**
 * Pinta en la ficha oficial la tabla de historial de iteraciones leída desde
 * la tabla dinámica del formulario, agregando la iteración en curso.
 *
 * @param {string} tablaOrigenId  Tabla del formulario con data-table-row
 * @param {string} tbodyDestinoId  tbody de la tabla en la ficha oficial
 * @param {Array}  columnas        [{ campo, label, ancho }]
 * @param {object} iteracionActual { fila en curso a resaltar }
 */
function renderHistorialIteraciones(tablaOrigenId, tbodyDestinoId, columnas, iteracionActual) {
  const destino = document.getElementById(tbodyDestinoId);
  if (!destino) return;

  const origen = document.getElementById(tablaOrigenId);
  let html = '';

  if (origen) {
    origen.querySelectorAll('tbody tr[data-table-row]').forEach(fila => {
      const datos = columnas.map(col => {
        const valor = fila.querySelector('[data-field="' + col.campo + '"]')?.value;
        return valor || '-';
      });
      // Se omiten las filas de historial que el funcionario aún no ha llenado.
      if (datos.every(v => v === '-')) return;
      html += '<tr>' + datos.map(v => `<td>${v}</td>`).join('') + '</tr>';
    });
  }

  if (iteracionActual && iteracionActual.valores) {
    const celdas = columnas.map(col => {
      const valor = iteracionActual.valores[col.campo];
      return `<td>${valor || '-'}</td>`;
    }).join('');
    html += `<tr class="fila-iteracion-actual">${celdas}</tr>`;
  }

  destino.innerHTML = html || '<tr><td colspan="' + columnas.length + '">Sin iteraciones registradas.</td></tr>';
}

/**
 * Crea la fila de la iteración en curso a partir de los campos de la página.
 * Los identificadores se resuelven con el prefijo de cada formulario.
 */
function filaIteracionActual(cfg) {
  const getVal = id => (document.getElementById(id)?.value || '').trim();
  const clave = AppIteracion.actual(cfg.selectorId);
  return {
    clave: clave,
    valores: {
      numero: getVal(cfg.campoIteracion) || AppIteracion.numeroDe(clave),
      fecha: getVal(cfg.campoFecha),
      instancia: AppIteracion.ETIQUETAS[clave],
      estado: getVal(cfg.campoEstado),
      detalle: cfg.campoDetalle ? getVal(cfg.campoDetalle).replace(/\s+/g, ' ').slice(0, 160) : ''
    }
  };
}

/* ==========================================================================
   IMPRESIÓN DE LA FICHA OFICIAL
   ========================================================================== */

/**
 * Deja visible únicamente la ficha oficial antes de invocar al diálogo de
 * impresión, ocultando los pasos de captura de datos que interferirían en el
 * documento impreso.
 */
function mostrarSoloFicha(idsPaso, idFicha) {
  (idsPaso || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const ficha = document.getElementById(idFicha);
  if (ficha) ficha.style.display = 'block';
}

/* ==========================================================================
   Cálculos automáticos de totales en tablas financieras
   ========================================================================== */
function initAutoCalculations() {
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-calc-col]') || e.target.matches('[data-calc-row]')) {
      const table = e.target.closest('table');
      if (table) {
        recalculateTable(table);
      }
    }

    // Auto-cálculo de beneficiarios (H + M = Total)
    if (e.target.id === 'beneficiarios_hombres' || e.target.id === 'beneficiarios_mujeres') {
      const h = parseFloat(document.getElementById('beneficiarios_hombres')?.value) || 0;
      const m = parseFloat(document.getElementById('beneficiarios_mujeres')?.value) || 0;
      const totInput = document.getElementById('beneficiarios_total');
      if (totInput) totInput.value = (h + m);
    }
  });
}

function recalculateTable(table) {
  const rows = table.querySelectorAll('tbody tr[data-table-row]');

  // 1. Recalcular cada fila (por ejemplo Costo Total = Solicitado Año + Solicitado Siguiente + Saldo)
  rows.forEach(row => {
    const colAno = parseFloat(row.querySelector('[data-field="solicitado_ano_actual"]')?.value) || 0;
    const colSig = parseFloat(row.querySelector('[data-field="solicitado_ano_siguiente"]')?.value) || 0;
    const colSaldo = parseFloat(row.querySelector('[data-field="saldo_por_invertir"]')?.value) || 0;

    const totalRowCell = row.querySelector('[data-field="costo_total"]');
    if (totalRowCell && totalRowCell.classList.contains('auto-calc')) {
      totalRowCell.value = (colAno + colSig + colSaldo).toFixed(0);
    }
  });

  // 2. Recalcular Fila de Totales del pie de tabla
  const sumCols = ['solicitado_ano_actual', 'solicitado_ano_siguiente', 'saldo_por_invertir', 'costo_total', 'pagado_acumulado'];
  sumCols.forEach(colKey => {
    let sum = 0;
    rows.forEach(row => {
      const val = parseFloat(row.querySelector(`[data-field="${colKey}"]`)?.value) || 0;
      sum += val;
    });
    const totalFooterCell = table.querySelector(`[data-total-for="${colKey}"]`);
    if (totalFooterCell) {
      totalFooterCell.textContent = sum.toLocaleString('es-CL');
    }
  });
}

/**
 * Gestión de filas dinámicas (Agregar / Eliminar)
 */
function addTableRow(tableId, templateRowHtml) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector('tbody');
  tbody.insertAdjacentHTML('beforeend', templateRowHtml);
  recalculateTable(table);
}

function removeTableRow(btnElement) {
  const row = btnElement.closest('tr');
  const table = row.closest('table');
  row.remove();
  if (table) recalculateTable(table);
}
