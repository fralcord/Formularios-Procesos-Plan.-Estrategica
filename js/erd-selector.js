(function () {
  const crear = (etiqueta, clase, texto) => {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };
  const unicos = lista => [...new Set(lista.filter(Boolean))];
  const instancias = {};

  function obtener(id) {
    const elemento = document.getElementById(id);
    if (!elemento) throw new Error(`No se encontró el elemento "${id}".`);
    return elemento;
  }

  // Sección desplegable opcional con selección múltiple; solo el botón de confirmación la cierra.
  function crearSeccion(opciones) {
    const { prefijo, titulo, etiquetaEje, ayuda, datos, campos, textoItem, claveItem, pintarEje, actualizar } = opciones;
    const estado = { items: [], confirmado: false };

    const detalle = crear('details', 'erd-details');
    detalle.id = `${prefijo}Detalle`;

    const resumen = crear('summary', 'erd-summary');
    resumen.append(crear('span', 'erd-summary-title', titulo), ' ', crear('span', 'erd-summary-optional', '(opcional)'));
    const check = crear('span', 'erd-summary-check', '\u2713');
    check.setAttribute('aria-label', `${titulo} confirmado`);
    check.hidden = true;
    resumen.append(check);

    const contenido = crear('div', 'erd-articulacion-content');
    const panelControl = crear('div', 'erd-control-panel');
    const etiqueta = crear('label', 'form-label', etiquetaEje);
    etiqueta.htmlFor = `${prefijo}Eje`;
    const select = crear('select', 'form-control');
    select.id = `${prefijo}Eje`;
    select.append(new Option('-- Seleccione un eje --', ''));
    datos.forEach((dato, i) => select.append(new Option(dato.eje, String(i))));
    panelControl.append(etiqueta, select, crear('p', 'form-hint', ayuda));

    const esquema = crear('div', 'erd-esquema');
    esquema.hidden = true;
    const cuerpoEje = crear('div', 'erd-eje-body');
    esquema.append(cuerpoEje);

    const barra = crear('div', 'erd-selection');
    barra.setAttribute('role', 'status');
    const barraTitulo = crear('strong', '', 'Selección activa (0):');
    const lista = crear('ul', 'erd-chip-list');
    barra.append(barraTitulo, lista);
    barra.hidden = true;

    const acciones = crear('div', 'erd-actions');
    const confirmar = crear('button', 'btn btn-primary erd-confirm', 'Confirmar selección');
    confirmar.type = 'button';
    confirmar.disabled = true;
    const limpiar = crear('button', 'btn btn-secondary erd-clear', 'Limpiar selección');
    limpiar.type = 'button';
    limpiar.disabled = true;
    acciones.append(confirmar, limpiar);

    contenido.append(panelControl, esquema, barra, acciones);
    detalle.append(resumen, contenido);

    function sincronizar(notificar = true) {
      cuerpoEje.querySelectorAll('[data-key]').forEach(boton => {
        const activo = estado.items.some(item => item.key === boton.dataset.key);
        boton.classList.toggle('is-selected', activo);
        boton.setAttribute('aria-pressed', String(activo));
      });
      lista.replaceChildren();
      estado.items.forEach(item => {
        const chip = crear('li', 'erd-chip');
        chip.append(crear('span', '', textoItem(item)));
        const quitar = crear('button', 'erd-chip-remove', '\u00d7');
        quitar.type = 'button';
        quitar.setAttribute('aria-label', `Quitar ${textoItem(item)}`);
        quitar.addEventListener('click', () => alternar(item));
        chip.append(quitar);
        lista.append(chip);
      });
      barraTitulo.textContent = `Selección activa (${estado.items.length}):`;
      barra.hidden = estado.items.length === 0;
      confirmar.disabled = estado.items.length === 0;
      limpiar.disabled = estado.items.length === 0;
      check.hidden = !(estado.confirmado && estado.items.length > 0);
      actualizar(estado.items, campos);
      if (notificar) Object.values(campos)[0].dispatchEvent(new Event('input', { bubbles: true }));
    }

    function alternar(item) {
      const indice = estado.items.findIndex(existente => existente.key === item.key);
      if (indice >= 0) estado.items.splice(indice, 1);
      else estado.items.push(item);
      estado.confirmado = false;
      sincronizar();
    }

    select.addEventListener('change', () => {
      cuerpoEje.replaceChildren();
      if (select.value === '') {
        esquema.hidden = true;
        return;
      }
      const indice = Number(select.value);
      pintarEje(datos[indice], indice, cuerpoEje, alternar);
      esquema.hidden = false;
      sincronizar(false);
    });

    confirmar.addEventListener('click', () => {
      if (!estado.items.length) return;
      estado.confirmado = true;
      detalle.open = false;
      sincronizar(false);
    });

    limpiar.addEventListener('click', () => {
      estado.items = [];
      estado.confirmado = false;
      sincronizar();
    });

    function reiniciar() {
      estado.items = [];
      estado.confirmado = false;
      select.value = '';
      select.dispatchEvent(new Event('change'));
      detalle.open = false;
      sincronizar();
    }

    function seleccionar(claves) {
      claves.forEach(clave => {
        select.value = String(clave[0]);
        select.dispatchEvent(new Event('change'));
        const boton = cuerpoEje.querySelector(`[data-key="${claveItem(clave)}"]`);
        if (!boton) throw new Error('No se pudo establecer la selección solicitada.');
        if (boton.getAttribute('aria-pressed') !== 'true') boton.click();
      });
    }

    return { detalle, confirmar, reiniciar, seleccionar };
  }

  const pintarERD = (eje, indiceEje, cuerpo, alternar) => {
    cuerpo.append(
      crear('h4', 'erd-section-title', 'Objetivo General'),
      crear('p', 'erd-objective', eje.objetivo_general),
      crear('h4', 'erd-section-title erd-objectives-title', 'Objetivos Específicos / Actividades (puede marcar más de una)')
    );
    const lista = crear('div', 'erd-sector-list');
    eje.sectores.forEach((sector, indiceSector) => {
      const fila = crear('div', 'erd-sector-row');
      const conector = crear('span', 'erd-sector-connector', '\u279c');
      conector.setAttribute('aria-hidden', 'true');
      const actividades = crear('ul', 'erd-activity-list');
      sector.actividades.forEach((actividad, indiceActividad) => {
        const li = document.createElement('li');
        const boton = crear('button', 'erd-activity-button', actividad);
        boton.type = 'button';
        boton.dataset.key = `${indiceEje}|${indiceSector}|${indiceActividad}`;
        boton.setAttribute('aria-pressed', 'false');
        boton.addEventListener('click', () => alternar({
          key: boton.dataset.key,
          eje: eje.eje,
          sector: sector.nombre,
          objetivo: eje.objetivo_general,
          actividad
        }));
        li.append(boton);
        actividades.append(li);
      });
      fila.append(crear('div', 'erd-sector-name', sector.nombre), conector, actividades);
      lista.append(fila);
    });
    cuerpo.append(lista);
  };

  const pintarGobernador = (eje, indiceEje, cuerpo, alternar) => {
    cuerpo.append(crear('h4', 'erd-section-title', `${eje.eje} (puede marcar más de una)`));
    const lista = crear('ul', 'gob-concept-list');
    eje.conceptos.forEach((concepto, indiceConcepto) => {
      const li = document.createElement('li');
      const boton = crear('button', 'gob-concept-button');
      boton.type = 'button';
      boton.dataset.key = `${indiceEje}|${indiceConcepto}`;
      boton.setAttribute('aria-pressed', 'false');
      const texto = crear('span', 'gob-concept-text');
      texto.append(crear('strong', '', concepto.titulo), crear('span', 'gob-concept-desc', concepto.desc));
      boton.append(crear('span', 'gob-concept-letter', `${concepto.letra})`), texto);
      boton.addEventListener('click', () => alternar({
        key: boton.dataset.key,
        eje: eje.eje,
        letra: concepto.letra,
        titulo: concepto.titulo,
        desc: concepto.desc
      }));
      li.append(boton);
      lista.append(li);
    });
    cuerpo.append(lista);
  };

  window.configurarArticulacion = function (config) {
    const datosERD = window.datosRegionalesERD5000;
    const datosGob = window.datosProgramaGobernador;
    if (!Array.isArray(datosERD)) throw new Error('No se pudo cargar la base de datos de la ERD.');
    if (!Array.isArray(datosGob)) throw new Error('No se pudo cargar la base del Programa del Gobernador Regional.');

    const raiz = obtener(config.rootId);
    const campos = grupo => Object.fromEntries(Object.entries(config[grupo]).map(([k, id]) => [k, obtener(id)]));

    const erd = crearSeccion({
      prefijo: `${config.rootId}ERD`,
      titulo: 'Articulación con la ERD',
      etiquetaEje: 'Eje Estratégico de Desarrollo',
      ayuda: 'Seleccione una o más actividades en el diagrama y confirme la selección.',
      datos: datosERD,
      campos: campos('erd'),
      textoItem: item => `${item.sector} · ${item.actividad}`,
      claveItem: ([e, s, a]) => `${e}|${s}|${a}`,
      pintarEje: pintarERD,
      actualizar: (items, c) => {
        c.lineamiento.value = unicos(items.map(i => i.eje)).join('; ');
        c.item.value = unicos(items.map(i => i.sector)).join('; ');
        c.objetivo.value = unicos(items.map(i => i.objetivo)).join('; ');
        c.actividad.value = items.map(i => i.actividad).join('; ');
      }
    });

    const gob = crearSeccion({
      prefijo: `${config.rootId}Gob`,
      titulo: 'Programa del Gobernador Regional',
      etiquetaEje: 'Pilar / Eje del Programa',
      ayuda: 'Seleccione uno o más conceptos del programa y confirme la selección.',
      datos: datosGob,
      campos: campos('gob'),
      textoItem: item => `${item.eje.replace(/^\d+\.\s*/, '')} · ${item.letra}) ${item.titulo}`,
      claveItem: ([e, c]) => `${e}|${c}`,
      pintarEje: pintarGobernador,
      actualizar: (items, c) => {
        c.pilar.value = unicos(items.map(i => i.eje)).join('; ');
        c.letra.value = items.map(i => `${i.eje.split('.')[0]}.${i.letra}) ${i.titulo}`).join('; ');
        c.fundamento.value = items.map(i => i.desc).join(' ');
      }
    });

    raiz.replaceChildren(erd.detalle, gob.detalle);
    instancias[config.rootId] = { erd, gob };

    obtener(config.formId).addEventListener('reset', () => {
      setTimeout(() => {
        erd.reiniciar();
        gob.reiniciar();
      }, 0);
    });
  };

  // Carga y confirma selecciones de ejemplo: {erd: [[eje, sector, actividad]], gob: [[eje, concepto]]}.
  window.seleccionarArticulacionEjemplo = function (rootId, ejemplo) {
    const instancia = instancias[rootId];
    if (!instancia) throw new Error(`No se encontró la articulación "${rootId}".`);
    ['erd', 'gob'].forEach(tipo => {
      const seccion = instancia[tipo];
      seccion.reiniciar();
      if (ejemplo[tipo] && ejemplo[tipo].length) {
        seccion.seleccionar(ejemplo[tipo]);
        seccion.confirmar.click();
      }
    });
  };
})();
