window.configurarSelectorERD = function (config) {
  const obtener = id => {
    const elemento = document.getElementById(id);
    if (!elemento) throw new Error(`No se encontró el elemento ERD "${id}".`);
    return elemento;
  };
  const selectorEje = obtener(config.selectorId);
  const contenedor = obtener(config.diagramId);
  const textoObjetivo = obtener(config.objectiveId);
  const listaSectores = obtener(config.sectorsId);
  const barraSeleccion = obtener(config.feedbackId);
  const estadoSeleccion = obtener(config.checkId);
  const detalle = obtener(config.detailsId);
  const campos = Object.fromEntries(
    Object.entries(config.fields).map(([clave, id]) => [clave, obtener(id)])
  );
  const datosRegionales = window.datosRegionalesERD5000;

  if (!Array.isArray(datosRegionales)) {
    throw new Error('No se pudo cargar la base de datos de la ERD.');
  }

  datosRegionales.forEach((dato, indice) => {
    const opcion = document.createElement('option');
    opcion.value = String(indice);
    opcion.textContent = dato.eje;
    selectorEje.appendChild(opcion);
  });

  const actualizarCampos = (eje = '', sector = '', objetivo = '', actividad = '') => {
    campos.lineamiento.value = eje;
    campos.item.value = sector;
    campos.objetivo.value = objetivo;
    campos.actividad.value = actividad;
  };

  selectorEje.addEventListener('change', () => {
    listaSectores.replaceChildren();
    barraSeleccion.hidden = true;
    contenedor.hidden = true;
    estadoSeleccion.hidden = true;
    actualizarCampos();

    if (selectorEje.value === '') {
      campos.actividad.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    const eje = datosRegionales[Number(selectorEje.value)];
    if (!eje) throw new Error('El eje ERD seleccionado no existe.');

    textoObjetivo.textContent = eje.objetivo_general;
    eje.sectores.forEach((sector, indiceSector) => {
      const fila = document.createElement('div');
      fila.className = 'erd-sector-row';

      const nombreSector = document.createElement('div');
      nombreSector.className = 'erd-sector-name';
      nombreSector.textContent = sector.nombre;

      const conector = document.createElement('span');
      conector.className = 'erd-sector-connector';
      conector.setAttribute('aria-hidden', 'true');
      conector.textContent = '➜';

      const actividades = document.createElement('ul');
      actividades.className = 'erd-activity-list';
      sector.actividades.forEach((actividad, indiceActividad) => {
        const item = document.createElement('li');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'erd-activity-button';
        boton.dataset.sectorIndex = String(indiceSector);
        boton.dataset.activityIndex = String(indiceActividad);
        boton.setAttribute('aria-pressed', 'false');
        boton.textContent = actividad;
        boton.addEventListener('click', () => {
          listaSectores.querySelectorAll('.erd-activity-button').forEach(elemento => {
            elemento.classList.remove('is-selected');
            elemento.setAttribute('aria-pressed', 'false');
          });
          boton.classList.add('is-selected');
          boton.setAttribute('aria-pressed', 'true');
          actualizarCampos(eje.eje, sector.nombre, eje.objetivo_general, actividad);
          obtener(config.selectionTextId).textContent =
            `${eje.eje} · ${sector.nombre} · ${actividad}`;
          barraSeleccion.hidden = false;
          estadoSeleccion.hidden = false;
          detalle.open = false;
          campos.actividad.dispatchEvent(new Event('input', { bubbles: true }));
        });
        item.appendChild(boton);
        actividades.appendChild(item);
      });

      fila.append(nombreSector, conector, actividades);
      listaSectores.appendChild(fila);
    });

    contenedor.hidden = false;
  });

  obtener(config.formId).addEventListener('reset', () => {
    setTimeout(() => {
      selectorEje.value = '';
      selectorEje.dispatchEvent(new Event('change'));
      detalle.open = false;
    }, 0);
  });
};

window.seleccionarActividadERD = function (selectorId, indiceEje, indiceSector, indiceActividad) {
  const selectorEje = document.getElementById(selectorId);
  if (!selectorEje) throw new Error(`No se encontró el selector ERD "${selectorId}".`);
  selectorEje.value = String(indiceEje);
  selectorEje.dispatchEvent(new Event('change'));
  const listaSectores = selectorEje.closest('details')?.querySelector('.erd-sector-list');
  if (!listaSectores) throw new Error('No se encontró el diagrama ERD asociado al selector.');
  const boton = listaSectores.querySelector(
    `[data-sector-index="${indiceSector}"][data-activity-index="${indiceActividad}"]`
  );
  if (!boton) throw new Error('No se pudo establecer la selección ERD solicitada.');
  boton.click();
};
