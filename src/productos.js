
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ============================================================
// PRODUCTOS DEL SUPERMERCADO
// Three.js | GLB | Unidades independientes
// ============================================================

export function crearProductosLacteos(scene) {
    if (!scene?.isScene) {
        throw new Error('crearProductosLacteos necesita una THREE.Scene.');
    }

    const loader = new GLTFLoader();
    const productos = new THREE.Group();
    productos.name = 'PRODUCTOS_SUPERMERCADO';
    scene.add(productos);

    const PRECIOS = {
        PLATANO: 8
    };

    let modelosCargados = 0;
    let unidadesColocadas = 0;
    let modelosFallidos = 0;
    let siguienteIdUnidad = 1;

    const cacheModelos = new Map();
    const cacheDimensiones = new WeakMap();
    const unidades = [];
    const unidadesPorId = new Map();

    function cargarModelo(archivo, nombre, callback) {
        const existente = cacheModelos.get(archivo);

        if (existente) {
            if (existente.modelo) {
                callback(existente.modelo);
            } else {
                existente.callbacks.push(callback);
            }
            return;
        }

        const registro = {
            modelo: null,
            callbacks: [callback]
        };

        cacheModelos.set(archivo, registro);

        loader.load(
            archivo,
            (gltf) => {
                const original = gltf.scene;
                original.name = nombre;

                original.traverse((objeto) => {
                    if (!objeto.isMesh) return;
                    objeto.castShadow = false;
                    objeto.receiveShadow = false;
                    objeto.frustumCulled = true;
                });

                original.updateMatrixWorld(true);
                registro.modelo = original;
                modelosCargados++;

                const callbacks = [...registro.callbacks];
                registro.callbacks.length = 0;

                callbacks.forEach((fn) => {
                    try {
                        fn(original);
                    } catch (error) {
                        console.error(`Error colocando ${nombre}:`, error);
                    }
                });

                console.info(`Modelo cargado: ${nombre}`);
            },
            undefined,
            (error) => {
                modelosFallidos++;
                cacheModelos.delete(archivo);
                console.error(`No se pudo cargar ${archivo}.`, error);
            }
        );
    }

    function contieneMallas(objeto) {
        let encontrado = false;

        objeto.traverse((hijo) => {
            if (hijo.isMesh) encontrado = true;
        });

        return encontrado;
    }

    function obtenerGruposProducto(original) {
        original.updateMatrixWorld(true);

        function buscarContenedor(padre) {
            const gruposHijos = padre.children.filter((hijo) => {
                return hijo.isGroup && contieneMallas(hijo);
            });

            if (gruposHijos.length >= 2) return gruposHijos;

            for (const hijo of padre.children) {
                const resultado = buscarContenedor(hijo);

                if (resultado && resultado.length >= 2) {
                    return resultado;
                }
            }

            return null;
        }

        const grupos = buscarContenedor(original);

        if (!grupos) {
            console.warn(
                `No se detectaron grupos independientes en "${original.name}". ` +
                'Se utilizará el modelo completo como una unidad.'
            );

            return [original];
        }

        return grupos;
    }

    function compactarMallasFuente(fuente) {
        fuente.updateMatrixWorld(true);

        const inversaFuente = new THREE.Matrix4()
            .copy(fuente.matrixWorld)
            .invert();

        const grupos = new Map();

        fuente.traverse((objeto) => {
            const geometria = objeto.geometry;

            if (
                !objeto.isMesh ||
                objeto.isSkinnedMesh ||
                objeto.isInstancedMesh ||
                !geometria?.attributes?.position ||
                !objeto.material?.isMaterial ||
                !objeto.visible ||
                geometria.attributes.skinIndex ||
                Object.keys(geometria.morphAttributes).length
            ) {
                return;
            }

            const matrizRelativa = new THREE.Matrix4()
                .multiplyMatrices(inversaFuente, objeto.matrixWorld);

            if (matrizRelativa.determinant() <= 0) return;

            const firmaAtributos = Object.entries(
                geometria.attributes
            )
                .sort(([nombreA], [nombreB]) =>
                    nombreA.localeCompare(nombreB)
                )
                .map(([nombre, atributo]) => {
                    if (atributo.isInterleavedBufferAttribute) {
                        return null;
                    }

                    return [
                        nombre,
                        atributo.itemSize,
                        atributo.normalized,
                        atributo.array.constructor.name
                    ].join(':');
                });

            if (firmaAtributos.includes(null)) return;

            const clave = [
                objeto.material.uuid,
                objeto.renderOrder,
                objeto.layers.mask,
                geometria.index?.array.constructor.name ?? 'sin-indice',
                firmaAtributos.join('|')
            ].join(';');

            let grupo = grupos.get(clave);

            if (!grupo) {
                grupo = {
                    material: objeto.material,
                    objetos: [],
                    matrices: []
                };

                grupos.set(clave, grupo);
            }

            grupo.objetos.push(objeto);
            grupo.matrices.push(matrizRelativa);
        });

        for (const grupo of grupos.values()) {
            if (grupo.objetos.length < 2) continue;

            const geometrias = grupo.objetos.map((objeto, indice) => {
                return objeto.geometry
                    .clone()
                    .applyMatrix4(grupo.matrices[indice]);
            });

            const geometriaCombinada = mergeGeometries(
                geometrias,
                false
            );

            geometrias.forEach((geometria) => {
                geometria.dispose();
            });

            if (!geometriaCombinada) {
                console.warn(
                    `No se pudieron compactar mallas de ${fuente.name}; se conservarán separadas.`
                );

                continue;
            }

            const mallaCombinada = new THREE.Mesh(
                geometriaCombinada,
                grupo.material
            );

            mallaCombinada.name =
                `MALLAS_COMPACTADAS_${mallaCombinada.id}`;

            mallaCombinada.castShadow =
                grupo.objetos[0].castShadow;

            mallaCombinada.receiveShadow =
                grupo.objetos[0].receiveShadow;

            mallaCombinada.frustumCulled =
                grupo.objetos[0].frustumCulled;

            mallaCombinada.renderOrder =
                grupo.objetos[0].renderOrder;

            mallaCombinada.layers.mask =
                grupo.objetos[0].layers.mask;

            grupo.objetos.forEach((objeto) => {
                objeto.removeFromParent();
            });

            fuente.add(mallaCombinada);
        }

        function quitarGruposVacios(padre) {
            for (const hijo of [...padre.children]) {
                quitarGruposVacios(hijo);

                if (hijo.isGroup && hijo.children.length === 0) {
                    hijo.removeFromParent();
                }
            }
        }

        quitarGruposVacios(fuente);
        fuente.updateMatrixWorld(true);
    }

    function crearFuentesIndependientes(original) {
        original.updateMatrixWorld(true);

        const grupos = obtenerGruposProducto(original);
        const inversaRaiz = original.matrixWorld.clone().invert();

        return grupos.map((grupo, indice) => {
            grupo.updateWorldMatrix(true, true);

            const matrizRelativa = new THREE.Matrix4()
                .multiplyMatrices(inversaRaiz, grupo.matrixWorld);

            const copia = grupo.clone(true);
            copia.position.set(0, 0, 0);
            copia.quaternion.identity();
            copia.scale.set(1, 1, 1);
            copia.matrix.identity();
            copia.matrixAutoUpdate = true;

            const fuente = new THREE.Group();
            fuente.name = `FUENTE_PRODUCTO_${indice + 1}`;

            matrizRelativa.decompose(
                fuente.position,
                fuente.quaternion,
                fuente.scale
            );

            fuente.add(copia);
            compactarMallasFuente(fuente);
            fuente.updateMatrixWorld(true);

            const caja = new THREE.Box3().setFromObject(fuente);

            if (caja.isEmpty()) {
                console.warn(`Grupo vacío: ${grupo.name}`);
                return fuente;
            }

            const centro = new THREE.Vector3();
            caja.getCenter(centro);

            fuente.position.sub(centro);
            fuente.updateMatrixWorld(true);

            fuente.userData.esFuenteProducto = true;
            fuente.userData.grupoOriginal = grupo.name;
            fuente.userData.indiceGrupo = indice;

            return fuente;
        });
    }

    function obtenerCodigoCatalogo(nombreUnidad) {
        return nombreUnidad
            .replace(/_N\d+_\d+$/, '')
            .replace(/_\d+$/, '');
    }

    function obtenerPrecio(codigo) {
        const precio = PRECIOS[codigo];

        if (Number.isFinite(precio)) return precio;

        console.warn(
            `No hay precio para ${codigo}. Se asignará $0.00 MXN.`
        );

        return 0;
    }

    function obtenerDimensionesFuente(fuente) {
        let dimensiones = cacheDimensiones.get(fuente);

        if (dimensiones) return dimensiones;

        fuente.updateMatrixWorld(true);

        const caja = new THREE.Box3().setFromObject(fuente);

        if (caja.isEmpty()) return null;

        const centro = new THREE.Vector3();
        const tamano = new THREE.Vector3();

        caja.getCenter(centro);
        caja.getSize(tamano);

        dimensiones = { centro, tamano };
        cacheDimensiones.set(fuente, dimensiones);

        return dimensiones;
    }

    function crearCopia(
        fuente,
        nombre,
        x,
        y,
        z,
        altura,
        rotacionY = 0,
        categoria = 'Abarrotes',
        limites = {}
    ) {
        if (!fuente) return null;

        const datosFuente = obtenerDimensionesFuente(fuente);

        if (!datosFuente) {
            console.warn(`Modelo sin geometría: ${nombre}`);
            return null;
        }

        const modelo = fuente.clone(true);

        modelo.name = nombre;
        modelo.position.set(0, 0, 0);
        modelo.scale.setScalar(1);
        modelo.rotation.set(0, rotacionY, 0);
        modelo.updateMatrixWorld(true);

        const cajaRotada = new THREE.Box3().setFromObject(modelo);

        if (cajaRotada.isEmpty()) return null;

        const dimensionesRotadas = new THREE.Vector3();
        const centroRotado = new THREE.Vector3();

        cajaRotada.getSize(dimensionesRotadas);
        cajaRotada.getCenter(centroRotado);

        if (
            dimensionesRotadas.x <= 0.0001 ||
            dimensionesRotadas.y <= 0.0001 ||
            dimensionesRotadas.z <= 0.0001 ||
            !Number.isFinite(altura) ||
            altura <= 0
        ) {
            console.warn(`Dimensiones inválidas para ${nombre}.`);
            return null;
        }

        const nombreNormalizado = nombre.toLowerCase();

        const esBlusaOSudadera =
            nombreNormalizado.includes('blusa') ||
            nombreNormalizado.includes('sudadera negra');

        const esCarne =
            nombreNormalizado.includes('pollo') ||
            nombreNormalizado.includes('filete') ||
            nombreNormalizado.includes('costilla') ||
            nombreNormalizado.includes('salchichas');

        const dimensionMaximaEstandar =
            esBlusaOSudadera
                ? 1.00
                : esCarne
                    ? 0.65
                    : categoria === 'Ropa'
                        ? 0.72
                        : categoria === 'Frutas y verduras'
                            ? 0.46
                            : 0.32;

        const escala = dimensionMaximaEstandar / Math.max(
            dimensionesRotadas.x,
            dimensionesRotadas.y,
            dimensionesRotadas.z
        );

        modelo.scale.setScalar(escala);
        modelo.updateMatrixWorld(true);

        const cajaFinal = new THREE.Box3().setFromObject(modelo);

        if (cajaFinal.isEmpty()) return null;

        const centroFinal = new THREE.Vector3();
        const dimensionesFinales = new THREE.Vector3();

        cajaFinal.getCenter(centroFinal);
        cajaFinal.getSize(dimensionesFinales);

        const posicionY = categoria === 'Ropa'
            ? 1.72 - cajaFinal.max.y
            : y - cajaFinal.min.y;

        modelo.position.set(
            x - centroFinal.x,
            posicionY,
            z - centroFinal.z
        );

        modelo.updateMatrixWorld(true);

        const idUnidad =
            `UNIDAD_${String(siguienteIdUnidad++).padStart(5, '0')}`;

        const codigoCatalogo = obtenerCodigoCatalogo(nombre);
        const precio = obtenerPrecio(codigoCatalogo);

        modelo.userData.esUnidadProducto = true;
        modelo.userData.tipo = 'producto';
        modelo.userData.esProducto = true;
        modelo.userData.idUnidadProducto = idUnidad;
        modelo.userData.codigoProducto = idUnidad;
        modelo.userData.codigoCatalogo = codigoCatalogo;
        modelo.userData.skuProducto = codigoCatalogo;
        modelo.userData.nombreProducto = codigoCatalogo;
        modelo.userData.nombre = nombre;
        modelo.userData.nombreVisible = nombre;
        modelo.userData.nombreUnidad = nombre;
        modelo.userData.codigo = codigoCatalogo;
        modelo.userData.precio = precio;
        modelo.userData.moneda = 'MXN';
        modelo.userData.categoria = categoria;
        modelo.userData.idRack = limites.idRack ?? categoria;
        modelo.userData.rackId = modelo.userData.idRack;
        modelo.userData.departamento = categoria;
        modelo.userData.recogido = false;
        modelo.userData.vendido = false;
        modelo.userData.reservado = false;
        modelo.userData.enCarrito = false;
        modelo.userData.disponible = true;
        modelo.userData.posicionEstante = { x, y, z };

        modelo.userData.rotacionEstante = {
            x: modelo.rotation.x,
            y: modelo.rotation.y,
            z: modelo.rotation.z
        };

        modelo.userData.escalaEstante = {
            x: modelo.scale.x,
            y: modelo.scale.y,
            z: modelo.scale.z
        };

        modelo.updateMatrixWorld(true);

        const cajaMedicion = new THREE.Box3().setFromObject(modelo);
        const tamanoFinal = new THREE.Vector3();

        cajaMedicion.getSize(tamanoFinal);

        modelo.userData.dimensionesFinales = {
            ancho: tamanoFinal.x,
            alto: tamanoFinal.y,
            profundidad: tamanoFinal.z
        };

        modelo.userData.superficieApoyo = y;
        modelo.userData.baseReal = cajaMedicion.min.y;

        productos.add(modelo);
        unidades.push(modelo);
        unidadesPorId.set(idUnidad, modelo);
        unidadesColocadas++;

        return modelo;
    }

    const posicionesPlatanos = [
        [-1.25, -0.62],
        [-0.625, -0.62],
        [0.00, -0.62],
        [0.625, -0.62],
        [1.25, -0.62],
        [-1.25, 0.00],
        [-0.625, 0.00],
        [0.00, 0.00],
        [0.625, 0.00],
        [1.25, 0.00],
        [-1.25, 0.62],
        [-0.625, 0.62],
        [0.00, 0.62],
        [0.625, 0.62],
        [1.25, 0.62]
    ];

    const MESA_PLATANOS = {
        x: -21.7,
        z: 15,
        y: 1.00
    };

    cargarModelo(
        '/modelos/Platano.glb',
        'Plátano',
        (original) => {
            const fuentes = crearFuentesIndependientes(original);

            if (!fuentes.length) {
                console.error('El modelo de plátano no contiene geometría.');
                return;
            }

            posicionesPlatanos.forEach(([dx, dz], indice) => {
                const fuente = fuentes[indice % fuentes.length];

                crearCopia(
                    fuente,
                    `PLATANO_N1_${indice + 1}`,
                    MESA_PLATANOS.x + dx,
                    MESA_PLATANOS.y,
                    MESA_PLATANOS.z + dz,
                    0.25,
                    Math.PI / 2,
                    'Frutas y verduras',
                    {
                        ancho: 0.42,
                        profundidad: 0.42,
                        idRack: 'Mesa_frescos_02'
                    }
                );
            });

            console.info(
                `🍌 Se colocaron ${posicionesPlatanos.length} plátanos.`
            );
        }
    );

    const gondolas = [
        [-17, -13], [-17, 0], [-17, 13],
        [-9, -13], [-9, 0], [-9, 13],
        [9, -13], [9, 0], [9, 13],
        [17, -13], [17, 0], [17, 13]
    ];

    const nivelesGondola = [
        0.4625,
        0.8925,
        1.3225,
        1.7525
    ];

    const offsetsZGondola = [
        -2.30,
        -1.15,
        0,
        1.15,
        2.30
    ];

    const gondolasPorDepartamento = {
        'Abarrotes': [0, 1],
        'Enlatados': [2],
        'Cereales': [3],
        'Snacks': [4, 5],
        'Dulces': [6],
        'Higiene personal': [7, 8],
        'Frutas y verduras': [9],
        'Limpieza': [10],
        'Higiene': [11]
    };

    const usoGondolasDepartamento = new Map();

    function obtenerFilaGondola(categoria = 'Abarrotes') {
        const indices = gondolasPorDepartamento[categoria] ?? [10];
        const contador = usoGondolasDepartamento.get(categoria) ?? 0;
        const capacidadPorGondola = nivelesGondola.length;
        const bloque = Math.floor(contador / capacidadPorGondola);
        const indiceLocal = contador % capacidadPorGondola;
        const indiceGondola = indices[bloque % indices.length];
        const nivel = indiceLocal;

        usoGondolasDepartamento.set(categoria, contador + 1);

        const [centroX, centroZ] = gondolas[indiceGondola];

        return {
            idRack: `Gondola_${String(indiceGondola + 1).padStart(2, '0')}_${categoria.replace(/[^A-Za-z0-9]/g, '_')}`,

            posiciones: [-1, 1].flatMap((lado) =>
                offsetsZGondola.map((offsetZ) => ({
                    x: centroX + lado * 0.52,
                    y: nivelesGondola[nivel],
                    z: centroZ + offsetZ,
                    rotacionY: lado * Math.PI / 2
                }))
            )
        };
    }

    const mesasFrutas = [
        { x: -25.5, z: 15, rack: 'Mesa_frescos_01' },
        { x: -21.7, z: 15, rack: 'Mesa_frescos_02' },
        { x: -25.5, z: 10.8, rack: 'Mesa_frescos_03' },
        { x: -21.7, z: 10.8, rack: 'Mesa_frescos_04' }
    ];

    const offsetsMesaFrutas = [
        [-1.30, -0.62],
        [-0.43, -0.62],
        [0.43, -0.62],
        [1.30, -0.62],
        [1.30, 0.00],
        [1.30, 0.62],
        [0.43, 0.62],
        [-0.43, 0.62],
        [-1.30, 0.62],
        [-1.30, 0.00],
        [-0.43, 0.00],
        [0.43, 0.00]
    ];

    const usoMesasFrutas = new Map();

    function obtenerPosicionesMesa(indiceMesa) {
        const mesa = mesasFrutas[indiceMesa];
        const inicio = usoMesasFrutas.get(indiceMesa) ?? 0;

        const posiciones = offsetsMesaFrutas.slice(
            inicio,
            inicio + 4
        );

        usoMesasFrutas.set(
            indiceMesa,
            inicio + posiciones.length
        );

        return {
            idRack: mesa.rack,

            posiciones: posiciones.map(([dx, dz]) => ({
                x: mesa.x + dx,
                y: 1.0,
                z: mesa.z + dz
            }))
        };
    }

    const refrigeradoresX = [
        -27,
        -23.5,
        -20,
        -16.5,
        16.5,
        20,
        23.5,
        27
    ];

    const nivelesRefrigerador = [
        0.5225,
        0.9525,
        1.3825,
        1.8125
    ];

    const offsetsXRefrigerador = [
        -1.05,
        -0.35,
        0.35,
        1.05
    ];

    function obtenerPosicionesRefrigerador(
        indiceRefrigerador,
        nivel,
        columna = null
    ) {
        const indiceSeguro = Math.max(
            0,
            Math.min(
                Number(indiceRefrigerador) || 0,
                refrigeradoresX.length - 1
            )
        );

        const x = refrigeradoresX[indiceSeguro];

        const offsets = columna === 0
            ? [-0.78, -0.35]
            : columna === 1
                ? [0.35, 0.78]
                : offsetsXRefrigerador;

        const nombresRefrigerador = [
            'Leches_y_lacteos',
            'Leches_y_lacteos',
            'Refrescos_y_bebidas',
            'Refrescos_y_bebidas',
            'Refrigerador_disponible',
            'Monster',
            'Cervezas',
            'Jugos_y_agua'
        ];

        const nivelSeguro = Math.max(
            0,
            Math.min(
                Number(nivel) || 0,
                nivelesRefrigerador.length - 1
            )
        );

        return {
            idRack: `Refrigerador_${String(indiceSeguro + 1).padStart(2, '0')}_${nombresRefrigerador[indiceSeguro]}`,

            posiciones: offsets.map((offsetX) => ({
                x: x + offsetX,
                y: nivelesRefrigerador[nivelSeguro],
                z: -26.5 + 0.30
            }))
        };
    }

    const nivelesHigiene = [
        0.47,
        0.82,
        1.17,
        1.52,
        1.87
    ];

    const offsetsXHigiene = [
        -0.75,
        0,
        0.75
    ];

    const usoModulosHigiene = new Map();


function obtenerPosicionesHigiene(categoria, nombre = '') {
    const nombreNormalizado = String(nombre).toLowerCase();

    const esPapel =
        nombreNormalizado.includes('papel') ||
        nombreNormalizado.includes('higienico');

    const esToallita =
        nombreNormalizado.includes('toallita') ||
        nombreNormalizado.includes('bebe');

    let modulo;

    if (esPapel || esToallita) {
        modulo = {
            x: 28.3,
            z: 12.5,
            id: 'Rack_toallitas_humedas'
        };
    } else {
        modulo = {
            x: 28.3,
            z: 8.0,
            id: 'Modulo_limpieza'
        };
    }

    const niveles = [0.47, 0.82, 1.17, 1.52, 1.87];
    const offsetsX = [-0.75, 0, 0.75];

    const indice = usoModulosHigiene.get(modulo.id) ?? 0;

    usoModulosHigiene.set(modulo.id, indice + 1);

    const nivel = Math.floor(indice / offsetsX.length);

    if (nivel >= niveles.length) {
        console.warn(
            `No hay más espacios disponibles en ${modulo.id} para ${nombre}`
        );

        return {
            idRack: modulo.id,
            posiciones: []
        };
    }

    return {
        idRack: modulo.id,
        posiciones: [{
            x: modulo.x + offsetsX[indice % offsetsX.length],
            y: niveles[nivel],
            z: modulo.z + 0.475
        }]
    };
}

    const catalogoProductosAdicionales = [
                // ====================================================
        // PASTELES
        // ====================================================

        {
            archivo: '/modelos/Pastel.glb',
            nombre: 'Pastel de fresa',
            categoria: 'Panadería',
            tipo: 'pasteleria',
            x: 24.45,
            y: 0.82,
            alto: 0.70,
            ancho: 0.60,
            profundidad: 0.60,
            rotacion: 0
        },

        {
            archivo: '/modelos/Pastel-Choco.glb',
            nombre: 'Pastel de chocolate',
            categoria: 'Panadería',
            tipo: 'pasteleria',
            x: 25.95,
            y: 1.16,
            alto: 0.70,
            ancho: 0.60,
            profundidad: 0.60,
            rotacion: 0
        },

        {
            archivo: '/modelos/Pastel-Zanahoria.glb',
            nombre: 'Pastel de zanahoria',
            categoria: 'Panadería',
            tipo: 'pasteleria',
            x: 24.45,
            y: 1.50,
            alto: 0.70,
            ancho: 0.60,
            profundidad: 0.60,
            rotacion: 0
        },


        // ====================================================
        // PANADERÍA
        // ====================================================

        {
            archivo: '/modelos/Bolillo.glb',
            nombre: 'Bolillo',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 24.35,
            y: 0.76,
            alto: 0.35,
            rotacion: 0
        },

        {
            archivo: '/modelos/Teleras.glb',
            nombre: 'Telera',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 26.05,
            y: 0.76,
            alto: 0.35,
            rotacion: 0
        },

        {
            archivo: '/modelos/PanCaja.glb',
            nombre: 'Pan de caja',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 24.15,
            y: 1.26,
            alto: 0.40,
            rotacion: 0
        },

        {
            archivo: '/modelos/ConchaVainilla.glb',
            nombre: 'Concha de vainilla',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 25.20,
            y: 1.26,
            alto: 0.30,
            rotacion: 0
        },

        {
            archivo: '/modelos/ConchaFresa.glb',
            nombre: 'Concha de fresa',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 26.25,
            y: 1.26,
            alto: 0.30,
            rotacion: 0
        },

        {
            archivo: '/modelos/Baguette.glb',
            nombre: 'Baguette',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 24.35,
            y: 1.76,
            alto: 0.45,
            rotacion: 0
        },

        {
            archivo: '/modelos/ConchaChocolate.glb',
            nombre: 'Concha de chocolate',
            categoria: 'Panadería',
            tipo: 'panaderia',
            x: 26.05,
            y: 1.76,
            alto: 0.30,
            rotacion: 0
        },
        { archivo: '/modelos/Aceite.glb', nombre: 'Aceite', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.36, ancho: 0.26, profundidad: 0.26 },
        { archivo: '/modelos/Atun.glb', nombre: 'Atún', categoria: 'Enlatados', tipo: 'gondola', alto: 0.28, ancho: 0.34, profundidad: 0.30 },
        { archivo: '/modelos/Azucar.glb', nombre: 'Azúcar', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.32, ancho: 0.38, profundidad: 0.34 },
        { archivo: '/modelos/Dorito.glb', nombre: 'Dorito', categoria: 'Snacks', tipo: 'gondola', alto: 0.28, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/DoritoDinamita.glb', nombre: 'Dorito Dinamita', categoria: 'Snacks', tipo: 'gondola', alto: 0.28, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/DoritoIconig.glb', nombre: 'Dorito Iconig', categoria: 'Snacks', tipo: 'gondola', alto: 0.28, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/DoritoPizeerola.glb', nombre: 'Dorito Pizzerola', categoria: 'Snacks', tipo: 'gondola', alto: 0.28, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/Frijoles.glb', nombre: 'Frijoles', categoria: 'Enlatados', tipo: 'gondola', alto: 0.30, ancho: 0.30, profundidad: 0.28 },
        { archivo: '/modelos/Sabrita.glb', nombre: 'Sabrita', categoria: 'Snacks', tipo: 'gondola', alto: 0.27, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/SabritasAdobadas.glb', nombre: 'Sabritas Adobadas', categoria: 'Snacks', tipo: 'gondola', alto: 0.27, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/SabritasLimon.glb', nombre: 'Sabritas Limón', categoria: 'Snacks', tipo: 'gondola', alto: 0.27, ancho: 0.25, profundidad: 0.20 },
        { archivo: '/modelos/cereal.glb', nombre: 'Cereal', categoria: 'Cereales', tipo: 'gondola', alto: 0.38, ancho: 0.30, profundidad: 0.24 },
        { archivo: '/modelos/cereal2.glb', nombre: 'Cereal 2', categoria: 'Cereales', tipo: 'gondola', alto: 0.38, ancho: 0.30, profundidad: 0.24 },
        { archivo: '/modelos/CafeLegal.glb', nombre: 'Cafe Legal', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.34, ancho: 0.26, profundidad: 0.20 },
        { archivo: '/modelos/CafeOrol.glb', nombre: 'Cafe Orol', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.34, ancho: 0.26, profundidad: 0.20 },
        { archivo: '/modelos/Nescafe.glb', nombre: 'Nescafe', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.34, ancho: 0.26, profundidad: 0.20 },
        { archivo: '/modelos/ChocoDulce.glb', nombre: 'Choco Dulce', categoria: 'Dulces', tipo: 'gondola', alto: 0.28, ancho: 0.22, profundidad: 0.20 },
        { archivo: '/modelos/FresaDulce.glb', nombre: 'Fresa Dulce', categoria: 'Dulces', tipo: 'gondola', alto: 0.28, ancho: 0.22, profundidad: 0.20 },
        { archivo: '/modelos/VanillaDulce.glb', nombre: 'Vanilla Dulce', categoria: 'Dulces', tipo: 'gondola', alto: 0.28, ancho: 0.22, profundidad: 0.20 },
        { archivo: '/modelos/Mayonesa.glb', nombre: 'Mayonesa', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.30, ancho: 0.24, profundidad: 0.22 },
        { archivo: '/modelos/Mermelada.glb', nombre: 'Mermelada', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.30, ancho: 0.24, profundidad: 0.22 },
        { archivo: '/modelos/Mostaza.glb', nombre: 'Mostaza', categoria: 'Abarrotes', tipo: 'gondola', alto: 0.30, ancho: 0.24, profundidad: 0.22 },
        { archivo: '/modelos/BarraJabon.glb', nombre: 'Jabon', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.22, ancho: 0.22, profundidad: 0.14 },
        { archivo: '/modelos/BarraJabonMorado.glb', nombre: 'Jabon morado', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.22, ancho: 0.22, profundidad: 0.14 },
        { archivo: '/modelos/BarraJabonRosa.glb', nombre: 'Jabon rosa', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.22, ancho: 0.22, profundidad: 0.14 },
        { archivo: '/modelos/BarraJabonVerde.glb', nombre: 'Jabon verde', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.22, ancho: 0.22, profundidad: 0.14 },
        { archivo: '/modelos/PastaDental.glb', nombre: 'Pasta dental', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.30, ancho: 0.26, profundidad: 0.12 },
        { archivo: '/modelos/desodorante.glb', nombre: 'Desodorante', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.30, ancho: 0.15, profundidad: 0.15 },
        { archivo: '/modelos/shampooGold.glb', nombre: 'Shampoo Gold', categoria: 'Higiene personal', tipo: 'gondola', alto: 0.34, ancho: 0.20, profundidad: 0.14 },

      
        { archivo: '/modelos/Agua.glb', nombre: 'Agua', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 7, nivel: 0, alto: 0.43, ancho: 0.25, profundidad: 0.25 },

        
        { archivo: '/modelos/Lala.glb', nombre: 'Lala', categoria: 'Lacteos', tipo: 'refrigerador', refrigerador: 0, nivel: 0, alto: 0.38, ancho: 0.30, profundidad: 0.26 },
        { archivo: '/modelos/Pepsi. y coca.glb', nombre: 'Pepsi y Coca', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 2, nivel: 1, alto: 0.42, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/Pepsi.glb', nombre: 'Pepsi', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 2, nivel: 2, alto: 0.42, ancho: 0.24, profundidad: 0.24 },
        { archivo: '/modelos/SantaClara.glb', nombre: 'Santa Clara', categoria: 'Lacteos', tipo: 'refrigerador', refrigerador: 0, nivel: 1, alto: 0.38, ancho: 0.30, profundidad: 0.26 },
        { archivo: '/modelos/cocacola.glb', nombre: 'Coca-Cola', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 2, nivel: 3, alto: 0.42, ancho: 0.24, profundidad: 0.24 },
        { archivo: '/modelos/nesquik.glb', nombre: 'Nesquik', categoria: 'Lacteos', tipo: 'refrigerador', refrigerador: 0, nivel: 2, alto: 0.38, ancho: 0.30, profundidad: 0.26 },

        { archivo: '/modelos/Fanta.glb', nombre: 'Fanta', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 3, nivel: 0, alto: 0.42, ancho: 0.24, profundidad: 0.24 },
        { archivo: '/modelos/FantaFresa.glb', nombre: 'Fanta Fresa', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 3, nivel: 1, alto: 0.42, ancho: 0.24, profundidad: 0.24 },
        { archivo: '/modelos/FantaUva.glb', nombre: 'Fanta Uva', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 3, nivel: 2, alto: 0.42, ancho: 0.24, profundidad: 0.24 },

        { archivo: '/modelos/Monster.glb', nombre: 'Monster', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 5, nivel: 0, alto: 0.38, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/MonsterBlanca.glb', nombre: 'Monster Blanca', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 5, nivel: 1, alto: 0.38, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/MonsterRosa.glb', nombre: 'Monster Rosa', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 5, nivel: 2, alto: 0.38, ancho: 0.22, profundidad: 0.22 },

        { archivo: '/modelos/Brocoli.glb', nombre: 'Brocoli', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 0, alto: 0.28, ancho: 0.30, profundidad: 0.28 },

        { archivo: '/modelos/Elote.glb', nombre: 'Elote', categoria: 'Frutas y verduras', tipo: 'gondola', alto: 0.30, ancho: 0.24, profundidad: 0.24 },

        { archivo: '/modelos/Limon.glb', nombre: 'Limon', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 0, alto: 0.20, ancho: 0.20, profundidad: 0.20 },

        { archivo: '/modelos/Jalapeño.glb', nombre: 'Jalapeno', categoria: 'Frutas y verduras', tipo: 'gondola', alto: 0.20, ancho: 0.20, profundidad: 0.20 },

        { archivo: '/modelos/Mazana.glb', nombre: 'Manzana', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 2, alto: 0.22, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Pepino.glb', nombre: 'Pepino', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 2, alto: 0.28, ancho: 0.22, profundidad: 0.22 },

        { archivo: '/modelos/Pera.glb', nombre: 'Pera', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 3, alto: 0.22, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Uvas.glb', nombre: 'Uvas', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 3, alto: 0.24, ancho: 0.28, profundidad: 0.24 },

        { archivo: '/modelos/Nutrileche.glb', nombre: 'Nutrileche', categoria: 'Lacteos', tipo: 'refrigerador', refrigerador: 0, nivel: 3, alto: 0.38, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/LechePura.glb', nombre: 'Leche Pura', categoria: 'Lacteos', tipo: 'refrigerador', refrigerador: 1, nivel: 0, alto: 0.38, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/Naranja.glb', nombre: 'Naranja', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 3, alto: 0.28, ancho: 0.28, profundidad: 0.28 },

        { archivo: '/modelos/PIÑA.glb', nombre: 'Piña', categoria: 'Frutas y verduras', tipo: 'mesa', mesa: 2, alto: 0.42, ancho: 0.38, profundidad: 0.38 },

     
        { archivo: '/modelos/costilla.glb', nombre: 'Costilla', categoria: 'Carniceria', tipo: 'mostrador', alto: 0.30, ancho: 0.38, profundidad: 0.32 },
        { archivo: '/modelos/salchichas.glb', nombre: 'Salchichas', categoria: 'Carniceria', tipo: 'mostrador', alto: 0.28, ancho: 0.38, profundidad: 0.30 },

      
        { archivo: '/modelos/Limonada.glb', nombre: 'Limonada', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 7, nivel: 1, alto: 0.40, ancho: 0.24, profundidad: 0.24 },
        { archivo: '/modelos/Naranjada.glb', nombre: 'Naranjada', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 7, nivel: 2, alto: 0.40, ancho: 0.24, profundidad: 0.24 },

        { archivo: '/modelos/Cerveza Lager.glb', nombre: 'Cerveza Lager', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 6, nivel: 0, columna: 0, alto: 0.36, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Cerveza XX.glb', nombre: 'Cerveza XX', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 6, nivel: 0, columna: 1, alto: 0.36, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Cerveza Corona.glb', nombre: 'Cerveza Corona', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 6, nivel: 1, columna: 0, alto: 0.36, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Cerveza Barrilitio.glb', nombre: 'Cerveza Barrilitio', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 6, nivel: 1, columna: 1, alto: 0.36, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Carta Blanca.glb', nombre: 'Carta Blanca', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 6, nivel: 2, columna: 0, alto: 0.36, ancho: 0.22, profundidad: 0.22 },
        { archivo: '/modelos/Tecate.glb', nombre: 'Tecate', categoria: 'Bebidas', tipo: 'refrigerador', refrigerador: 6, nivel: 2, columna: 1, alto: 0.36, ancho: 0.22, profundidad: 0.22 },

       
        { archivo: '/modelos/cloro_liquido.glb', nombre: 'Cloro liquido', categoria: 'Limpieza', tipo: 'higiene', alto: 0.38, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/detergente_liquido.glb', nombre: 'Detergente liquido', categoria: 'Limpieza', tipo: 'higiene', alto: 0.38, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/detergente_liquido1.glb', nombre: 'Detergente liquido 2', categoria: 'Limpieza', tipo: 'higiene', alto: 0.38, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/limpiador_multiusos.glb', nombre: 'Limpiador multiusos', categoria: 'Limpieza', tipo: 'higiene', alto: 0.36, ancho: 0.28, profundidad: 0.25 },
        { archivo: '/modelos/suavizante_liquido.glb', nombre: 'Suavizante', categoria: 'Limpieza', tipo: 'higiene', alto: 0.38, ancho: 0.28, profundidad: 0.25 },

        { archivo: '/modelos/papel.glb', nombre: 'Papel', categoria: 'Higiene', tipo: 'higiene', alto: 0.34, ancho: 0.30, profundidad: 0.28 },
        { archivo: '/modelos/toallitas_bebe.glb', nombre: 'Toallitas para bebe', categoria: 'Higiene', tipo: 'higiene', alto: 0.28, ancho: 0.30, profundidad: 0.24 },

     
        { archivo: '/modelos/Filete.glb', nombre: 'Filete', categoria: 'Carniceria', tipo: 'mostrador', alto: 0.24, ancho: 0.32, profundidad: 0.28 },
        { archivo: '/modelos/Pollo.glb', nombre: 'Pollo', categoria: 'Carniceria', tipo: 'mostrador', alto: 0.28, ancho: 0.34, profundidad: 0.30 },

        { archivo: '/modelos/Blusa.glb', nombre: 'Blusa', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 },
        { archivo: '/modelos/SudaderaNegra.glb', nombre: 'Sudadera negra', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 },
        { archivo: '/modelos/camisaAzul.glb', nombre: 'Camisa azul', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 },
        { archivo: '/modelos/chamarranegra.glb', nombre: 'Chamarra negra', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 },
        { archivo: '/modelos/pantalomezclilla.glb', nombre: 'Pantalon de mezclilla', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 },
        { archivo: '/modelos/sudaderaroja.glb', nombre: 'Sudadera roja', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 },
        { archivo: '/modelos/vesitdo.glb', nombre: 'Vestido', categoria: 'Ropa', tipo: 'ropa', alto: 0.72, ancho: 0.42, profundidad: 0.24 }
    ];

    let siguientePerchero = 0;
    let siguienteMostrador = 0;

    function obtenerUbicacion(catalogo) {
        if (catalogo.tipo === 'gondola') {
            return obtenerFilaGondola(catalogo.categoria);
        }

        if (catalogo.tipo === 'mesa') {
            return obtenerPosicionesMesa(catalogo.mesa);
        }

        if (catalogo.tipo === 'refrigerador') {
            return obtenerPosicionesRefrigerador(
                catalogo.refrigerador,
                catalogo.nivel,
                catalogo.columna ?? null
            );
        }

        if (catalogo.tipo === 'higiene') {
            return obtenerPosicionesHigiene(
                catalogo.categoria,
                catalogo.nombre
            );
        }

                // VITRINA DE PASTELES
        if (catalogo.tipo === 'pasteleria') {
            return {
                idRack: 'Vitrina_pasteles',
                posiciones: [{
                    x: catalogo.x,
                    y: catalogo.y,
                    z: -20.0
                }]
            };
        }

        // EXHIBIDOR DE PANADERÍA
        if (catalogo.tipo === 'panaderia') {
            return {
                idRack: 'Exhibidor_panaderia',
                posiciones: [{
                    x: catalogo.x,
                    y: catalogo.y,
                    z: -15.5
                }]
            };
        }

        if (catalogo.tipo === 'mostrador') {
            const indice = siguienteMostrador++;

            const offsets = indice % 2 === 0
                ? [-1.0, -0.5, 0]
                : [0.5, 1.0, 1.25];

            const filaZ = Math.floor(indice / 2) * 0.42;

            return {
                idRack: 'Mostrador_carniceria',

                posiciones: offsets.map((offsetX) => ({
                    x: 25.1 + offsetX,
                    y: 1.26,
                    z: -7.3 + filaZ
                }))
            };
        }

        const percheros = [
            { x: -25.7, z: -4, rack: 'Perchero_ropa_01' },
            { x: -25.7, z: 2, rack: 'Perchero_ropa_02' },
            { x: -25.7, z: 8, rack: 'Perchero_ropa_03' }
        ];

        const indice = siguientePerchero++;

        const indicePerchero =
            indice < 2 ? 0 : indice < 4 ? 1 : 2;

        const articuloEnPerchero =
            indicePerchero === 0
                ? indice
                : indicePerchero === 1
                    ? indice - 2
                    : indice - 4;

        const percha = percheros[indicePerchero];

        const offsetsPorPerchero = [
            [[-0.9, -0.3], [0.3, 0.9]],
            [[-0.9, -0.3], [0.3, 0.9]],
            [[-1.1, -0.66], [-0.22, 0.22], [0.66, 1.1]]
        ];

        const offsets =
            offsetsPorPerchero[indicePerchero][articuloEnPerchero];

        return {
            idRack: percha.rack,

            posiciones: offsets.map((offsetX) => ({
                x: percha.x + offsetX,
                y: 1.0,
                z: percha.z
            }))
        };
    }

    function colocarCatalogoProductos(catalogo) {
        const ubicacion = obtenerUbicacion(catalogo);

        const clave = catalogo.archivo
            .split('/')
            .pop()
            .replace(/\.glb$/i, '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9]/g, '')
            .toUpperCase();

        cargarModelo(
            catalogo.archivo,
            catalogo.nombre,
            (original) => {
                const fuentes = crearFuentesIndependientes(original);

                if (
                    !fuentes.length ||
                    !ubicacion.posiciones.length
                ) {
                    console.warn(
                        `No se pudo preparar ${catalogo.nombre} para su rack.`
                    );
                    return;
                }

                ubicacion.posiciones.forEach((posicion, indice) => {
                    const fuente = fuentes[indice % fuentes.length];

                    crearCopia(
                        fuente,
                        `${clave}_${indice + 1}`,
                        posicion.x,
                        posicion.y,
                        posicion.z,
                        catalogo.alto,
                        catalogo.rotacion ??
                            posicion.rotacionY ??
                            ubicacion.rotacionY ??
                            Math.PI / 2,
                        catalogo.categoria,
                        {
                            ancho: catalogo.ancho,
                            profundidad: catalogo.profundidad,
                            idRack: ubicacion.idRack
                        }
                    );
                });

                console.info(
                    `Se colocaron ${ubicacion.posiciones.length} unidades de ${catalogo.nombre} en ${ubicacion.idRack}.`
                );
            }
        );
    }

    catalogoProductosAdicionales.forEach(
        colocarCatalogoProductos
    );

    productos.userData.obtenerResumen = () => ({
        modelosCargados,
        unidadesColocadas,
        modelosFallidos
    });

    productos.userData.listarUnidades = () => {
        return [...unidades];
    };

    productos.userData.obtenerPorCategoria = (categoria) => {
        return unidades.filter((objeto) => {
            return objeto.userData.categoria === categoria;
        });
    };

    productos.userData.obtenerDisponibles = () => {
        return unidades.filter((objeto) => {
            const datos = objeto.userData;

            return (
                datos.disponible &&
                !datos.recogido &&
                !datos.vendido &&
                !datos.reservado &&
                !datos.enCarrito
            );
        });
    };

    productos.userData.obtenerPorCodigo = (codigo) => {
        return unidades.filter((objeto) => {
            return objeto.userData.codigoCatalogo === codigo;
        });
    };

    productos.userData.obtenerPlatanosDisponibles = () => {
        return unidades.filter((objeto) => {
            const datos = objeto.userData;

            return (
                datos.codigoCatalogo === 'PLATANO' &&
                datos.disponible &&
                !datos.recogido &&
                !datos.vendido &&
                !datos.reservado &&
                !datos.enCarrito
            );
        });
    };

    productos.userData.buscarPorId = (idUnidad) => {
        return unidadesPorId.get(idUnidad) ?? null;
    };

    productos.userData.obtenerEstadisticas = () => {
        let disponibles = 0;
        let recogidos = 0;
        let vendidos = 0;
        let reservados = 0;

        for (const unidad of unidades) {
            const datos = unidad.userData;

            if (
                datos.disponible &&
                !datos.recogido &&
                !datos.vendido
            ) {
                disponibles++;
            }

            if (datos.recogido) recogidos++;
            if (datos.vendido) vendidos++;
            if (datos.reservado) reservados++;
        }

        return {
            total: unidades.length,
            disponibles,
            recogidos,
            vendidos,
            reservados,
            modelosCargados,
            modelosFallidos,
            platanosDisponibles:
                productos.userData.obtenerPlatanosDisponibles().length
        };
    };

    productos.userData.obtenerCatalogoPrecios = () => {
        return { ...PRECIOS };
    };

    productos.userData.obtenerPrecio = (codigo) => {
        return PRECIOS[codigo] ?? 0;
    };

    console.info(
        'Catálogo del supermercado iniciado. Los 15 plátanos tienen precio de $8 MXN; los demás productos requieren precio configurado en PRECIOS.'
    );

    return productos;
}
