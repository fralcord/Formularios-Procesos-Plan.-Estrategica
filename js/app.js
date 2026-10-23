/**
 * ============================================================================
 * UTILIDADES COMUNES Y CONTROLADOR CLIENTE DE FORMULARIOS
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initAutoCalculations();
  initCurrencyInputs();
});

/**
 * Serializa cualquier formulario HTML en un objeto plano y estructurado.
 * Lee todos los campos con atributo 'name', estructurando objetos anidados
 * mediante puntos (ej: "responsable.nombre" -> { responsable: { nombre: '...' } })
 * y recolectando filas de tablas marcadas con 'data-table-row'.
 */
function serializeForm(formElement) {
  const formData = new FormData(formElement);
  const result = {};
  const currencyFields = new Set(
    [...formElement.querySelectorAll('[data-format-currency][name]')].map(input => input.name)
  );

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
      current[parts[parts.length - 1]] = currencyFields.has(key)
        ? parseCurrencyValue(value)
        : parseValue(value);
    } else {
      result[key] = currencyFields.has(key) ? parseCurrencyValue(value) : parseValue(value);
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
          rowObj[fieldName] = fieldName === 'registro' && input.value
            ? JSON.parse(input.value)
            : input.hasAttribute('data-format-currency')
              ? parseCurrencyValue(input.value)
              : parseValue(input.value);
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

function parseCurrencyValue(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits) : '';
}

function formatCurrencyInThousands(value) {
  const pesos = parseCurrencyValue(value);
  if (pesos === '') return '-';
  return (pesos / 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 });
}

let contadorClavesFinanciamiento = 0;

function claveFilaFinanciamiento(fila) {
  if (!fila.dataset.evalKey) fila.dataset.evalKey = `fin_${++contadorClavesFinanciamiento}`;
  return fila.dataset.evalKey;
}

/**
 * Mantiene el cuadro editable de Evaluación y sus Resultados a partir de las
 * partidas del Registro de la Iniciativa. Cada partida conserva lo presentado
 * (solo lectura) y permite confirmar o modificar lo recomendado. Si la partida
 * aún no fue editada, lo recomendado sigue a lo presentado.
 * Retorna las partidas recomendadas y los totales presentado/recomendado.
 */
function sincronizarEvaluacionFinanciamiento({ cuerpoId, lineas, presentadoId, recomendadoId, alCambiar }) {
  const cuerpo = document.getElementById(cuerpoId);
  const tabla = cuerpo?.closest('table');
  const presentadoEl = document.getElementById(presentadoId);
  const recomendadoEl = document.getElementById(recomendadoId);
  if (!cuerpo || !tabla || !presentadoEl || !recomendadoEl) {
    throw new Error('No se pudo sincronizar el cuadro de financiamiento de la evaluación.');
  }
  const formato = n => Number(n || 0).toLocaleString('es-CL');
  const existentes = new Map(Array.from(cuerpo.children, fila => [fila.dataset.evalKey, fila]));
  const campo = (fila, nombre) => fila.querySelector(`[data-field="${nombre}"]`);

  const crearFila = clave => {
    const fila = document.createElement('tr');
    fila.setAttribute('data-table-row', '');
    fila.dataset.evalKey = clave;
    const celdaTexto = nombre => {
      const td = document.createElement('td');
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.dataset.field = nombre;
      const span = document.createElement('span');
      span.dataset.texto = nombre;
      td.append(span, hidden);
      return td;
    };
    const celdaMonto = (nombre, editable) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.dataset.field = nombre;
      input.dataset.formatCurrency = 'true';
      if (editable) {
        input.type = 'text';
        input.className = 'form-control';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.setAttribute('aria-label', nombre === 'recomendado_ano_actual'
          ? 'Monto recomendado año actual en pesos'
          : 'Monto recomendado año siguiente en pesos');
        input.addEventListener('input', () => {
          formatPesosInput(input);
          input.dataset.editado = 'true';
          if (alCambiar) alCambiar();
        });
        td.appendChild(input);
      } else {
        input.type = 'hidden';
        const span = document.createElement('span');
        span.dataset.texto = nombre;
        td.append(span, input);
      }
      return td;
    };
    fila.append(
      celdaTexto('fuente'), celdaTexto('item'), celdaTexto('clasificador'),
      celdaMonto('presentado_ano_actual', false), celdaMonto('presentado_ano_siguiente', false),
      celdaMonto('recomendado_ano_actual', true), celdaMonto('recomendado_ano_siguiente', true),
      celdaMonto('costo_total_presentado', false), celdaMonto('costo_total_recomendado', false)
    );
    return fila;
  };

  const totales = { pa: 0, ps: 0, ra: 0, rs: 0 };
  const recomendadas = [];
  const filas = lineas.map(linea => {
    const fila = existentes.get(linea.clave) || crearFila(linea.clave);
    ['fuente', 'item', 'clasificador'].forEach(nombre => {
      campo(fila, nombre).value = linea[nombre];
      fila.querySelector(`[data-texto="${nombre}"]`).textContent = linea[nombre];
    });
    const fijar = (nombre, valor) => {
      campo(fila, nombre).value = String(valor);
      const span = fila.querySelector(`[data-texto="${nombre}"]`);
      if (span) span.textContent = formato(valor);
    };
    fijar('presentado_ano_actual', linea.actual);
    fijar('presentado_ano_siguiente', linea.siguiente);
    fijar('costo_total_presentado', linea.actual + linea.siguiente);
    const resolver = (nombre, presentado) => {
      const input = campo(fila, nombre);
      if (!input.dataset.editado) input.value = String(presentado);
      formatPesosInput(input);
      return parseCurrencyValue(input.value) || 0;
    };
    const ra = resolver('recomendado_ano_actual', linea.actual);
    const rs = resolver('recomendado_ano_siguiente', linea.siguiente);
    campo(fila, 'costo_total_recomendado').value = String(ra + rs);
    fila.querySelector('[data-texto="costo_total_recomendado"]').textContent = formato(ra + rs);
    totales.pa += linea.actual;
    totales.ps += linea.siguiente;
    totales.ra += ra;
    totales.rs += rs;
    recomendadas.push({ ...linea, actual: ra, siguiente: rs });
    return fila;
  });
  cuerpo.replaceChildren(...filas);

  const pie = { presentado_ano_actual: totales.pa, presentado_ano_siguiente: totales.ps,
    costo_total_presentado: totales.pa + totales.ps, recomendado_ano_actual: totales.ra,
    recomendado_ano_siguiente: totales.rs, costo_total_recomendado: totales.ra + totales.rs };
  Object.entries(pie).forEach(([nombre, valor]) => {
    const celda = tabla.querySelector(`[data-eval-total="${nombre}"]`);
    if (celda) celda.textContent = formato(valor);
  });
  presentadoEl.textContent = `$${formato(totales.pa + totales.ps)}`;
  recomendadoEl.textContent = `$${formato(totales.ra + totales.rs)}`;
  return { lineas: recomendadas, presentado: totales.pa + totales.ps, recomendado: totales.ra + totales.rs };
}

