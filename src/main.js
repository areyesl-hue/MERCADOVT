import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { crearMercado } from './mercado.js';
import { crearMobiliario } from './mobiliario.js';
import { crearProductosLacteos } from './productos.js';
import { crearAlmacen } from './almacen.js';
import { crearClienteSupermercado } from './cliente.js';
import { crearCarrito } from './carrito.js';
import { crearVehiculos } from './vehiculos.js';
import { crearEstacionamiento } from './estacionamiento.js';
import { crearLadron } from './ladron.js';

const CONFIG = {
    alturaJugador: 1.7,
    velocidadCaminar: 7,
    velocidadCorrer: 12,
    velocidadSalto: 7,
    gravedad: 19,

    colorCieloDia: 0xa9c9e8,

    pixelRatioMaximo: 0.75,
    antialias: false,
    sombras: false,
    limiteDelta: 0.033,

    distanciaCarrito: 1.15,
    suavizadoCarrito: 6,

    velocidadCliente: 1.5,
    probabilidadCompra: 0.75,
    tiempoExaminar: 2.2,
    distanciaRecoger: 2,
    pausaEntreCompras: 1.8,

    tiempoCompraAuto: 60,
    maximoProductosCliente: 3,

    cajasRegistradoras: [
        { id: 1, x: -17, z: 26.95 },
        { id: 2, x: -12, z: 26.95 },
        { id: 3, x: 12, z: 26.95 },
        { id: 4, x: 17, z: 26.95 }
    ],

    distanciaRegistro: 0.7,
    maximoRegistros: 20000
};

const INTERVALO_HUD = 0.25;
const INTERVALO_REINTENTO_CAJA = 1;

let acumuladorHUD = 0;

const CONFIG_CLIENTES = [
    {
        nombre: 'Cliente2',
        modelo: '/modelos/Cliente2.glb',
        ruta: [
            { x: -27, z: 18 },
            { x: -23, z: 15 },
            { x: -21, z: 10.8 },
            { x: -17, z: 6.5 },
            { x: -12, z: 6.5 },
            { x: -5, z: 6.5 },
            { x: -5, z: 0 },
            { x: -12, z: -6 }
        ]
    },
    {
        nombre: 'Cliente2',
        modelo: '/modelos/Cliente2.glb',
        ruta: [
            { x: -27, z: 12.2 },
            { x: -29, z: 8 },
            { x: -20, z: 6.5 },
            { x: -12, z: 6.5 },
            { x: 0, z: 6.5 },
            { x: 12, z: 6.5 },
            { x: 22, z: 6.5 },
            { x: 21, z: -6 },
            { x: 12, z: -6 },
            { x: 0, z: -6 },
            { x: -12, z: -6 }
        ]
    },
    {
        nombre: 'Cliente3',
        modelo: '/modelos/Cliente3.glb',
        ruta: [
            { x: -20, z: 4 },
            { x: -12, z: 6.5 },
            { x: -5, z: 6.5 },
            { x: 0, z: 0 },
            { x: 5, z: -6 },
            { x: 12, z: -6 },
            { x: 20, z: -6 },
            { x: 20, z: -18 },
            { x: 12, z: -22 },
            { x: 0, z: -22 }
        ]
    },
    {
        nombre: 'Cliente4',
        modelo: '/modelos/Cliente4.glb',
        ruta: [
            { x: 20, z: 4 },
            { x: 26, z: 2 },
            { x: 22, z: 6.5 },
            { x: 12, z: 6.5 },
            { x: 5, z: 0 },
            { x: 12, z: -6 },
            { x: 20, z: -6 },
            { x: 22, z: -10 },
            { x: 20, z: -18 },
            { x: 12, z: -22 }
        ]
    },
    {
        nombre: 'Clienta1',
        modelo: '/modelos/Clienta1.glb',
        ruta: [
            { x: -20, z: -6 },
            { x: -26, z: -6 },
            { x: -26, z: -18 },
            { x: -20, z: -22 },
            { x: -10, z: -22 },
            { x: 0, z: -22 },
            { x: 12, z: -22 },
            { x: 20, z: -18 },
            { x: 12, z: -6 },
            { x: 0, z: -6 }
        ]
    },
    {
        nombre: 'Clienta2',
        modelo: '/modelos/Clienta2.glb',
        ruta: [
            { x: 20, z: 12 },
            { x: 23, z: 15 },
            { x: 18, z: 8 },
            { x: 17, z: 0 },
            { x: 12, z: -6 },
            { x: 17, z: -10 },
            { x: 20, z: -18 },
            { x: 12, z: -22 }
        ]
    },
    {
        nombre: 'Clienta3',
        modelo: '/modelos/Clienta3.glb',
        ruta: [
            { x: 24, z: -6 },
            { x: 17, z: -10 },
            { x: 12, z: -18 },
            { x: 20, z: -22 },
            { x: 17, z: -10 },
            { x: 22, z: -6 },
            { x: 24, z: 0 }
        ]
    }
];

const CONFIG_LADRONES = [
    {
        id: 'Ladron1',
        modelo: '/modelos/ladron1.glb',
        posicion: { x: -2, y: 0, z: 31 },
        velocidadCaminar: 1.8,
        velocidadHuida: 5.8,
        productosRobados: 2
    },
    {
        id: 'Ladron2',
        modelo: '/modelos/ladron2.glb',
        posicion: { x: 2, y: 0, z: 31 },
        velocidadCaminar: 2,
        velocidadHuida: 6.2,
        productosRobados: 3
    }
];

const INTERVALO_LADRONES = 60;
const MAXIMO_LADRONES_ACTIVOS = 2;
const MINIMO_INTERVALO_LADRONES = 45;
const MAXIMO_INTERVALO_LADRONES = 70;

let temporizadorLadrones = INTERVALO_LADRONES;
let indiceSiguienteLadron = 0;

