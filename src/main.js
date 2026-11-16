import { ObtenerPeliculasPopulares, buscarPeliculasPorTitulo } from './api/peliculas'
import { abrirDetalles } from './detalles'
import { limpiar, urlImagen, anioDe, notaDe } from './utilidades'
import './style.css'

const formBuscar = document.querySelector('#formBuscar')
const inputBuscar = document.querySelector('#inputBuscar')
const mensaje = document.querySelector('#mensaje')
const resultados = document.querySelector('#resultados')
const tituloSeccion = document.querySelector('#tituloSeccion')
const contador = document.querySelector('#contador')

// películas que se están mostrando ahora (para abrir sus detalles al hacer clic)
let peliculasEnPantalla = []

// arma el HTML de una tarjeta
function crearTarjeta(pelicula, posicion) {
    const titulo = limpiar(pelicula.title)
    const anio = anioDe(pelicula.release_date)
    const nota = notaDe(pelicula.vote_average)
    const sinopsis = limpiar(pelicula.overview || "Sin sinopsis disponible.")

    const poster = pelicula.poster_path
        ? `<img src="${urlImagen(pelicula.poster_path)}" alt="Póster de ${titulo}" loading="lazy" />`
        : `<div class="sin-poster">${titulo}</div>`

    return `
        <article class="tarjeta" data-id="${pelicula.id}" tabindex="0" role="button"
            aria-label="Ver detalles de ${titulo}" style="--i: ${Math.min(posicion, 20)}">
            <div class="poster">
                ${poster}
                ${nota ? `<span class="nota">★ ${nota}</span>` : ""}

                <!-- capa que aparece al pasar el mouse -->
                <div class="capa">
                    <p class="capa-titulo">${titulo}</p>
                    <p class="capa-datos">${anio} · ${nota ? `<span>★</span> ${nota}` : "Sin calificación"}</p>
                    <p class="capa-sinopsis">${sinopsis}</p>
                    <span class="ver-detalles">Ver detalles →</span>
                </div>
            </div>
            <h3>${titulo}</h3>
            <p class="anio">${anio}</p>
        </article>
    `
}

// pinta en pantalla un arreglo de películas
function pintarPeliculas(peliculas, titulo) {
    peliculasEnPantalla = peliculas
    tituloSeccion.textContent = titulo
    contador.textContent = peliculas.length === 1 ? "1 película" : `${peliculas.length} películas`
    resultados.innerHTML = peliculas.map(crearTarjeta).join("")
}

// tarjetas grises animadas mientras llega la respuesta
function mostrarCarga(titulo) {
    tituloSeccion.textContent = titulo
    contador.textContent = ""
    mensaje.textContent = "Cargando..."
    resultados.innerHTML = `
        <div class="tarjeta esqueleto">
            <div class="poster"></div>
            <div class="linea"></div>
            <div class="linea corta"></div>
        </div>
    `.repeat(12)
}

function mostrarAviso(texto) {
    resultados.innerHTML = ""
    contador.textContent = ""
    mensaje.textContent = texto
}

async function cargarPopulares() {
    inputBuscar.value = ""
    mostrarCarga("Populares ahora")

    try {
        const data = await ObtenerPeliculasPopulares()
        // funciona tanto si la función devuelve { results: [...] } como el arreglo directo
        const peliculas = data.results ?? data

        mensaje.textContent = ""
        pintarPeliculas(peliculas, "Populares ahora")
    } catch (error) {
        mostrarAviso("Error de conexión. Intenta de nuevo más tarde.")
    }
}

async function buscar() {
    const texto = inputBuscar.value.trim()

    if (texto === "") {
        mostrarAviso("Escribe el nombre de una película.")
        return
    }

    mostrarCarga(`Resultados para "${texto}"`)

    try {
        const data = await buscarPeliculasPorTitulo(texto)

        if (data.results.length === 0) {
            mostrarAviso("Película no encontrada")
            return
        }

        mensaje.textContent = ""
        pintarPeliculas(data.results, `Resultados para "${texto}"`)
    } catch (error) {
        mostrarAviso("Error de conexión. Intenta de nuevo más tarde.")
    }
}

// abre los detalles de la tarjeta que recibió el clic o la tecla
function abrirDesdeEvento(evento) {
    const tarjeta = evento.target.closest('.tarjeta[data-id]')
    if (!tarjeta) return

    const pelicula = peliculasEnPantalla.find((peli) => String(peli.id) === tarjeta.dataset.id)
    if (!pelicula) return

    evento.preventDefault()
    abrirDetalles(pelicula)
}

// el formulario permite buscar con el botón o con la tecla Enter
formBuscar.addEventListener('submit', (evento) => {
    evento.preventDefault()
    buscar()
})

document.querySelector('#btnPopulares').addEventListener('click', cargarPopulares)

// un solo evento en el contenedor sirve para todas las tarjetas
resultados.addEventListener('click', abrirDesdeEvento)
resultados.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') abrirDesdeEvento(evento)
})

// al abrir la página se muestran las populares
cargarPopulares()