function renderizarFilasFichaFinanciamiento(cuerpo, lineas, formatoM) {
  cuerpo.replaceChildren(...lineas.map(linea => {
    const fila = document.createElement('tr');
    [linea.fuente, linea.item, linea.clasificador, formatoM(linea.actual),
      formatoM(linea.siguiente), formatoM(linea.actual + linea.siguiente)].forEach(texto => {
      const celda = document.createElement('td');
      celda.textContent = texto;
      fila.appendChild(celda);
    });
    return fila;
  }));
}

function calcularCostoTotalRecomendado(data) {
  return Math.round((data.fuentes_financiamiento_evaluacion || []).reduce((total, fuente) =>
    total + Number(fuente.costo_total_recomendado || 0), 0
  ));
}
function calcularCostoTotalPresentado(data) {
  return Math.round((data.fuentes_financiamiento || []).reduce((total, fuente) =>
    total + Number(fuente.solicitado_ano_actual || 0) +
      Number(fuente.solicitado_ano_siguiente || 0), 0
  ));
}

function formatPesosInput(input) {
  const rawValue = String(input.value);
  const digitsBeforeCursor = rawValue.slice(0, input.selectionStart ?? rawValue.length).replace(/\D/g, '').length;
  const digits = rawValue.replace(/\D/g, '');
  const formatted = digits
    ? Number(digits).toLocaleString('es-CL', { maximumFractionDigits: 0 })
    : '';

  if (formatted !== rawValue) {
    input.value = formatted;
    let cursor = 0;
    let digitsPassed = 0;
    while (cursor < formatted.length && digitsPassed < digitsBeforeCursor) {
      if (/\d/.test(formatted[cursor])) digitsPassed++;
      cursor++;
    }
    input.setSelectionRange(cursor, cursor);
  }
}

function initCurrencyInputs() {
  document.querySelectorAll('[data-format-currency]').forEach(input => {
    formatPesosInput(input);
    input.addEventListener('input', () => formatPesosInput(input));
    input.addEventListener('blur', () => formatPesosInput(input));
  });
}