const CONFIG_CAMARAS = [
    {
        nombre: 'Cámara 1 - Góndola izquierda frontal',
        posicion: { x: -20.5, y: 2.35, z: 10 },
        objetivo: { x: -17, y: 1.15, z: 13 },
        fov: 43
    },
    {
        nombre: 'Cámara 2 - Góndola izquierda frontal opuesta',
        posicion: { x: -13.5, y: 2.35, z: 16 },
        objetivo: { x: -17, y: 1.15, z: 13 },
        fov: 43
    },
    {
        nombre: 'Cámara 3 - Góndola izquierda central',
        posicion: { x: -20.5, y: 2.35, z: -3 },
        objetivo: { x: -17, y: 1.15, z: 0 },
        fov: 43
    },
    {
        nombre: 'Cámara 4 - Góndola izquierda central opuesta',
        posicion: { x: -13.5, y: 2.35, z: 3 },
        objetivo: { x: -17, y: 1.15, z: 0 },
        fov: 43
    },
    {
        nombre: 'Cámara 5 - Góndola central izquierda frontal',
        posicion: { x: -12.5, y: 2.35, z: 10 },
        objetivo: { x: -9, y: 1.15, z: 13 },
        fov: 43
    },
    {
        nombre: 'Cámara 6 - Góndola central izquierda posterior',
        posicion: { x: -5.5, y: 2.35, z: 16 },
        objetivo: { x: -9, y: 1.15, z: 13 },
        fov: 43
    },
    {
        nombre: 'Cámara 7 - Góndola central derecha frontal',
        posicion: { x: 5.5, y: 2.35, z: 3 },
        objetivo: { x: 9, y: 1.15, z: 0 },
        fov: 43
    },
    {
        nombre: 'Cámara 8 - Góndola central derecha posterior',
        posicion: { x: 12.5, y: 2.35, z: -3 },
        objetivo: { x: 9, y: 1.15, z: 0 },
        fov: 43
    },
    {
        nombre: 'Cámara 9 - Góndola derecha frontal',
        posicion: { x: 12.5, y: 2.35, z: 10 },
        objetivo: { x: 17, y: 1.15, z: 13 },
        fov: 43
    },
    {
        nombre: 'Cámara 10 - Góndola derecha frontal opuesta',
        posicion: { x: 21.5, y: 2.35, z: 16 },
        objetivo: { x: 17, y: 1.15, z: 13 },
        fov: 43
    },
    {
        nombre: 'Cámara 11 - Góndola derecha posterior',
        posicion: { x: 12.5, y: 2.35, z: -16 },
        objetivo: { x: 17, y: 1.15, z: -13 },
        fov: 43
    },
    {
        nombre: 'Cámara 12 - Góndola derecha posterior opuesta',
        posicion: { x: 21.5, y: 2.35, z: -10 },
        objetivo: { x: 17, y: 1.15, z: -13 },
        fov: 43
    },
    {
        nombre: 'Cámara 13 - Refrigeradores extremos izquierdos',
        posicion: { x: -30, y: 2.5, z: -21.5 },
        objetivo: { x: -27, y: 1.25, z: -26.5 },
        fov: 42
    },
    {
        nombre: 'Cámara 14 - Refrigeradores centrales izquierdos',
        posicion: { x: -23, y: 2.5, z: -21.5 },
        objetivo: { x: -20, y: 1.25, z: -26.5 },
        fov: 42
    },
    {
        nombre: 'Cámara 15 - Refrigeradores centrales derechos',
        posicion: { x: 23, y: 2.5, z: -21.5 },
        objetivo: { x: 20, y: 1.25, z: -26.5 },
        fov: 42
    },
    {
        nombre: 'Cámara 16 - Refrigeradores extremos derechos',
        posicion: { x: 30, y: 2.5, z: -21.5 },
        objetivo: { x: 27, y: 1.25, z: -26.5 },
        fov: 42
    },
    {
        nombre: 'Cámara 17 - Frutas mesa exterior izquierda',
        posicion: { x: -29, y: 2.5, z: 19 },
        objetivo: { x: -25.5, y: 0.9, z: 15 },
        fov: 40
    },
    {
        nombre: 'Cámara 18 - Frutas mesa exterior derecha',
        posicion: { x: -18, y: 2.5, z: 19 },
        objetivo: { x: -21.7, y: 0.9, z: 15 },
        fov: 40
    },
    {
        nombre: 'Cámara 19 - Verduras mesa interior izquierda',
        posicion: { x: -29, y: 2.5, z: 7 },
        objetivo: { x: -25.5, y: 0.9, z: 10.8 },
        fov: 40
    },
    {
        nombre: 'Cámara 20 - Verduras mesa interior derecha',
        posicion: { x: -18, y: 2.5, z: 7 },
        objetivo: { x: -21.7, y: 0.9, z: 10.8 },
        fov: 40
    },
    {
        nombre: 'Cámara 21 - Vitrinas derecha superior',
        posicion: { x: 20.5, y: 2.5, z: 17.5 },
        objetivo: { x: 25.2, y: 1.1, z: 15.2 },
        fov: 42
    },
    {
        nombre: 'Cámara 22 - Vitrinas derecha inferior',
        posicion: { x: 20.5, y: 2.5, z: 8.5 },
        objetivo: { x: 25.2, y: 1.1, z: 11.4 },
        fov: 42
    },
    {
        nombre: 'Cámara 23 - Cajas registradoras izquierdas',
        posicion: { x: -20, y: 3.2, z: 22 },
        objetivo: { x: -14.5, y: 1.1, z: 23.95 },
        fov: 48
    },
    {
        nombre: 'Cámara 24 - Cajas registradoras derechas',
        posicion: { x: 20, y: 3.2, z: 22 },
        objetivo: { x: 14.5, y: 1.1, z: 23.95 },
        fov: 48
    },
    {
        nombre: 'Cámara 25 - Entrada principal',
        posicion: { x: -5, y: 3.5, z: 28 },
        objetivo: { x: 0, y: 1.2, z: 20 },
        fov: 52
    },
    {
        nombre: 'Cámara 26 - Pasillo central',
        posicion: { x: 0, y: 4, z: -12 },
        objetivo: { x: 0, y: 1.2, z: 5 },
        fov: 55
    },
    {
        nombre: 'Cámara 27 - Entrada de vehículos',
        posicion: { x: -13, y: 5, z: 33 },
        objetivo: { x: 0, y: 1.2, z: 39 },
        fov: 55
    },
    {
        nombre: 'Cámara 28 - Estacionamiento izquierdo',
        posicion: { x: -29, y: 5, z: 43 },
        objetivo: { x: -16, y: 1.2, z: 43 },
        fov: 55
    },
    {
        nombre: 'Cámara 29 - Estacionamiento derecho',
        posicion: { x: 29, y: 5, z: 43 },
        objetivo: { x: 16, y: 1.2, z: 43 },
        fov: 55
    },
    {
        nombre: 'Cámara 30 - Vista panorámica estacionamiento',
        posicion: { x: 0, y: 13, z: 58 },
        objetivo: { x: 0, y: 0, z: 40 },
        fov: 65
    }
];

let escena;
let camara;
let renderizador;
let controles;
let reloj;

let sistemaVehiculos = null;
let productosLacteos = null;
let mobiliarioSupermercado = null;

let luzAmbiente;
let luzSol;

let juegoIniciado = false;
let velocidadVertical = 0;
let jugadorEnSuelo = true;

let vistaSeguridad = null;
let posicionJugadorGuardada = null;
let quaternionJugadorGuardado = null;
let fovJugadorGuardado = null;

let siguienteModeloCliente = 0;
let temporizadorMensaje = null;

const teclas = Object.create(null);

const clientesSupermercado = [];
const ladronesSupermercado = [];
const carritosClientes = [];

const visitantesPorVehiculo = new Map();
const cajasOcupadas = new Map();

const trayectoriaJugador = [];
const ticketsGenerados = [];

const LIMITE_JUGADOR = {
    minX: -31,
    maxX: 31,
    minZ: -55,
    maxZ: 55
};

const vectorAdelante = new THREE.Vector3();
const vectorDerecha = new THREE.Vector3();
const movimientoJugador = new THREE.Vector3();
const ejeVertical = new THREE.Vector3(0, 1, 0);

iniciar();

function iniciar() {
    crearEscena();
    crearCamara();
    crearRenderizador();
    crearIluminacion();

    reloj = new THREE.Clock();

    crearControles();
    crearInterfaz();
    crearEstructuraSupermercado();

    optimizarSombrasEscena();

    crearLadrones();
    crearSistemaVehiculos();

    configurarEventos();
    actualizarHUD();

    iniciarAnimacion();

    console.info('Supermercado 3D iniciado.');
    console.info(`Cámaras: ${CONFIG_CAMARAS.length}`);
    console.info(`Cajas: ${CONFIG.cajasRegistradoras.length}`);
}

function crearEscena() {
    escena = new THREE.Scene();
    escena.name = 'ESCENA_SUPERMERCADO';
    escena.background = new THREE.Color(CONFIG.colorCieloDia);
    escena.fog = new THREE.Fog(0xc7d9e9, 65, 150);
}

function crearCamara() {
    camara = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );

    camara.position.set(0, CONFIG.alturaJugador, 25);
    camara.lookAt(0, CONFIG.alturaJugador, 15);
}

function crearRenderizador() {
    renderizador = new THREE.WebGLRenderer({
        antialias: CONFIG.antialias,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true
    });

    renderizador.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, CONFIG.pixelRatioMaximo)
    );

    renderizador.setSize(window.innerWidth, window.innerHeight);
    renderizador.outputColorSpace = THREE.SRGBColorSpace;
    renderizador.toneMapping = THREE.NoToneMapping;

    renderizador.shadowMap.enabled = false;
    renderizador.shadowMap.autoUpdate = false;

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(renderizador.domElement);
}

function crearIluminacion() {
    luzAmbiente = new THREE.HemisphereLight(
        0xe8f3ff,
        0x777064,
        1.45
    );

    escena.add(luzAmbiente);

    luzSol = new THREE.DirectionalLight(0xffedcf, 1.15);
    luzSol.position.set(-35, 55, 35);
    luzSol.castShadow = false;

    escena.add(luzSol);
}

function optimizarSombrasEscena() {
    if (!escena) return;

    escena.traverse(objeto => {
        if (objeto.isLight) {
            objeto.castShadow = false;
        }

        if (objeto.isMesh) {
            objeto.castShadow = false;
            objeto.receiveShadow = false;
        }
    });

    console.info('[RENDIMIENTO] Sombras desactivadas.');
}

function crearEstructuraSupermercado() {
    try {
        crearMercado(escena);
        console.info('Mercado creado.');
    } catch (error) {
        console.error('Error al crear mercado:', error);
    }

    try {
        mobiliarioSupermercado = crearMobiliario(escena);
        console.info('Mobiliario creado.');
    } catch (error) {
        console.error('Error al crear mobiliario:', error);
    }

    try {
        crearAlmacen(escena);
        console.info('Almacén creado.');
    } catch (error) {
        console.error('Error al crear almacén:', error);
    }

    try {
        productosLacteos = crearProductosLacteos(escena);
        console.info('Productos iniciados:', productosLacteos);
    } catch (error) {
        console.error('Error al iniciar productos:', error);
    }

    try {
        crearEstacionamiento(escena);
        console.info('Estacionamiento creado.');
    } catch (error) {
        console.error('Error al crear estacionamiento:', error);
    }

    optimizarSombrasEscena();
}

function limpiarTeclas() {
    for (const tecla of Object.keys(teclas)) {
        teclas[tecla] = false;
    }
}

function crearControles() {
    controles = new PointerLockControls(camara, renderizador.domElement);

    controles.addEventListener('unlock', limpiarTeclas);

    renderizador.domElement.addEventListener('click', () => {
        if (
            juegoIniciado &&
            vistaSeguridad === null &&
            !controles.isLocked
        ) {
            controles.lock();
        }
    });
}

function crearLadrones() {
    if (!productosLacteos) {
        console.error('[LADRONES] No se recibieron los productos.');
        return;
    }

    temporizadorLadrones = INTERVALO_LADRONES;

    console.info(
        `[LADRONES] Generador activado. Primer ladrón en ${INTERVALO_LADRONES} segundos.`
    );
}

