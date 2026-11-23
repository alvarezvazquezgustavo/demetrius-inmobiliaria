/* Demetrius Grupo Inmobiliario — ajustes rápidos de las herramientas del sitio
   (calculadoras, valuación instantánea, moneda y directorio de asesores) */

// === PANEL DE CONFIGURACIÓN RÁPIDA DEMETRIUS ===
// Todo lo que se actualiza seguido vive en este archivo. Cambia el dato, guarda y recarga la página.
// Solo valores PÚBLICOS: aquí nunca van llaves, contraseñas ni datos personales de clientes.
// Los importes van en pesos (M.N.) y los porcentajes como decimales: 0.025 = 2.5 %.

// ---------------------------------------------------------------------------
// 1) PRECALIFICADOR DE CRÉDITO
// Pega entre las comillas el enlace del simulador de la hipotecaria (debe empezar con https://).
// Mientras esté vacío, el banner abre WhatsApp para precalificarse con un asesor.
// ---------------------------------------------------------------------------
const URL_SIMULADOR_HIPOTECARIA = "";

// ---------------------------------------------------------------------------
// 2) TIPO DE CAMBIO DE RESPALDO (pesos por dólar)
// La página consulta el tipo de cambio del día en open.er-api.com.
// Este valor solo se usa si esa consulta falla o no hay conexión.
// ---------------------------------------------------------------------------
const FALLBACK_USD_MXN = 20.00;

// ---------------------------------------------------------------------------
// 3) DESGLOSADOR DE PAGOS DEL CRÉDITO HIPOTECARIO
// ---------------------------------------------------------------------------
const CONFIG_CREDITO = {
  TASA_ANUAL: 0.1075,        // tasa fija anual de referencia (10.75 %); cámbiala por la de tu hipotecaria
  PORCENTAJE_INGRESO: 0.30,  // la mensualidad no debería pasar del 30 % del ingreso mensual
  VALOR_MINIMO: 250000       // valor mínimo de la propiedad que acepta el simulador
};

// ---------------------------------------------------------------------------
// 4) GASTOS DE ESCRITURACIÓN EN JALISCO (compraventa)
// Valores de REFERENCIA para un estimado. Cada concepto tiene un mínimo y un máximo.
// Sustitúyelos por los datos exactos de la notaría cuando los tengas.
// ---------------------------------------------------------------------------
const CONFIG_ESCRITURACION_JALISCO = {
  ACTUALIZADO: "noviembre de 2026",
  IVA: 0.16,

  // Impuesto sobre Transmisiones Patrimoniales (ITP). Cada municipio lo cobra con una tabla
  // progresiva en su Ley de Ingresos; aquí va la tasa efectiva aproximada según el valor.
  ITP_TRAMOS: [
    { hasta: 1000000,  min: 0.022, max: 0.026 },
    { hasta: 3000000,  min: 0.025, max: 0.029 },
    { hasta: 10000000, min: 0.027, max: 0.031 },
    { hasta: Infinity, min: 0.029, max: 0.035 }
  ],

  // "ajusteItp" multiplica la tasa de arriba: 1.00 = igual; 0.92 = 8 % menos.
  MUNICIPIOS: [
    { id: "guadalajara", nombre: "Guadalajara",            ajusteItp: 1.00 },
    { id: "zapopan",     nombre: "Zapopan",                ajusteItp: 1.00 },
    { id: "tlaquepaque", nombre: "Tlaquepaque",            ajusteItp: 1.00 },
    { id: "tonala",      nombre: "Tonalá",                 ajusteItp: 1.00 },
    { id: "tlajomulco",  nombre: "Tlajomulco de Zúñiga",   ajusteItp: 1.00 },
    { id: "elsalto",     nombre: "El Salto",               ajusteItp: 0.92 },
    { id: "chapala",     nombre: "Chapala",                ajusteItp: 0.92 },
    { id: "jocotepec",   nombre: "Jocotepec",              ajusteItp: 0.92 },
    { id: "tapalpa",     nombre: "Tapalpa",                ajusteItp: 0.92 },
    { id: "mazamitla",   nombre: "Mazamitla",              ajusteItp: 0.92 },
    { id: "vallarta",    nombre: "Puerto Vallarta",        ajusteItp: 1.00 }
  ],

  // Derechos del Registro Público de la Propiedad y de Catastro (porcentaje del valor)
  REGISTRO_PUBLICO: { min: 0.004, max: 0.006, minimoPesos: 1500 },

  // Avalúo (porcentaje del valor) y certificados de libertad de gravamen y de no adeudo (importe fijo)
  AVALUO: { min: 0.002, max: 0.003, minimoPesos: 3500 },
  CERTIFICADOS: { min: 1500, max: 4500 },

  // Honorarios notariales (porcentaje del valor, antes de IVA)
  HONORARIOS: { min: 0.008, max: 0.015, minimoPesos: 12000 }
};

