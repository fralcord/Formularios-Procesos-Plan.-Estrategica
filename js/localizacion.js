const PROVINCIAS_LOS_LAGOS = [
  {
    value: 'LLANQUIHUE',
    comunas: ['Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Llanquihue', 'Los Muermos', 'Maullín', 'Puerto Montt', 'Puerto Varas']
  },
  {
    value: 'CHILOÉ',
    comunas: ['Ancud', 'Castro', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao']
  },
  {
    value: 'OSORNO',
    comunas: ['Osorno', 'Puerto Octay', 'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo']
  },
  {
    value: 'PALENA',
    comunas: ['Chaitén', 'Futaleufú', 'Hualaihué', 'Palena']
  }
];

const COMUNAS_LOS_LAGOS = PROVINCIAS_LOS_LAGOS.flatMap(provincia =>
  provincia.comunas.map(comuna => ({ value: comuna, provincia: provincia.value }))
);

function reemplazarOpcionesUbicacion(select, placeholder, opciones, valorSeleccionado = '') {
  select.replaceChildren(new Option(placeholder, ''));
  opciones.forEach(({ value, label = value }) => {
    select.add(new Option(label, value));
  });
  select.value = opciones.some(opcion => opcion.value === valorSeleccionado)
    ? valorSeleccionado
    : '';
}

function sincronizarUbicacionDesdeComuna(provincia, comuna, limpiarProvinciaProvincial = false) {
  const valorComuna = comuna.value;
  const valorProvincia = limpiarProvinciaProvincial ? '' : provincia.value;
  const opcionesComuna = [
    ...COMUNAS_LOS_LAGOS.map(({ value }) => ({ value })),
    { value: 'Provincial' },
    { value: 'Regional' }
  ];
  reemplazarOpcionesUbicacion(comuna, 'Seleccione comuna...', opcionesComuna, valorComuna);

  if (valorComuna === 'Regional') {
    reemplazarOpcionesUbicacion(provincia, 'Seleccione provincia...', [{ value: 'REGIONAL' }], 'REGIONAL');
    return;
  }

  if (valorComuna === 'Provincial') {
    const provincias = PROVINCIAS_LOS_LAGOS.map(({ value }) => ({ value }));
    reemplazarOpcionesUbicacion(
      provincia,
      'Seleccione provincia...',
      provincias,
      !limpiarProvinciaProvincial && provincias.some(opcion => opcion.value === valorProvincia)
        ? valorProvincia
        : ''
    );
    return;
  }

  const comunaSeleccionada = COMUNAS_LOS_LAGOS.find(item => item.value === valorComuna);
  if (comunaSeleccionada) {
    reemplazarOpcionesUbicacion(
      provincia,
      'Seleccione provincia...',
      [{ value: comunaSeleccionada.provincia }],
      comunaSeleccionada.provincia
    );
    return;
  }

  reemplazarOpcionesUbicacion(provincia, 'Seleccione provincia...', [], '');
}

function sincronizarUbicacionDesdeProvincia(provincia, comuna) {
  if (comuna.value === 'Provincial') {
    const provincias = PROVINCIAS_LOS_LAGOS.map(({ value }) => ({ value }));
    reemplazarOpcionesUbicacion(
      provincia,
      'Seleccione provincia...',
      provincias,
      provincias.some(opcion => opcion.value === provincia.value) ? provincia.value : ''
    );
    return;
  }

  sincronizarUbicacionDesdeComuna(provincia, comuna);
}

function configurarSelectoresUbicacion(root = document) {
  root.querySelectorAll('[data-location-province]').forEach(provincia => {
    const scope = provincia.closest('form') || root;
    const comuna = scope.querySelector('[data-location-commune]');
    if (!comuna || provincia.dataset.locationConfigured) return;

    provincia.dataset.locationConfigured = 'true';
    comuna.dataset.locationConfigured = 'true';
    reemplazarOpcionesUbicacion(comuna, 'Seleccione comuna...', [
      ...COMUNAS_LOS_LAGOS.map(({ value }) => ({ value })),
      { value: 'Provincial' },
      { value: 'Regional' }
    ]);
    sincronizarUbicacionDesdeComuna(provincia, comuna);

    provincia.addEventListener('change', () => sincronizarUbicacionDesdeProvincia(provincia, comuna));
    comuna.addEventListener('change', () => sincronizarUbicacionDesdeComuna(provincia, comuna, true));
    scope.addEventListener('reset', () => setTimeout(() => {
      reemplazarOpcionesUbicacion(comuna, 'Seleccione comuna...', [
        ...COMUNAS_LOS_LAGOS.map(({ value }) => ({ value })),
        { value: 'Provincial' },
        { value: 'Regional' }
      ]);
      sincronizarUbicacionDesdeComuna(provincia, comuna);
    }, 0));
  });
}

function sincronizarSelectoresUbicacion(root = document) {
  root.querySelectorAll('[data-location-province]').forEach(provincia => {
    const scope = provincia.closest('form') || root;
    const comuna = scope.querySelector('[data-location-commune]');
    if (!comuna) return;

    if (comuna.value) {
      sincronizarUbicacionDesdeComuna(provincia, comuna);
    } else {
      sincronizarUbicacionDesdeProvincia(provincia, comuna);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => configurarSelectoresUbicacion());