function generarSiguienteLadron() {
    if (!productosLacteos) return;

    const ladronesActivos =
        ladronesSupermercado.filter(
            ladron => ladron && !ladron.eliminado
        ).length;

    if (ladronesActivos >= MAXIMO_LADRONES_ACTIVOS) {
        temporizadorLadrones =
            MINIMO_INTERVALO_LADRONES +
            Math.random() *
            (MAXIMO_INTERVALO_LADRONES - MINIMO_INTERVALO_LADRONES);

        return;
    }

    const config = CONFIG_LADRONES[
        indiceSiguienteLadron % CONFIG_LADRONES.length
    ];

    indiceSiguienteLadron++;

    try {
        const ladron = crearLadron(
            escena,
            productosLacteos,
            {
                ...config,
                altura: 1.75,
                escala: 1,
                distanciaProducto: 0.85,
                tiempoRobo: 1.3,
                margenColision: 0.35,
                tamanoCelda: 0.5,

                alRobar: datos => {
                    console.info(`[LADRÓN] ${datos.id} robó un producto.`, datos);

                    mostrarMensaje(
                        `¡Robo detectado! ${datos.id} tomó ${datos.producto.nombre}.`
                    );
                },

                alEscapar: datos => {
                    console.info(`[LADRÓN] ${datos.id} escapó.`, datos);

                    mostrarMensaje(
                        `${datos.id} escapó con ${datos.cantidadRobada} productos.`
                    );
                }
            }
        );

        if (!ladron) {
            console.error(`[LADRONES] No se pudo crear ${config.id}.`);
            return;
        }

        ladronesSupermercado.push(ladron);

        console.info(`[LADRONES] ${config.id} apareció.`);
        mostrarMensaje(`¡Alerta! ${config.id} entró al supermercado.`);
    } catch (error) {
        console.error(`[LADRONES] Error creando ${config.id}:`, error);
    }
}

function actualizarGeneradorLadrones(delta) {
    if (!productosLacteos) return;

    if (
        ladronesSupermercado.filter(
            ladron => ladron && !ladron.eliminado
        ).length >= MAXIMO_LADRONES_ACTIVOS
    ) {
        return;
    }

    temporizadorLadrones -= delta;

    if (temporizadorLadrones <= 0) {
        generarSiguienteLadron();

        temporizadorLadrones =
            MINIMO_INTERVALO_LADRONES +
            Math.random() *
            (MAXIMO_INTERVALO_LADRONES - MINIMO_INTERVALO_LADRONES);
    }
}

function crearSistemaVehiculos() {
    try {
        sistemaVehiculos = crearVehiculos(escena, {
            modelos: [
                '/modelos/auto.glb',
                '/modelos/auto2.glb',
                '/modelos/auto3.glb',
                '/modelos/auto4.glb',
                '/modelos/auto5.glb',
                '/modelos/auto6.glb',
                '/modelos/auto7.glb'
            ],
            escala: 1,
            longitudVehiculo: 4.3,
            anchoVehiculo: 1.9,
            velocidad: 6,
            aceleracion: 4,
            velocidadMaxima: 7,
            tiempoEntreLlegadas: 5,
            cochesIniciales: 3,
            maximoPorTanda: 3,
            reemplazoContinuo: true,

            alEstacionar: datos => {
                console.info('[VEHÍCULO] Auto estacionado:', datos);
                crearClienteParaVehiculo(datos);
            },

            alSalir: datos => {
                console.info('[VEHÍCULO] Auto saliendo:', datos);

                const id = datos?.vehiculo?.id;

                if (id !== undefined && id !== null) {
                    limpiarVisitaVehiculo(id);
                }
            }
        });

        if (!sistemaVehiculos) {
            console.error('[VEHÍCULOS] No se pudo inicializar.');
            return;
        }

        console.info('[VEHÍCULOS] Sistema iniciado correctamente.');
    } catch (error) {
        console.error('[VEHÍCULOS] Error:', error);
    }
}


function crearClienteParaVehiculo(datos) {
    const idVehiculo = datos?.vehiculo?.id;

    if (
        !datos?.plaza ||
        idVehiculo === undefined ||
        idVehiculo === null
    ) {
        console.warn('[VISITANTE] Datos incompletos.', datos);
        return;
    }

    if (visitantesPorVehiculo.has(idVehiculo)) return;

    const config = CONFIG_CLIENTES[
        siguienteModeloCliente % CONFIG_CLIENTES.length
    ];

    siguienteModeloCliente++;

    const posicionInicio = {
        x: datos.plaza.x,
        y: 0,
        z: Math.min(54.5, datos.plaza.z + 1.8)
    };

    let cliente = null;

    try {
        cliente = crearClienteSupermercado(escena, {
            id: `VISITANTE_${idVehiculo}`,
            modelo: config.modelo,
            posicion: posicionInicio,
            mobiliario: mobiliarioSupermercado,
            colisiones:
                mobiliarioSupermercado?.userData?.obtenerColisiones?.() ?? [],
            velocidad: CONFIG.velocidadCliente,
            escala: 1,
            ruta: config.ruta,
            repetirRuta: false,
            inactivo: true,
            probabilidadCompra: CONFIG.probabilidadCompra,
            tiempoInspeccionar: CONFIG.tiempoExaminar,
            tiempoEntreProductos: CONFIG.pausaEntreCompras,
            maximoProductos: CONFIG.maximoProductosCliente,
            radioColision: 0.42,

            // Cuando el cliente compra productos
            alComprar: ({ totalProductos } = {}) => {
                const visita = visitantesPorVehiculo.get(idVehiculo);

                if (!visita) return;

                visita.tiempo = 0;

                console.info(
                    `[VISITANTE] ${visita.nombreCliente} lleva ${totalProductos} producto(s).`
                );
            },

            // Cuando entra al supermercado
            alEntrar: () => {
                const visita = visitantesPorVehiculo.get(idVehiculo);

                if (!visita || visita.fase !== 'entrando') return;

                visita.fase = 'comprando';
                visita.tiempo = 0;

                if (!visita.carrito) {
                    visita.carrito = crearCarritoVisitante(
                        visita.cliente,
                        idVehiculo
                    );
                }

                if (visita.carrito) {
                    visita.cliente.configurarCompras?.({
                        productos: productosLacteos,
                        carrito: visita.carrito
                    });
                }

                mostrarMensaje(
                    `${visita.nombreCliente} entró al supermercado.`
                );
            },

            // Detectar cuando llega a la zona de pago
            alCambiarEstado: ({ estado } = {}) => {
                const visita = visitantesPorVehiculo.get(idVehiculo);

                if (!visita) return;

                if (
                    estado === 'PAGANDO' &&
                    visita.ticketPendiente &&
                    !visita.pagoMostrado
                ) {
                    visita.pagoMostrado = true;
                    visita.fase = 'pagoMovil';

                    mostrarMensaje(
                        `${visita.nombreCliente} está mostrando su código QR.`
                    );

                    mostrarPagoMovil(
                        visita,
                        visita.ticketPendiente
                    );
                }
            }
        });

        if (!cliente) {
            console.error(
                `No se pudo crear el visitante ${idVehiculo}.`
            );

            sistemaVehiculos?.solicitarSalida?.(idVehiculo);
            return;
        }

        cliente.nombre = config.nombre;

        const visita = {
            id: idVehiculo,
            idVehiculo,
            cliente,
            carrito: null,
            nombreCliente: config.nombre,

            plaza: {
                id: datos.plaza.id,
                x: datos.plaza.x,
                z: datos.plaza.z
            },

            fase: 'entrando',
            tiempo: 0,
            tiempoEsperaCaja: 0,

            pagoSolicitado: false,
            pagoMostrado: false,

            ticketPendiente: null,

            salidaSolicitada: false,
            intentosSalida: 0,
            cajaAsignada: null
        };

        visitantesPorVehiculo.set(idVehiculo, visita);
        clientesSupermercado.push(cliente);

        if (typeof cliente.iniciarDesdeVehiculo !== 'function') {
            console.error(
                'El cliente no tiene iniciarDesdeVehiculo().'
            );

            visita.fase = 'errorEntrada';
            solicitarSalidaVisitante(visita);
            return;
        }

        const iniciado = cliente.iniciarDesdeVehiculo(
            posicionInicio,
            visita.plaza
        );

        if (iniciado === false) {
            console.error(
                `No se pudo iniciar el visitante ${idVehiculo}.`
            );

            visita.fase = 'errorEntrada';
            solicitarSalidaVisitante(visita);
            return;
        }

        console.info(
            `[VISITANTE] ${idVehiculo} comenzó a caminar.`
        );

    } catch (error) {
        console.error(
            'Error al crear visitante:',
            error
        );

        cliente?.eliminar?.();
        limpiarVisitaVehiculo(idVehiculo);

        sistemaVehiculos?.solicitarSalida?.(idVehiculo);
    }
}