// ---------------------------------------------------------------------------
// 5) PRE-DIAGNÓSTICO DE ISR POR VENTA (artículo 93, fracción XIX, inciso a) de la Ley del ISR)
// Actualiza el valor de la UDI de vez en cuando: lo publica el Banco de México.
// ---------------------------------------------------------------------------
const CONFIG_ISR = {
  UDIS_EXENTAS: 700000,
  VALOR_UDI: 8.904621,
  FECHA_UDI: "13 de noviembre de 2026",
  ANIOS_ENTRE_EXENCIONES: 3
};

// ---------------------------------------------------------------------------
// 6) VALORES DE MERCADO PARA LA VALUACIÓN INSTANTÁNEA (pesos por m²)
// Referencia tomada de precios de LISTA publicados en portales inmobiliarios (reportes de 2026).
// No son avalúos. Revisa y ajusta estos números con tu conocimiento de cada zona.
//   terreno      = valor del m² de terreno
//   construccion = valor del m² de construcción de una casa (sin el terreno)
//   depto        = valor del m² de un departamento (ya incluye su parte de terreno)
// ---------------------------------------------------------------------------
const VALORES_MERCADO_PORTALES_ZMG = {
  ACTUALIZADO: "octubre de 2026",

  // Valor que se usa cuando la colonia no está en la lista de abajo.
  // Las llaves son las opciones del campo "Municipio" del formulario de valuación.
  MUNICIPIOS: {
    "Guadalajara":             { terreno: 14000, construccion: 14000, depto: 59600 },
    "Zapopan":                 { terreno: 13000, construccion: 15000, depto: 58000 },
    "Tlaquepaque":             { terreno: 6500,  construccion: 10500, depto: 28000 },
    "Tonalá":                  { terreno: 5000,  construccion: 9500,  depto: 22000 },
    "Tlajomulco de Zúñiga":    { terreno: 6500,  construccion: 11500, depto: 26000 },
    "Chapala / Riviera":       { terreno: 7000,  construccion: 15000, depto: 38000 },
    "Puerto Vallarta / Costa": { terreno: 20000, construccion: 25000, depto: 75000 },
    "Otro":                    { terreno: 5000,  construccion: 10000, depto: 25000 }
  },

  // Colonias y fraccionamientos principales. Agrega renglones con el mismo formato.
  COLONIAS: [
    { nombres: ["Puerta de Hierro"],                              terreno: 38000, construccion: 30000, depto: 95000 },
    { nombres: ["Valle Real"],                                    terreno: 28000, construccion: 25000, depto: 65300 },
    { nombres: ["Providencia", "Country Club"],                   terreno: 30000, construccion: 24000, depto: 80800 },
    { nombres: ["Colomos Providencia", "Colomos"],                terreno: 30000, construccion: 25000, depto: 78000 },
    { nombres: ["Colinas de San Javier"],                         terreno: 26000, construccion: 24000, depto: 70000 },
    { nombres: ["Chapalita", "Chapalita Inn"],                    terreno: 20000, construccion: 17000, depto: 73400 },
    { nombres: ["Americana", "Lafayette", "Ladrón de Guevara"],   terreno: 24000, construccion: 16000, depto: 67300 },
    { nombres: ["Solares", "Residencia Solares"],                 terreno: 18000, construccion: 19000, depto: 55000 },
    { nombres: ["Virreyes", "Parque Virreyes"],                   terreno: 22000, construccion: 22000, depto: 60000 },
    { nombres: ["Ciudad Bugambilias", "Bugambilias"],             terreno: 9000,  construccion: 17000, depto: 40000 },
    { nombres: ["Zapopan Centro"],                                terreno: 16000, construccion: 15000, depto: 63800 },
    { nombres: ["Ciudad Granja"],                                 terreno: 15000, construccion: 15000, depto: 59100 },
    { nombres: ["La Calma", "La Estancia", "Arcos de Zapopan"],   terreno: 13000, construccion: 13000, depto: 38000 },
    { nombres: ["Río Blanco", "Capital Norte"],                   terreno: 14000, construccion: 20000, depto: 42000 },
    { nombres: ["La Tijera"],                                     terreno: 9000,  construccion: 14000, depto: 38000 },
    { nombres: ["Santa Anita"],                                   terreno: 9000,  construccion: 15000, depto: 32000 },
    { nombres: ["Casa Fuerte"],                                   terreno: 8500,  construccion: 14500, depto: 30000 },
    { nombres: ["Jocotepec"],                                     terreno: 3500,  construccion: 13000, depto: 28000 },
    { nombres: ["Chapala", "Ajijic"],                             terreno: 9000,  construccion: 18000, depto: 42000 },
    { nombres: ["Puerto Vallarta", "Marina Vallarta", "Fluvial Vallarta", "Zona Romántica"], terreno: 20000, construccion: 25000, depto: 75000 }
  ],

  // Ponderadores: multiplican el valor según las respuestas del formulario
  ANTIGUEDAD: {
    "Nueva / En construcción": 1.10,
    "1 – 5 años": 1.00,
    "5 – 15 años": 0.90,
    "Más de 15 años": 0.80
  },
  RECAMARAS: { "1": 0.96, "2": 0.98, "3": 1.00, "4": 1.03, "5+": 1.05 },
  BANOS: { "1": 0.96, "2": 1.00, "3": 1.03, "4+": 1.05 },
  LOCAL_COMERCIAL: 1.15,  // un local comercial vale este tanto respecto a una casa de la misma zona
  RANGO: 0.12             // el mínimo y el máximo se alejan 12 % del valor promedio
};