function configurarFechasDesdePostulacion(formId, fechaPostulacionId) {
  const form = document.getElementById(formId);
  const fechaPostulacion = document.getElementById(fechaPostulacionId);
  if (!form || !fechaPostulacion) {
    throw new Error(`No se pudo configurar la fecha mínima para ${formId}.`);
  }

  const actualizarRestricciones = () => {
    const minimo = fechaPostulacion.value;
    form.querySelectorAll('input[type="date"]').forEach(input => {
      if (input === fechaPostulacion) return;
      if (minimo) input.min = minimo;
      else input.removeAttribute('min');
      input.setCustomValidity(
        minimo && input.value && input.value < minimo
          ? 'La fecha no puede ser anterior a la fecha del oficio de postulación.'
          : ''
      );
    });
  };

  form.addEventListener('input', actualizarRestricciones);
  form.addEventListener('change', actualizarRestricciones);
  form.addEventListener('reset', () => setTimeout(actualizarRestricciones, 0));
  actualizarRestricciones();
}

function validarFechasDesdePostulacion(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  const fechaInvalida = form.querySelector('input[type="date"]:invalid');
  if (fechaInvalida) {
    fechaInvalida.reportValidity();
    return false;
  }
  return true;
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
     REEVALUACION              (Circular 33, Menores a 5.000 UTM y Programas)
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

  /** Ordinal mínimo asociado a una instancia para casos sin historial previo. */
  numeroDe(clave) {
    if (clave === 'RESPONDE_OBSERVACIONES') return 2;
    if (clave === 'REEVALUACION') return 3;
    return 1;
  },

  /** Cuenta las iteraciones anteriores con fecha registrada en el historial. */
  iteracionesPreviasConFecha(selectorId) {
    const cfg = this.config(selectorId);
    const tabla = document.getElementById(cfg.tablaIteraciones);
    return tabla
      ? Array.from(tabla.querySelectorAll('tbody tr[data-table-row]'))
        .filter(fila => Boolean(fila.querySelector('[data-field="fecha"]')?.value.trim())).length
      : 0;
  },

  /** Deriva el ordinal del historial fechado, sin quedar bajo el mínimo de la instancia. */
  numeroActual(selectorId) {
    return Math.max(
      this.numeroDe(this.actual(selectorId)),
      this.iteracionesPreviasConFecha(selectorId) + 1
    );
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
      tablaIteraciones: el.dataset.tablaIteraciones || '',
      panelEvaluacion: el.dataset.panelEvaluacion || '',
      campoEstado: el.dataset.campoEstado || '',
      campoFecha: el.dataset.campoFecha || '',
      campoDetalle: el.dataset.campoDetalle || '',
      pasoEvaluacion: el.dataset.pasoEvaluacion || ''
    };
  },

  /**
   * Aplica la instancia seleccionada y deriva el número de iteración desde el
   * historial fechado. Es idempotente y no dispara la actualización de la ficha.
   */
  aplicar(selectorId) {
    const cfg = this.config(selectorId);
    const clave = this.actual(selectorId);
    const etiqueta = this.ETIQUETAS[clave];
    const numero = this.numeroActual(selectorId);

    // La instancia "Reevaluación" no existe en líneas sin iteración técnica
    if (!cfg.permiteReevaluacion) {
      document.querySelectorAll('input[name="' + cfg.nombre + '"]').forEach(radio => {
        if (this.normalizar(radio.value) === 'REEVALUACION') {
          const opcion = radio.closest('.instancia-option');
          if (opcion) opcion.style.display = 'none';
        }
      });
    }

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
    if (!this.exigeIteracion(estado)) return null;
    if (instanciaActual === 'PRIMER_INGRESO') return 'RESPONDE_OBSERVACIONES';
    if (instanciaActual === 'RESPONDE_OBSERVACIONES' && cfg.permiteReevaluacion) return 'REEVALUACION';
    if (instanciaActual === 'REEVALUACION' || !cfg.permiteReevaluacion) return 'RESPONDE_OBSERVACIONES';
    return null;
  },

  /** Controles de la etapa actual que forman parte del registro de evaluación. */
  controlesEtapa(selectorId) {
    const cfg = this.config(selectorId);
    const panel = document.getElementById(cfg.panelEvaluacion);
    if (!panel) return [];

    return Array.from(panel.querySelectorAll('input[name], select[name], textarea[name]'))
      .filter(campo => !campo.closest('table'));
  },

  /** Valida los campos requeridos y la secuencia cronológica antes del cierre. */
  validarEtapa(selectorId) {
    const cfg = this.config(selectorId);
    const controles = this.controlesEtapa(selectorId);
    const requeridosInvalidos = controles.filter(campo =>
      campo.required && !campo.checkValidity()
    );
    if (requeridosInvalidos.length) {
      requeridosInvalidos[0].reportValidity();
      return false;
    }

    const fechaActual = document.getElementById(cfg.campoFecha)?.value;
    const fechasPrevias = Array.from(
      document.getElementById(cfg.tablaIteraciones)?.querySelectorAll('tbody [data-field="fecha"]') || []
    ).map(campo => campo.value).filter(Boolean).sort();
    const fechaAnterior = fechasPrevias[fechasPrevias.length - 1];
    if (fechaAnterior && fechaActual < fechaAnterior) {
      const campoFecha = document.getElementById(cfg.campoFecha);
      campoFecha?.setCustomValidity('La fecha debe ser igual o posterior a la última iteración registrada.');
      campoFecha?.reportValidity();
      campoFecha?.setCustomValidity('');
      return false;
    }
    return true;
  },

  /** Copia la etapa cerrada al historial, incluida la captura completa de sus campos. */
  archivarEtapa(selectorId) {
    const cfg = this.config(selectorId);
    const tabla = document.getElementById(cfg.tablaIteraciones);
    const cuerpo = tabla?.querySelector('tbody');
    if (!cuerpo) {
      throw new Error('No se encontró el historial de iteraciones para archivar la evaluación.');
    }

    const clave = this.actual(selectorId);
    const numero = this.numeroActual(selectorId);
    const fecha = document.getElementById(cfg.campoFecha)?.value || '';
    const estado = document.getElementById(cfg.campoEstado)?.value || '';
    const detalle = document.getElementById(cfg.campoDetalle)?.value.trim() || '';
    const campos = this.controlesEtapa(selectorId).map(campo => ({
      nombre: campo.name,
      valor: campo.type === 'checkbox' || campo.type === 'radio' ? campo.checked : campo.value
    }));
    const registro = {
      numero,
      fecha,
      instancia: this.ETIQUETAS[clave],
      clave_instancia: clave,
      estado,
      campos
    };

    cuerpo.querySelectorAll('tr[data-table-row]').forEach(fila => {
      const tieneDatos = Array.from(fila.querySelectorAll('[data-field]'))
        .some(campo => campo.dataset.field !== 'registro' && campo.value.trim());
      if (!tieneDatos) fila.remove();
    });

    const fila = document.createElement('tr');
    fila.dataset.tableRow = '';
    [
      ['numero', numero],
      ['fecha', fecha],
      ['instancia', this.ETIQUETAS[clave]],
      ['estado', estado],
      ['detalle', detalle]
    ].forEach(([campo, valor]) => {
      const celda = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control';
      input.dataset.field = campo;
      input.value = valor;
      input.readOnly = true;
      celda.appendChild(input);
      fila.appendChild(celda);
    });

    const celdaAccion = document.createElement('td');
    const registroOculto = document.createElement('input');
    registroOculto.type = 'hidden';
    registroOculto.dataset.field = 'registro';
    registroOculto.value = JSON.stringify(registro);
    celdaAccion.appendChild(registroOculto);
    fila.appendChild(celdaAccion);
    cuerpo.appendChild(fila);

  },

  /** Limpia los campos de captura del paso de evaluación para la instancia nueva. */
  limpiarEtapa(selectorId) {
    const cfg = this.config(selectorId);
    const panel = document.getElementById(cfg.panelEvaluacion);
    if (!panel) return;
    panel.querySelectorAll('input[name], select[name], textarea[name]').forEach(campo => {
      if (campo.closest('table')) return;
      if (campo.type === 'checkbox' || campo.type === 'radio') {
        campo.checked = false;
      } else if (campo.tagName === 'SELECT') {
        campo.value = '';
      } else {
        campo.value = '';
      }
      campo.setCustomValidity('');
    });
    document.getElementById(cfg.campoEstado)?.dispatchEvent(new Event('change', { bubbles: true }));
  },

  /**
   * Avanza a la siguiente instancia del ciclo de iteración y deja el formulario
   * en el paso de evaluación, listo para el registro del nuevo resultado.
   */
  avanzar(estado, opciones) {
    const cfg = this.config(opciones.selectorId);
    const actual = this.actual(opciones.selectorId);
    if (!this.validarEtapa(opciones.selectorId)) return null;
    const siguiente = this.siguiente(estado, actual, opciones.selectorId);

    if (!siguiente) {
      alert('El estado actual de la evaluación no genera una nueva instancia:\n' +
        'el proceso finaliza en esta iteración con la emisión de la ficha oficial.');
      return null;
    }

    this.archivarEtapa(opciones.selectorId);
    this.limpiarEtapa(opciones.selectorId);
    this.establecer(siguiente, opciones.actualizar);
    if (cfg.pasoEvaluacion && typeof opciones.irAlPaso === 'function') {
      opciones.irAlPaso('evaluacion');
    }
    alert('Instancia activada: ' + this.ETIQUETAS[siguiente] + ' (iteración N° ' + this.numeroActual(opciones.selectorId) + ').\n' +
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
    numero_iteracion: AppIteracion.numeroActual(opciones.selectorId),
    admite_reevaluacion: cfg.permiteReevaluacion,
    iteraciones_registradas: AppIteracion.iteracionesPreviasConFecha(opciones.selectorId)
  };

  return data;
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