function crearCarritoVisitante(cliente, idVisita) {
    const grupoCliente = cliente?.grupo;

    if (!grupoCliente?.isObject3D) {
        console.error(`[CARRITO] No se encontró el grupo de ${idVisita}.`);
        return null;
    }

    try {
        const posicion = new THREE.Vector3();
        grupoCliente.getWorldPosition(posicion);

        const carrito = crearCarrito(escena, {
            modelo: '/modelos/carrito.glb',
            posicion: {
                x: posicion.x,
                y: 0,
                z: posicion.z
            },
            escala: 1,
            distancia: CONFIG.distanciaCarrito,
            suavizado: CONFIG.suavizadoCarrito,
            correccionModelo: Math.PI
        });

        if (!carrito?.grupo) {
            console.error(`[CARRITO] No se pudo crear ${idVisita}.`);
            return null;
        }

        carrito.seguirObjetivo(
            grupoCliente,
            CONFIG.distanciaCarrito
        );

        carritosClientes.push(carrito);

        console.info(`[CARRITO] Creado para ${idVisita}.`);

        return carrito;
    } catch (error) {
        console.error(`[CARRITO] Error creando ${idVisita}:`, error);
        return null;
    }
}


function retirarClienteYCarritoDeVisita(visita) {
    if (!visita) return;

    const cliente = visita.cliente;
    const carrito = visita.carrito;

    try {
        carrito?.eliminar?.();
    } catch (error) {
        console.warn('No se pudo retirar el carrito:', error);
    }

    try {
        cliente?.eliminar?.();
    } catch (error) {
        console.warn('No se pudo retirar el cliente:', error);
    }

    const indiceCliente = clientesSupermercado.indexOf(cliente);

    if (indiceCliente !== -1) {
        clientesSupermercado.splice(indiceCliente, 1);
    }

    const indiceCarrito = carritosClientes.indexOf(carrito);

    if (indiceCarrito !== -1) {
        carritosClientes.splice(indiceCarrito, 1);
    }

    visita.cliente = null;
    visita.carrito = null;

    console.info(`[VISITANTE] ${visita.nombreCliente}: retirado.`);
}

function limpiarVisitaVehiculo(idVehiculo) {
    const visita = visitantesPorVehiculo.get(idVehiculo);

    if (!visita) return;

    liberarCajaVisitante(visita);

    try {
        visita.carrito?.eliminar?.();
        visita.cliente?.eliminar?.();
    } catch (error) {
        console.warn('Error retirando visitante:', error);
    }

    const indiceCliente = clientesSupermercado.indexOf(visita.cliente);

    if (indiceCliente !== -1) {
        clientesSupermercado.splice(indiceCliente, 1);
    }

    const indiceCarrito = carritosClientes.indexOf(visita.carrito);

    if (indiceCarrito !== -1) {
        carritosClientes.splice(indiceCarrito, 1);
    }

    visitantesPorVehiculo.delete(idVehiculo);

    console.info(`[VISITANTE] Visita ${idVehiculo} eliminada.`);
}

function obtenerCajaDisponible() {
    return CONFIG.cajasRegistradoras.find(
        caja => !cajasOcupadas.has(caja.id)
    ) ?? null;
}

function reservarCaja(visita) {
    if (!visita) return null;
    if (visita.cajaAsignada) return visita.cajaAsignada;

    const caja = obtenerCajaDisponible();

    if (!caja) return null;

    cajasOcupadas.set(caja.id, visita.idVehiculo);
    visita.cajaAsignada = caja;

    console.info(`[CAJA ${caja.id}] Reservada para ${visita.nombreCliente}.`);

    return caja;
}

function liberarCajaVisitante(visita) {
    if (!visita?.cajaAsignada) return;

    const caja = visita.cajaAsignada;

    if (cajasOcupadas.get(caja.id) === visita.idVehiculo) {
        cajasOcupadas.delete(caja.id);

        console.info(`[CAJA ${caja.id}] Liberada.`);
    }

    visita.cajaAsignada = null;
}

function actualizarEntidades(delta) {
    actualizarLista(clientesSupermercado, delta);
    actualizarLista(ladronesSupermercado, delta);

    actualizarGeneradorLadrones(delta);

    for (let i = carritosClientes.length - 1; i >= 0; i--) {
        const carrito = carritosClientes[i];

        if (!carrito || carrito.eliminado) {
            carritosClientes.splice(i, 1);
            continue;
        }

        try {
            carrito.actualizar?.(delta);
        } catch (error) {
            console.error('Error actualizando carrito:', error);
        }
    }

    if (typeof sistemaVehiculos?.actualizarCompleto === 'function') {
        sistemaVehiculos.actualizarCompleto(delta);
    } else if (typeof sistemaVehiculos?.actualizar === 'function') {
        sistemaVehiculos.actualizar(delta);
    }

    actualizarFasesVisitantes(delta);
}

function actualizarLista(lista, delta) {
    for (let i = lista.length - 1; i >= 0; i--) {
        const entidad = lista[i];

        if (!entidad || entidad.eliminado) {
            lista.splice(i, 1);
            continue;
        }

        try {
            entidad.actualizar?.(delta);
        } catch (error) {
            console.error('Error actualizando entidad:', error);
        }
    }
}


function obtenerEstadoCliente(cliente) {
    return String(cliente?.estado ?? '').toLowerCase();
}

function clienteEstaOcupadoComprando(estado) {
    return [
        'entrando',
        'entrandosupermercado',
        'buscando',
        'acercando',
        'acercandose',
        'acercandoseproducto',
        'recogiendo',
        'recogiendoproducto',
        'inspeccionando',
        'decidiendo',
        'guardando',
        'guardandoproducto',
        'devolviendo',
        'devolviendoproducto',
        'ruta',
        'yendocaja',
        'caja',
        'pagando',
        'regresando',
        'regresandovehiculo'
    ].includes(estado);
}

function obtenerComprasCliente(cliente) {
    if (typeof cliente?.obtenerCompras === 'function') {
        const compras = cliente.obtenerCompras();

        return Array.isArray(compras) ? compras : [];
    }

    if (typeof cliente?.obtenerResumen === 'function') {
        const resumen = cliente.obtenerResumen();

        if (Array.isArray(resumen?.compras)) return resumen.compras;
        if (Array.isArray(resumen?.productos)) return resumen.productos;
    }

    if (Array.isArray(cliente?.compras)) return cliente.compras;

    return [];
}


function actualizarFasesVisitantes(delta) {
    for (const visita of visitantesPorVehiculo.values()) {
        const cliente = visita.cliente;

        if (!cliente || cliente.eliminado) continue;

        if (visita.fase === 'esperandoCaja') {
            visita.tiempoEsperaCaja =
                (visita.tiempoEsperaCaja ?? 0) + delta;

            if (visita.tiempoEsperaCaja >= INTERVALO_REINTENTO_CAJA) {
                visita.tiempoEsperaCaja = 0;
                iniciarPagoVisitante(visita);
            }

            continue;
        }

        if (visita.fase !== 'comprando') continue;
        if (visita.pagoSolicitado) continue;

        visita.tiempo += delta;

        const compras = obtenerComprasCliente(cliente);
        const estado = obtenerEstadoCliente(cliente);

        const maximoComprado =
            compras.length >= CONFIG.maximoProductosCliente;

        const tiempoAgotado =
            visita.tiempo >= CONFIG.tiempoCompraAuto;

        if (estado === 'caja' && !visita.pagoSolicitado) {
            iniciarPagoVisitante(visita);
            continue;
        }

        if (
            clienteEstaOcupadoComprando(estado) &&
            !maximoComprado
        ) {
            continue;
        }

        if (!maximoComprado && !tiempoAgotado) continue;

        if (compras.length === 0) {
            mostrarMensaje(
                `${visita.nombreCliente} no encontró productos y regresará a su vehículo.`
            );

            iniciarRegresoVisitante(visita);
            continue;
        }

        visita.pagoSolicitado = true;

        iniciarPagoVisitante(visita);
    }

    for (const visita of visitantesPorVehiculo.values()) {
        if (visita.fase !== 'esperandoSalida') continue;
        if (visita.salidaSolicitada) continue;

        visita.intentosSalida++;

        if (visita.intentosSalida % 60 === 0) {
            solicitarSalidaVisitante(visita);
        }
    }
}



function iniciarPagoVisitante(visita) {
    if (!visita || visita.pagoSolicitado) return;

    const cliente = visita.cliente;

    if (!cliente || typeof cliente.iniciarPagoMovil !== 'function') {
        visita.fase = 'errorPago';
        visita.pagoSolicitado = false;
        console.error('[PAGO MOVIL] El cliente no tiene iniciarPagoMovil().');
        return;
    }

    visita.fase = 'preparandoPago';
    visita.pagoSolicitado = true;
    visita.pagoMostrado = false;

    mostrarMensaje(
        `${visita.nombreCliente} se dirige a la zona de pago móvil.`
    );

    try {
        const ticket = cliente.iniciarPagoMovil(
            ticketGenerado => {
                finalizarPagoVisitante(visita, ticketGenerado);
            }
        );

        if (!ticket) {
            visita.fase = 'errorPago';
            visita.pagoSolicitado = false;
            console.error('[PAGO MOVIL] No se pudo generar el ticket.');
            return;
        }

        visita.ticketPendiente = ticket;

        // El QR todavía no se muestra.
        // Esperamos a que el cliente llegue al estado PAGANDO.

    } catch (error) {
        visita.fase = 'errorPago';
        visita.pagoSolicitado = false;
        console.error('[PAGO MOVIL] Error:', error);
    }
}