// ---------------------------------------------------------------------------
// 7) ASESORES DEL DIRECTORIO
// Un bloque { … } por asesor. Para agregar uno: copia un bloque de ejemplo, quítale las dos
// diagonales del inicio de cada renglón y cambia sus datos.
//   foto: nombre de una imagen cuadrada guardada junto a index.html (vacío = se muestran sus iniciales)
//   whatsapp: número con lada de país, sin espacios ni signos (52 1 33 …)
//   especialidades: "Comercial", "Residencial" y/o "Terrenos" (así se filtra el directorio)
// ---------------------------------------------------------------------------
const ASESORES_DEMETRIUS = [
  {
    nombre: "Gerardo Yair Ocaña Vázquez",
    nombreCorto: "Gerardo",
    cargo: "Asesor inmobiliario",
    oficina: "Demetrius Grupo Inmobiliario",
    ciudad: "Guadalajara / Zapopan, Jal.",
    especialidades: ["Residencial", "Comercial", "Terrenos"],
    experiencia: "10+ años exp.",
    idiomas: ["Español"],          // agrega "Inglés" si también atiende en ese idioma
    whatsapp: "5213351070944",
    foto: "",
    verificado: true
  }
  // ----- EJEMPLO 1 (bórralo o edítalo) -----
  // ,{
  //   nombre: "Nombre Apellido Apellido",
  //   nombreCorto: "Nombre",
  //   cargo: "Asesor inmobiliario",
  //   oficina: "Demetrius Grupo Inmobiliario",
  //   ciudad: "Zapopan, Jal.",
  //   especialidades: ["Residencial"],
  //   experiencia: "5+ años exp.",
  //   idiomas: ["Español", "Inglés"],
  //   whatsapp: "5213300000000",
  //   foto: "",
  //   verificado: true
  // }
  // ----- EJEMPLO 2 (bórralo o edítalo) -----
  // ,{
  //   nombre: "Nombre Apellido Apellido",
  //   nombreCorto: "Nombre",
  //   cargo: "Asesor inmobiliario",
  //   oficina: "Demetrius Grupo Inmobiliario",
  //   ciudad: "Guadalajara, Jal.",
  //   especialidades: ["Comercial", "Terrenos"],
  //   experiencia: "8+ años exp.",
  //   idiomas: ["Español"],
  //   whatsapp: "5213300000000",
  //   foto: "",
  //   verificado: true
  // }
];

// === FIN DEL PANEL DE CONFIGURACIÓN RÁPIDA ===

// Los demás archivos leen los ajustes desde aquí
window.DEMETRIUS_AJUSTES = Object.freeze({
  URL_SIMULADOR_HIPOTECARIA,
  FALLBACK_USD_MXN,
  CONFIG_CREDITO,
  CONFIG_ESCRITURACION_JALISCO,
  CONFIG_ISR,
  VALORES_MERCADO_PORTALES_ZMG,
  ASESORES_DEMETRIUS
});