function finalizarPagoVisitante(visita, ticket) {

    if (!visita || visita.fase !== 'pagoMovil') return;

    if (!ticket || ticket.pagado !== true) {
        console.warn('[PAGO MOVIL] El ticket todavía no está pagado.');
        return;
    }

    const ticketGuardado = {
        ...ticket,
        nombreCliente: visita.nombreCliente ?? 'Cliente',
        fecha: ticket.fecha ?? new Date().toLocaleString('es-MX')
    };

    ticketsGenerados.push(ticketGuardado);

    visita.fase = 'pagoConfirmado';
    visita.ticketPendiente = null;

    mostrarTicket(
        ticketGuardado,
        visita.nombreCliente ?? 'Cliente'
    );

    actualizarHUD();

    mostrarMensaje(
        `${visita.nombreCliente} ha confirmado su pago móvil.`
    );

    iniciarRegresoVisitante(visita);
}


function iniciarRegresoVisitante(visita) {
    if (!visita) return;

    liberarCajaVisitante(visita);

    visita.fase = 'regresando';

    const cliente = visita.cliente;

    if (!cliente || typeof cliente.iniciarRegresoVehiculo !== 'function') {
        console.error('El cliente no tiene iniciarRegresoVehiculo().');

        visita.fase = 'errorRegreso';

        return;
    }

    try {
        const iniciado = cliente.iniciarRegresoVehiculo(
            visita.plaza,
            () => {
                if (visita.fase !== 'regresando') return;

                visita.fase = 'esperandoSalida';

                mostrarMensaje(
                    `${visita.nombreCliente} regresó a su vehículo.`
                );

                retirarClienteYCarritoDeVisita(visita);

                solicitarSalidaVisitante(visita);
            }
        );

        if (iniciado === false) {
            visita.fase = 'errorRegreso';

            console.error('No se pudo iniciar el regreso al vehículo.');
        }
    } catch (error) {
        visita.fase = 'errorRegreso';

        console.error('Error en el regreso:', error);
    }
}


function solicitarSalidaVisitante(visita) {
    if (!visita || visita.salidaSolicitada) return false;

    if (typeof sistemaVehiculos?.solicitarSalida !== 'function') {
        console.error('El sistema de vehículos no tiene solicitarSalida().');

        return false;
    }

    const resultado = sistemaVehiculos.solicitarSalida(
        visita.idVehiculo
    );

    if (resultado === true) {
        visita.salidaSolicitada = true;
        visita.fase = 'saliendo';

        mostrarMensaje(
            `El vehículo de ${visita.nombreCliente ?? 'el cliente'} está saliendo.`
        );

        return true;
    }

    visita.salidaSolicitada = false;

    return false;
}

function actualizarJugador(delta) {
    if (
        !juegoIniciado ||
        !controles.isLocked ||
        vistaSeguridad !== null
    ) {
        return;
    }

    movimientoJugador.set(0, 0, 0);

    controles.getDirection(vectorAdelante);
    vectorAdelante.y = 0;

    if (vectorAdelante.lengthSq() > 0) {
        vectorAdelante.normalize();
    }

    vectorDerecha.crossVectors(
        vectorAdelante,
        ejeVertical
    ).normalize();

    const velocidad = (
        teclas.ShiftLeft || teclas.ShiftRight
    )
        ? CONFIG.velocidadCorrer
        : CONFIG.velocidadCaminar;

    if (teclas.KeyW || teclas.ArrowUp) {
        movimientoJugador.add(vectorAdelante);
    }

    if (teclas.KeyS || teclas.ArrowDown) {
        movimientoJugador.sub(vectorAdelante);
    }

    if (teclas.KeyD || teclas.ArrowRight) {
        movimientoJugador.add(vectorDerecha);
    }

    if (teclas.KeyA || teclas.ArrowLeft) {
        movimientoJugador.sub(vectorDerecha);
    }

    if (movimientoJugador.lengthSq() > 0) {
        movimientoJugador.normalize();

        camara.position.addScaledVector(
            movimientoJugador,
            velocidad * delta
        );
    }

    velocidadVertical -= CONFIG.gravedad * delta;

    camara.position.y += velocidadVertical * delta;

    if (camara.position.y <= CONFIG.alturaJugador) {
        camara.position.y = CONFIG.alturaJugador;

        velocidadVertical = 0;
        jugadorEnSuelo = true;
    }

    camara.position.x = THREE.MathUtils.clamp(
        camara.position.x,
        LIMITE_JUGADOR.minX,
        LIMITE_JUGADOR.maxX
    );

    camara.position.z = THREE.MathUtils.clamp(
        camara.position.z,
        LIMITE_JUGADOR.minZ,
        LIMITE_JUGADOR.maxZ
    );

    registrarTrayectoria(camara.position);
}


function registrarTrayectoria(posicion) {
    const ultimaPosicion = trayectoriaJugador.length
        ? trayectoriaJugador[trayectoriaJugador.length - 1]
        : null;

    if (ultimaPosicion) {
        const dx = posicion.x - ultimaPosicion.x;
        const dz = posicion.z - ultimaPosicion.z;

        if (Math.hypot(dx, dz) < CONFIG.distanciaRegistro) {
            return;
        }
    }

    trayectoriaJugador.push({
        fecha: new Date().toISOString(),
        x: Number(posicion.x.toFixed(3)),
        y: Number(posicion.y.toFixed(3)),
        z: Number(posicion.z.toFixed(3))
    });

    if (trayectoriaJugador.length > CONFIG.maximoRegistros) {
        trayectoriaJugador.shift();
    }
}

function obtenerArticulosTicket(ticket) {
    if (Array.isArray(ticket?.articulos)) return ticket.articulos;
    if (Array.isArray(ticket?.productos)) return ticket.productos;
    if (Array.isArray(ticket?.items)) return ticket.items;

    return [];
}

function obtenerSubtotalArticulo(articulo) {
    const cantidad = Number(articulo.cantidad ?? 1);

    if (
        articulo.subtotal !== undefined &&
        Number.isFinite(Number(articulo.subtotal))
    ) {
        return Number(articulo.subtotal);
    }

    if (
        articulo.total !== undefined &&
        Number.isFinite(Number(articulo.total))
    ) {
        return Number(articulo.total);
    }

    const precio = Number(
        articulo.precioUnitario ?? articulo.precio ?? 0
    );

    return precio * cantidad;
}

function escaparHTML(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatoMoneda(valor) {
    return Number(valor || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
}


function exportarTickets() {
    if (!ticketsGenerados.length) {
        mostrarMensaje('Todavía no hay tickets generados.');
        return;
    }

    const ventana = window.open('', '_blank');

    if (!ventana) {
        mostrarMensaje(
            'Permite las ventanas emergentes para exportar los tickets.'
        );
        return;
    }

    const ticketsHTML = ticketsGenerados.map((ticket, indice) => {
        const articulos = obtenerArticulosTicket(ticket);

        let totalCalculado = 0;

        const filas = articulos.map(articulo => {
            const cantidad = Math.max(
                1,
                Number(articulo.cantidad ?? 1)
            );

            const precio = Number(
                articulo.precioUnitario ?? articulo.precio ?? 0
            );

            const subtotal = obtenerSubtotalArticulo(articulo);

            totalCalculado += subtotal;

            const nombreProducto =
                articulo.nombre ??
                articulo.nombreProducto ??
                articulo.producto ??
                'Producto';

            return `
                <tr>
                    <td class="producto">
                        ${escaparHTML(nombreProducto)}
                    </td>

                    <td class="cantidad">
                        ${cantidad}
                    </td>

                    <td class="precio">
                        ${formatoMoneda(precio)}
                    </td>

                    <td class="importe">
                        ${formatoMoneda(subtotal)}
                    </td>
                </tr>
            `;
        }).join('');

        const total = Number.isFinite(Number(ticket.total))
            ? Number(ticket.total)
            : totalCalculado;

        const folio = ticket.idTicket ?? `T-${indice + 1}`;

        const cliente =
            ticket.nombreCliente ??
            ticket.idCliente ??
            'Cliente';

        const fecha =
            ticket.fecha ??
            new Date().toLocaleString('es-MX');

        return `
            <section class="ticket">

                <header class="encabezado">
                    <div class="marca">SUPERMERCADO 3D</div>

                    <h1>COMPROBANTE DE COMPRA</h1>

                    <p class="gracias">
                        Gracias por realizar tu compra
                    </p>
                </header>

                <div class="informacion">
                    <div>
                        <strong>Folio:</strong>
                        <span>${escaparHTML(folio)}</span>
                    </div>

                    <div>
                        <strong>Cliente:</strong>
                        <span>${escaparHTML(cliente)}</span>
                    </div>

                    <div>
                        <strong>Fecha:</strong>
                        <span>${escaparHTML(fecha)}</span>
                    </div>
                </div>

                <div class="separador"></div>

                <h2 class="titulo-productos">DETALLE DE COMPRA</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Importe</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${filas || `
                            <tr>
                                <td colspan="4" class="sin-productos">
                                    Sin productos registrados
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <div class="resumen">
                    <div class="total">
                        <span>TOTAL A PAGAR</span>
                        <strong>${formatoMoneda(total)}</strong>
                    </div>
                </div>

                <footer class="pie">
                    <p class="conservar">
                        Conserve este comprobante de compra.
                    </p>

                    <p>
                        ¡Gracias por su preferencia!
                    </p>

                    <small>
                        SUPERMERCADO 3D
                    </small>
                </footer>

            </section>
        `;
    }).join('');

    ventana.document.open();

    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">

        <head>
            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>Tickets del supermercado</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                html,
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #171717;
                    background: #e9edf0;
                }

                body {
                    padding: 25px;
                    font-size: 16px;
                }

                .ticket {
                    width: 100%;
                    max-width: 780px;
                    min-height: 850px;
                    margin: 0 auto 30px;
                    padding: 42px;
                    background: #fff;
                    border: 1px solid #d8d8d8;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, .08);

                    page-break-after: always;
                    break-after: page;
                }

                .ticket:last-child {
                    page-break-after: auto;
                    break-after: auto;
                }

                .encabezado {
                    text-align: center;
                    padding-bottom: 25px;
                    margin-bottom: 25px;
                    border-bottom: 3px dashed #555;
                }

                .marca {
                    font-size: 32px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    margin-bottom: 12px;
                }

                .encabezado h1 {
                    margin: 0 0 12px;
                    font-size: 22px;
                    font-weight: 800;
                }

                .gracias {
                    margin: 0;
                    font-size: 17px;
                }

                .informacion {
                    display: flex;
                    flex-direction: column;
                    gap: 11px;
                    margin-bottom: 25px;
                    font-size: 17px;
                    line-height: 1.5;
                }

                .informacion div {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .informacion strong {
                    min-width: 90px;
                }

                .separador {
                    border-top: 2px dashed #777;
                    margin: 20px 0;
                }

                .titulo-productos {
                    margin: 22px 0 15px;
                    font-size: 19px;
                    letter-spacing: .5px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    margin-bottom: 28px;
                    font-size: 15px;
                }

                th {
                    padding: 15px 9px;
                    background: #e9edf0;
                    border-bottom: 2px solid #333;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 800;
                }

                td {
                    padding: 15px 9px;
                    border-bottom: 1px solid #ccc;
                    vertical-align: middle;
                    line-height: 1.45;
                }

                th:first-child,
                td:first-child {
                    width: 43%;
                }

                th:nth-child(2),
                td:nth-child(2) {
                    width: 13%;
                }

                th:nth-child(3),
                td:nth-child(3) {
                    width: 21%;
                }

                th:nth-child(4),
                td:nth-child(4) {
                    width: 23%;
                }

                .producto {
                    font-weight: 700;
                    overflow-wrap: anywhere;
                }

                .cantidad {
                    text-align: center;
                }

                .precio,
                .importe {
                    text-align: right;
                    white-space: nowrap;
                }

                .sin-productos {
                    text-align: center;
                    padding: 25px;
                }

                .resumen {
                    border-top: 3px dashed #555;
                    padding-top: 23px;
                    margin-top: 25px;
                }

                .total {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    font-size: 23px;
                    font-weight: 900;
                }

                .total strong {
                    font-size: 30px;
                    white-space: nowrap;
                }

                .pie {
                    margin-top: 55px;
                    padding-top: 22px;
                    border-top: 1px dashed #777;
                    text-align: center;
                    font-size: 16px;
                    line-height: 1.7;
                }

                .pie p {
                    margin: 6px 0;
                }

                .pie small {
                    display: block;
                    margin-top: 15px;
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 2px;
                }

                @page {
                    size: A4;
                    margin: 12mm;
                }

                @media print {
                    html,
                    body {
                        width: 100%;
                        padding: 0;
                        margin: 0;
                        background: white;
                        font-size: 16px;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }

                    .ticket {
                        width: 100%;
                        max-width: none;
                        min-height: 0;
                        margin: 0;
                        padding: 8mm 5mm;
                        border: none;
                        box-shadow: none;
                        break-after: page;
                        page-break-after: always;
                    }

                    .ticket:last-child {
                        break-after: auto;
                        page-break-after: auto;
                    }

                    .marca {
                        font-size: 28pt;
                    }

                    .encabezado h1 {
                        font-size: 17pt;
                    }

                    .gracias {
                        font-size: 13pt;
                    }

                    .informacion {
                        font-size: 13pt;
                    }

                    .titulo-productos {
                        font-size: 15pt;
                    }

                    table {
                        font-size: 12pt;
                    }

                    th {
                        font-size: 11pt;
                        padding: 11pt 6pt;
                    }

                    td {
                        font-size: 12pt;
                        padding: 12pt 6pt;
                    }

                    .total {
                        font-size: 18pt;
                    }

                    .total strong {
                        font-size: 23pt;
                    }

                    .pie {
                        font-size: 12pt;
                    }

                    .pie small {
                        font-size: 10pt;
                    }
                }
            </style>
        </head>

        <body>
            ${ticketsHTML}

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 700);
                };
            <\/script>
        </body>

        </html>
    `);

    ventana.document.close();

    mostrarMensaje(
        'Tickets preparados. Selecciona "Guardar como PDF" en la ventana de impresión.'
    );
}

function mostrarTicket(ticket, nombreCliente = 'Cliente') {
    const ventana = document.getElementById('ticket-supermercado');

    if (!ventana || !ticket) return;

    const datos = document.getElementById('ticket-datos');
    const articulos = document.getElementById('ticket-articulos');
    const totalElemento = document.getElementById('ticket-total');

    if (!datos || !articulos || !totalElemento) return;

    const lista = ticket.productos?.length
    ? ticket.productos
    : obtenerArticulosTicket(ticket);

    datos.replaceChildren();

    const informacionTicket = [
        ['Folio', ticket.idTicket ?? ticket.folio ?? 'SIN FOLIO'],
        ['Cliente', ticket.nombreCliente ?? ticket.idCliente ?? nombreCliente],
        ['Fecha', ticket.fecha ?? new Date().toLocaleString('es-MX')]
    ];

    for (const [etiqueta, valor] of informacionTicket) {
        const linea = document.createElement('div');
        linea.className = 'ticket-linea-dato';

        const titulo = document.createElement('strong');
        titulo.textContent = `${etiqueta}:`;

        const contenido = document.createElement('span');
        contenido.textContent = String(valor);

        linea.append(titulo, contenido);
        datos.append(linea);
    }

    articulos.replaceChildren();

    let totalCalculado = 0;

    for (const articulo of lista) {
        const fila = document.createElement('tr');

        const nombre = document.createElement('td');

        nombre.textContent =
            articulo.nombre ??
            articulo.nombreProducto ??
            articulo.producto ??
            'Producto';

        const cantidad = document.createElement('td');
        cantidad.textContent = String(articulo.cantidad ?? 1);

        const importe = document.createElement('td');

        const subtotal = obtenerSubtotalArticulo(articulo);

        totalCalculado += subtotal;

        importe.textContent = formatoMoneda(subtotal);

        fila.append(nombre, cantidad, importe);

        articulos.append(fila);
    }

    const total = Number.isFinite(Number(ticket.total))
        ? Number(ticket.total)
        : totalCalculado;

    totalElemento.textContent = formatoMoneda(total);

    // Preparar espacio para el QR del pago móvil
let qrContenedor = document.getElementById('ticket-qr');

if (!qrContenedor) {
    qrContenedor = document.createElement('div');
    qrContenedor.id = 'ticket-qr';

    qrContenedor.style.cssText = `
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin: 18px auto;
        padding: 15px;
        background: white;
        border-radius: 12px;
        color: #111;
    `;

    const imagenQR = document.createElement('img');
    imagenQR.id = 'imagen-qr-pago';
    imagenQR.width = 180;
    imagenQR.height = 180;
    imagenQR.alt = 'Código QR de pago';

    const textoQR = document.createElement('strong');
    textoQR.id = 'texto-qr-pago';
    textoQR.textContent = 'Escanea para consultar el pago';

    qrContenedor.append(imagenQR, textoQR);
    totalElemento.parentElement.append(qrContenedor);
}
    ventana.style.display = 'flex';
}


function crearInterfazPagoMovil() {
    if (document.getElementById('ventana-pago-movil')) return;

    const ventana = document.createElement('div');
    ventana.id = 'ventana-pago-movil';

    ventana.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        justify-content: center;
        align-items: center;
        background: rgba(0,0,0,0.8);
        font-family: Arial, sans-serif;
    `;

    ventana.innerHTML = `
        <div style="
            background: white;
            color: #17202a;
            padding: 25px;
            border-radius: 18px;
            width: 320px;
            text-align: center;
        ">
            <h2>Pago móvil</h2>
            <p id="pago-folio"></p>

            <div id="qr-pago" style="
                display: flex;
                justify-content: center;
                margin: 20px 0;
            "></div>

            <h2 id="pago-total">$0.00</h2>

            <p id="pago-estado">
                Esperando confirmación...
            </p>

            <button id="btn-confirmar-pago" style="
                padding: 12px 20px;
                background: #16834a;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">
                Confirmar pago simulado
            </button>
        </div>
    `;

    document.body.appendChild(ventana);
}


function mostrarPagoMovil(visita, ticket) {

    if (!visita || !ticket) return;

    crearInterfazPagoMovil();

    const ventana = document.getElementById('ventana-pago-movil');
    const folio = document.getElementById('pago-folio');
    const total = document.getElementById('pago-total');
    const estadoPago = document.getElementById('pago-estado');
    const contenedorQR = document.getElementById('qr-pago');
    const boton = document.getElementById('btn-confirmar-pago');

    if (
        !ventana ||
        !folio ||
        !total ||
        !estadoPago ||
        !contenedorQR ||
        !boton
    ) {
        console.error('[PAGO MOVIL] No se encontró la interfaz.');
        return;
    }

    // Datos que contendrá el QR
    const datosQR = {
        tipo: 'PAGO_SUPERMERCADO',
        folio: ticket.folio,
        idCliente: ticket.idCliente,
        fecha: ticket.fecha,
        productos: ticket.productos,
        total: ticket.total
    };

    // Actualizar la pantalla del celular 3D
    if (
        typeof visita.cliente.actualizarQRTelefono === 'function'
    ) {
        visita.cliente.actualizarQRTelefono(datosQR);
    } else {
        console.warn(
            '[PAGO MOVIL] Falta actualizarQRTelefono() en cliente.js.'
        );
    }

    folio.textContent = `Folio: ${ticket.folio}`;
    total.textContent = formatoMoneda(ticket.total);

    estadoPago.textContent =
        'Escanea el QR y confirma el pago simulado.';

    contenedorQR.replaceChildren();

    if (typeof window.QRCode === 'undefined') {
        estadoPago.textContent =
            'No se pudo cargar el generador QR. Revisa tu conexión.';

        console.error('[PAGO MOVIL] QRCode no está disponible.');
        return;
    }

    // Generar el código QR
    new window.QRCode(contenedorQR, {
        text: JSON.stringify(datosQR),
        width: 190,
        height: 190,
        correctLevel: window.QRCode.CorrectLevel.M
    });

    ventana.style.display = 'flex';

    boton.disabled = false;
    boton.textContent = 'Confirmar pago simulado';

    // Evitar registrar dos veces el mismo evento
    boton.onclick = () => {

        const cliente = visita.cliente;

        if (
            !cliente ||
            typeof cliente.confirmarPagoMovil !== 'function'
        ) {
            console.error(
                '[PAGO MOVIL] No existe confirmarPagoMovil().'
            );
            return;
        }

        boton.disabled = true;

        estadoPago.textContent = 'Confirmando pago...';

        const confirmado = cliente.confirmarPagoMovil(
            ticket.folio
        );

        if (confirmado) {

            estadoPago.textContent =
                '¡Pago confirmado correctamente!';

            ventana.style.display = 'none';

        } else {

            boton.disabled = false;

            estadoPago.textContent =
                'No se pudo confirmar. Intenta nuevamente.';
        }
    };
}


function crearInterfazCamaras() {
    const panel = document.createElement('div');

    panel.id = 'panel-camaras';

    Object.assign(panel.style, {
        position: 'fixed',
        left: '50%',
        bottom: '10px',
        transform: 'translateX(-50%)',
        zIndex: '150',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '4px',
        width: 'min(950px, 95vw)',
        maxHeight: '145px',
        overflowY: 'auto',
        padding: '7px',
        boxSizing: 'border-box',
        borderRadius: '8px',
        background: 'rgba(8,16,24,.88)'
    });

    CONFIG_CAMARAS.forEach((config, indice) => {
        const boton = document.createElement('button');

        boton.textContent =
            `CAM ${String(indice + 1).padStart(2, '0')}`;

        boton.title = config.nombre;
        boton.className = 'boton-supermercado';

        boton.addEventListener('click', () => {
            cambiarVistaSeguridad(indice + 1);
        });

        panel.appendChild(boton);
    });

    const botonJugador = document.createElement('button');

    botonJugador.textContent = 'JUGADOR';
    botonJugador.className = 'boton-supermercado';

    botonJugador.addEventListener('click', volverAlJugador);

    panel.appendChild(botonJugador);

    document.body.appendChild(panel);
}

function cambiarVistaSeguridad(numero) {
    if (
        !Number.isInteger(numero) ||
        numero < 1 ||
        numero > CONFIG_CAMARAS.length
    ) {
        return;
    }

    const config = CONFIG_CAMARAS[numero - 1];

    if (vistaSeguridad === null) {
        posicionJugadorGuardada = camara.position.clone();
        quaternionJugadorGuardado = camara.quaternion.clone();
        fovJugadorGuardado = camara.fov;
    }

    limpiarTeclas();

    velocidadVertical = 0;
    vistaSeguridad = numero;

    controles.unlock();

    camara.position.set(
        config.posicion.x,
        config.posicion.y,
        config.posicion.z
    );

    camara.lookAt(
        config.objetivo.x,
        config.objetivo.y,
        config.objetivo.z
    );

    camara.fov = config.fov ?? 48;
    camara.updateProjectionMatrix();

    actualizarEstadoVista();

    mostrarMensaje(config.nombre);
}

function volverAlJugador() {
    if (vistaSeguridad !== null) {
        if (posicionJugadorGuardada) {
            camara.position.copy(posicionJugadorGuardada);
        }

        if (quaternionJugadorGuardado) {
            camara.quaternion.copy(quaternionJugadorGuardado);
        }

        if (fovJugadorGuardado !== null) {
            camara.fov = fovJugadorGuardado;
            camara.updateProjectionMatrix();
        }

        vistaSeguridad = null;

        posicionJugadorGuardada = null;
        quaternionJugadorGuardado = null;
        fovJugadorGuardado = null;
    }

    limpiarTeclas();

    actualizarEstadoVista();
}

function actualizarEstadoVista() {
    const elemento = document.getElementById('estado-vista');

    if (!elemento) return;

    if (vistaSeguridad === null) {
        elemento.textContent = 'Vista: jugador';
    } else {
        const config = CONFIG_CAMARAS[vistaSeguridad - 1];

        elemento.textContent = `Vista: ${config.nombre}`;
    }
}

function crearInterfaz() {
    const estilos = document.createElement('style');

    estilos.textContent = `
        .boton-supermercado {
            padding: 8px 11px;
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 6px;
            background: #164d3b;
            color: white;
            font: bold 11px Arial;
            cursor: pointer;
        }

        .boton-supermercado:hover {
            background: #217a59;
        }

        #panel-camaras .boton-supermercado:active {
            background: #2c9b70;
        }

        #hud-supermercado {
            position: fixed;
            left: 10px;
            top: 10px;
            z-index: 100;
            padding: 10px;
            color: white;
            background: rgba(0,0,0,.72);
            border-radius: 7px;
            font: 12px/1.6 Arial;
            pointer-events: none;
        }

        #acciones-supermercado {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 150;
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 5px;
            max-width: 420px;
        }

        #mensaje-supermercado {
            position: fixed;
            left: 50%;
            bottom: 165px;
            transform: translateX(-50%);
            z-index: 200;
            padding: 8px 13px;
            color: white;
            background: rgba(0,0,0,.8);
            border-radius: 6px;
            font: 12px Arial;
            pointer-events: none;
        }

        #portada-supermercado {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 13px;
            padding: 20px;
            color: white;
            background: linear-gradient(135deg,#0b1b29,#164d50);
            font-family: Arial;
            text-align: center;
        }

        #portada-supermercado h1 {
            font-size: clamp(28px,5vw,48px);
            margin: 0;
        }

        /* =========================================
           VENTANA DEL TICKET
        ========================================= */

        #ticket-supermercado {
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.78);
            font-family: Arial, Helvetica, sans-serif;
        }

        #ticket-contenido {
            width: min(650px, 95vw);
            max-height: 90vh;
            overflow: auto;
            padding: 35px;
            background: white;
            color: #222;
            border-radius: 12px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 17px;
            box-shadow: 0 10px 40px rgba(0,0,0,.3);
        }

        #ticket-contenido h2 {
            font-size: 29px;
            text-align: center;
            margin: 0 0 25px;
            color: #164d3b;
        }

        #ticket-datos {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 25px;
            font-size: 17px;
            line-height: 1.6;
        }

        .ticket-linea-dato {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .ticket-linea-dato strong {
            min-width: 85px;
        }

        #ticket-contenido table {
            width: 100%;
            border-collapse: collapse;
            font-size: 16px;
            table-layout: fixed;
        }

        #ticket-contenido th {
            padding: 14px 9px;
            border-bottom: 2px solid #333;
            background: #edf0f2;
            text-align: left;
            font-size: 15px;
        }

        #ticket-contenido td {
            padding: 14px 9px;
            border-bottom: 1px solid #ccc;
            text-align: left;
            font-size: 16px;
            line-height: 1.45;
            overflow-wrap: anywhere;
        }

        #ticket-contenido th:first-child,
        #ticket-contenido td:first-child {
            width: 52%;
        }

        #ticket-contenido th:nth-child(2),
        #ticket-contenido td:nth-child(2) {
            width: 15%;
            text-align: center;
        }

        #ticket-contenido th:nth-child(3),
        #ticket-contenido td:nth-child(3) {
            width: 33%;
            text-align: right;
        }

        #ticket-contenido .ticket-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 3px dashed #555;
            font-weight: 900;
            font-size: 25px;
        }

        #ticket-total {
            font-size: 30px;
            white-space: nowrap;
        }

        #ticket-contenido .ticket-botones {
            display: flex;
            gap: 10px;
            margin-top: 25px;
        }

        #ticket-contenido .ticket-botones button {
            flex: 1;
            padding: 12px;
            font-size: 13px;
        }

        @media(max-width:650px) {
            #hud-supermercado {
                left: 5px;
                top: 5px;
                max-width: 150px;
                font-size: 10px;
            }

            #acciones-supermercado {
                top: 5px;
                right: 5px;
                max-width: 180px;
            }

            .boton-supermercado {
                padding: 6px;
                font-size: 9px;
            }

            #panel-camaras {
                max-height: 120px !important;
            }

            #ticket-contenido {
                padding: 20px;
                font-size: 15px;
            }

            #ticket-contenido h2 {
                font-size: 23px;
            }

            #ticket-contenido table {
                font-size: 14px;
            }

            #ticket-contenido th,
            #ticket-contenido td {
                padding: 10px 5px;
                font-size: 13px;
            }

            #ticket-contenido .ticket-total {
                font-size: 21px;
            }

            #ticket-total {
                font-size: 24px;
            }
        }

        /* =========================================
           IMPRESIÓN DEL TICKET INDIVIDUAL
        ========================================= */

        @media print {
            @page {
                size: A4;
                margin: 12mm;
            }

            html,
            body {
                width: 100%;
                height: auto;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }

            body * {
                visibility: hidden !important;
            }

            #ticket-supermercado,
            #ticket-supermercado * {
                visibility: visible !important;
            }

            #ticket-supermercado {
                position: absolute !important;
                inset: 0 !important;
                display: flex !important;
                align-items: flex-start !important;
                justify-content: center !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
            }

            #ticket-contenido {
                width: 100% !important;
                max-width: 180mm !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 12mm !important;
                margin: 0 auto !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                color: #111 !important;
                background: white !important;
                font-size: 16pt !important;
            }

            #ticket-contenido h2 {
                margin-bottom: 22pt !important;
                font-size: 24pt !important;
                color: #111 !important;
            }

            #ticket-datos {
                gap: 12pt !important;
                margin-bottom: 24pt !important;
                font-size: 14pt !important;
                line-height: 1.6 !important;
            }

            .ticket-linea-dato {
                margin-bottom: 5pt !important;
            }

            #ticket-contenido table {
                width: 100% !important;
                font-size: 13pt !important;
            }

            #ticket-contenido th {
                padding: 12pt 7pt !important;
                font-size: 12pt !important;
                background: #e9edf0 !important;
            }

            #ticket-contenido td {
                padding: 13pt 7pt !important;
                font-size: 13pt !important;
                line-height: 1.4 !important;
            }

            #ticket-contenido .ticket-total {
                margin-top: 24pt !important;
                padding-top: 18pt !important;
                font-size: 20pt !important;
            }

            #ticket-total {
                font-size: 25pt !important;
            }

            #ticket-contenido .ticket-botones {
                display: none !important;
                visibility: hidden !important;
            }
        }
    `;

    document.head.appendChild(estilos);

    const portada = document.createElement('div');

    portada.id = 'portada-supermercado';

    portada.innerHTML = `
        <h1>SUPERMERCADO 3D</h1>
        <p>Explora el supermercado virtual.</p>
        <p>WASD: mover | SHIFT: correr | ESPACIO: saltar</p>
        <p>1-9: cámaras | F1-F12: cámaras adicionales | 0: volver</p>

        <button id="btn-entrar" class="boton-supermercado">
            ENTRAR AL SUPERMERCADO
        </button>
    `;

    document.body.appendChild(portada);

 

    const hud = document.createElement('div');

    hud.id = 'hud-supermercado';

    hud.innerHTML = `
        <strong>SUPERMERCADO 3D</strong><br>
        WASD: mover<br>
        SHIFT: correr<br>
        ESPACIO: saltar<br>
        ESC: liberar mouse

        <div id="estado-entidades">
            Clientes: 0 | Ladrones: 0
        </div>

        <div id="estado-recorrido">
            Recorrido: 0 puntos
        </div>

        <div id="estado-vista">
            Vista: jugador
        </div>

        <div id="estado-compras">
            Tickets: 0
        </div>
    `;

    document.body.appendChild(hud);

    const acciones = document.createElement('div');

    acciones.id = 'acciones-supermercado';

    acciones.innerHTML = `
        <button id="btn-tickets" class="boton-supermercado">
            EXPORTAR TICKETS PDF
        </button>
    `;

    document.body.appendChild(acciones);

    const mensaje = document.createElement('div');

    mensaje.id = 'mensaje-supermercado';
    mensaje.textContent = 'Pulsa ENTRAR para comenzar.';

    document.body.appendChild(mensaje);


    const ticket = document.createElement('div');

    ticket.id = 'ticket-supermercado';

    ticket.innerHTML = `
        <div id="ticket-contenido">
            <h2>SUPERMERCADO 3D</h2>

            <div id="ticket-datos"></div>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Importe</th>
                    </tr>
                </thead>

                <tbody id="ticket-articulos"></tbody>
            </table>

            <div class="ticket-total">
                <span>TOTAL</span>
                <span id="ticket-total">$0.00</span>
            </div>

            <div class="ticket-botones">
                <button id="ticket-imprimir" class="boton-supermercado">
                    IMPRIMIR
                </button>

                <button id="ticket-cerrar" class="boton-supermercado">
                    CERRAR
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(ticket);

    crearInterfazCamaras();

    document.getElementById('btn-entrar').onclick = () => {
        juegoIniciado = true;

        portada.style.display = 'none';

        controles.lock();
    };


    document.getElementById('btn-tickets').onclick =
        exportarTickets;

    document.getElementById('ticket-cerrar').onclick = () => {
        ticket.style.display = 'none';
    };

    document.getElementById('ticket-imprimir').onclick = () => {
        window.print();
    };
}

function mostrarMensaje(texto) {
    const elemento = document.getElementById('mensaje-supermercado');

    if (!elemento) return;

    elemento.textContent = texto;
    elemento.style.display = 'block';

    if (temporizadorMensaje) {
        clearTimeout(temporizadorMensaje);
    }

    temporizadorMensaje = setTimeout(() => {
        elemento.style.display = 'none';
    }, 2500);
}


function actualizarHUD() {
    const entidades = document.getElementById('estado-entidades');
    const recorrido = document.getElementById('estado-recorrido');
    const compras = document.getElementById('estado-compras');

    if (entidades) {
        entidades.textContent =
            `Clientes: ${clientesSupermercado.length}` +
            ` | Ladrones: ${ladronesSupermercado.length}`;
    }

    if (recorrido) {
        recorrido.textContent =
            `Recorrido: ${trayectoriaJugador.length} puntos`;
    }

    if (compras) {
        compras.textContent =
            `Tickets: ${ticketsGenerados.length}`;
    }

    actualizarEstadoVista();
}

function configurarEventos() {
    window.addEventListener('keydown', evento => {
        if (
            evento.code === 'Space' ||
            evento.code.startsWith('Arrow')
        ) {
            evento.preventDefault();
        }

        teclas[evento.code] = true;

        if (
            evento.code === 'Space' &&
            juegoIniciado &&
            controles.isLocked &&
            vistaSeguridad === null &&
            jugadorEnSuelo
        ) {
            velocidadVertical = CONFIG.velocidadSalto;

            jugadorEnSuelo = false;
        }

        if (/^Digit[1-9]$/.test(evento.code)) {
            cambiarVistaSeguridad(Number(evento.code.slice(-1)));
        }

        if (/^Numpad[1-9]$/.test(evento.code)) {
            cambiarVistaSeguridad(Number(evento.code.slice(-1)));
        }

        if (/^F([1-9]|1[0-2])$/.test(evento.code)) {
            const numeroFuncion = Number(evento.code.slice(1));

            cambiarVistaSeguridad(9 + numeroFuncion);
        }

        if (
            evento.code === 'Digit0' ||
            evento.code === 'Numpad0'
        ) {
            volverAlJugador();
        }
    });

    window.addEventListener('keyup', evento => {
        teclas[evento.code] = false;
    });

    window.addEventListener('blur', limpiarTeclas);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            limpiarTeclas();

            reloj.getDelta();
        }
    });

    window.addEventListener('resize', () => {
        camara.aspect = window.innerWidth / window.innerHeight;

        camara.updateProjectionMatrix();

        renderizador.setSize(
            window.innerWidth,
            window.innerHeight
        );

        renderizador.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                CONFIG.pixelRatioMaximo
            )
        );
    });
}

function iniciarAnimacion() {
    renderizador.setAnimationLoop(() => {
        const delta = Math.min(
            reloj.getDelta(),
            CONFIG.limiteDelta
        );

        actualizarJugador(delta);

        actualizarEntidades(delta);

        acumuladorHUD += delta;

        if (acumuladorHUD >= INTERVALO_HUD) {
            acumuladorHUD = 0;

            actualizarHUD();
        }

        renderizador.render(escena, camara);
    });
}
