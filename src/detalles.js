// Vista detallada de una película (ventana modal)
import { obtenerDetallesPelicula } from './api/peliculas'
import { limpiar, urlImagen, anioDe, notaDe } from './utilidades'
import './detalles.css'

const NO_DISPONIBLE = "No disponible"
const DURACION_CIERRE = 200 // milisegundos, igual que la animación de cierre en detalles.css

const nombresIdioma = new Intl.DisplayNames(['es'], { type: 'language' })
const nombresPais = new Intl.DisplayNames(['es'], { type: 'region' })

let ventana = null
let contenido = null
let idAbierto = null

// ---------- Formato de los datos ----------

// 135 -> "2 h 15 min"
function duracion(minutos) {
    if (!minutos) return ""
    const horas = Math.floor(minutos / 60)
    const resto = minutos % 60
    return horas > 0 ? `${horas} h ${resto} min` : `${resto} min`
}

// "2026-05-01" -> "1 de mayo de 2026"
function fechaLarga(fecha) {
    if (!fecha) return ""
    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

// "en" -> "Inglés"
function idioma(codigo) {
    if (!codigo) return ""
    try {
        const nombre = nombresIdioma.of(codigo)
        return nombre.charAt(0).toUpperCase() + nombre.slice(1)
    } catch (error) {
        return codigo
    }
}

// ["US", "MX"] -> "Estados Unidos, México"
function paises(pelicula) {
    const codigos = pelicula.production_countries?.length
        ? pelicula.production_countries.map((pais) => pais.iso_3166_1)
        : pelicula.origin_country ?? []

    return codigos.map((codigo) => {
        try {
            return nombresPais.of(codigo)
        } catch (error) {
            return codigo
        }
    }).join(", ")
}

function directores(pelicula) {
    const equipo = pelicula.credits?.crew ?? []
    return equipo.filter((persona) => persona.job === "Director").map((persona) => persona.name).join(", ")
}

// ---------- Piezas de HTML reutilizables ----------

// una fila de la ficha técnica; si el dato no existe se avisa en vez de inventarlo
function dato(etiqueta, valor, pendiente) {
    return `
        <div class="dato">
            <dt>${etiqueta}</dt>
            <dd>${valor ? limpiar(valor) : pendiente}</dd>
        </div>
    `
}

function actor(persona) {
    const foto = persona.profile_path
        ? `<img src="${urlImagen(persona.profile_path, 'w185')}" alt="" loading="lazy" />`
        : `<span class="inicial">${limpiar(persona.name.charAt(0))}</span>`

    return `
        <li>
            ${foto}
            <div>
                <strong>${limpiar(persona.name)}</strong>
                <span>${limpiar(persona.character || "Personaje no disponible")}</span>
            </div>
        </li>
    `
}

// ---------- Plantilla de la vista ----------

// estado puede ser "cargando", "listo" o "error"
function plantilla(pelicula, estado) {
    const pendiente = estado === "cargando" ? "Cargando…" : NO_DISPONIBLE
    const titulo = limpiar(pelicula.title || "Título no disponible")
    const nota = notaDe(pelicula.vote_average)
    const votos = pelicula.vote_count ? ` · ${pelicula.vote_count.toLocaleString('es')} votos` : ""
    const reparto = pelicula.credits?.cast?.slice(0, 8) ?? []

    const fondo = pelicula.backdrop_path
        ? `<img class="detalles-fondo" src="${urlImagen(pelicula.backdrop_path, 'w1280')}" alt="" />`
        : `<div class="detalles-fondo sin-fondo"></div>`

    const poster = pelicula.poster_path
        ? `<img class="detalles-poster" src="${urlImagen(pelicula.poster_path, 'w500')}" alt="Póster de ${titulo}" />`
        : `<div class="detalles-poster sin-poster">Póster no disponible</div>`

    const generos = pelicula.genres?.length
        ? pelicula.genres.map((genero) => `<li>${limpiar(genero.name)}</li>`).join("")
        : `<li class="vacio">${estado === "cargando" ? "Cargando géneros…" : "Géneros no disponibles"}</li>`

    const listaReparto = reparto.length
        ? `<ul class="reparto">${reparto.map(actor).join("")}</ul>`
        : `<p class="vacio">${estado === "cargando" ? "Cargando reparto…" : "Reparto no disponible."}</p>`

    const aviso = estado === "error"
        ? `<p class="detalles-aviso">No se pudo cargar la información completa. Revisa tu conexión e inténtalo de nuevo.</p>`
        : ""

    return `
        ${fondo}

        <div class="detalles-cabecera">
            ${poster}
            <div class="detalles-titulos">
                <h2 id="detallesTitulo">${titulo}</h2>
                <p class="original">Título original: <span>${limpiar(pelicula.original_title || NO_DISPONIBLE)}</span></p>

                <ul class="resumen">
                    <li>${anioDe(pelicula.release_date)}</li>
                    <li>${nota ? `<span class="estrella">★</span> <strong>${nota}</strong> / 10${votos}` : "Sin calificación"}</li>
                    <li>${duracion(pelicula.runtime) || (estado === "cargando" ? "Cargando duración…" : "Duración no disponible")}</li>
                </ul>

                <ul class="generos">${generos}</ul>
            </div>
        </div>

        <div class="detalles-cuerpo">
            <div>
                ${aviso}
                <h3>Sinopsis</h3>
                <p class="sinopsis-completa">${limpiar(pelicula.overview || "Sinopsis no disponible.")}</p>

                <h3>Reparto principal</h3>
                ${listaReparto}
            </div>

            <dl class="ficha">
                ${dato("Director", directores(pelicula), pendiente)}
                ${dato("Fecha de lanzamiento", fechaLarga(pelicula.release_date), NO_DISPONIBLE)}
                ${dato("Idioma original", idioma(pelicula.original_language), NO_DISPONIBLE)}
                ${dato("País de origen", paises(pelicula), pendiente)}
            </dl>
        </div>
    `
}

// ---------- Abrir y cerrar ----------

// la ventana se crea una sola vez, la primera vez que se necesita
function crearVentana() {
    ventana = document.createElement('dialog')
    ventana.className = 'detalles'
    ventana.setAttribute('aria-labelledby', 'detallesTitulo')
    ventana.innerHTML = `
        <div class="detalles-caja">
            <button type="button" class="detalles-cerrar" aria-label="Cerrar detalles">✕</button>
            <div class="detalles-contenido"></div>
        </div>
    `
    document.body.append(ventana)
    contenido = ventana.querySelector('.detalles-contenido')

    // clic en la X
    ventana.querySelector('.detalles-cerrar').addEventListener('click', cerrarDetalles)

    // clic fuera de la caja (sobre el fondo oscuro)
    ventana.addEventListener('click', (evento) => {
        if (evento.target === ventana) cerrarDetalles()
    })

    // tecla ESC
    ventana.addEventListener('cancel', (evento) => {
        evento.preventDefault()
        cerrarDetalles()
    })
}

// recibe la película tal como llegó en la lista (populares o búsqueda)
export async function abrirDetalles(pelicula) {
    if (!ventana) crearVentana()

    // se muestra de inmediato con los datos que ya tenemos...
    idAbierto = pelicula.id
    contenido.innerHTML = plantilla(pelicula, "cargando")
    contenido.scrollTop = 0
    document.documentElement.classList.add('sin-scroll')
    if (!ventana.open) ventana.showModal()

    // ...y se completa cuando llega el resto (duración, géneros, director, reparto)
    let completa = pelicula
    let estado = "listo"

    try {
        const detalles = await obtenerDetallesPelicula(pelicula.id)
        completa = { ...pelicula, ...detalles }
    } catch (error) {
        estado = "error"
    }

    // si mientras tanto se cerró la ventana o se abrió otra película, no se pinta nada
    if (idAbierto === pelicula.id) {
        contenido.innerHTML = plantilla(completa, estado)
    }
}

export function cerrarDetalles() {
    if (!ventana || !ventana.open || ventana.classList.contains('cerrando')) return

    idAbierto = null
    ventana.classList.add('cerrando') // dispara la animación de salida

    setTimeout(() => {
        ventana.classList.remove('cerrando')
        ventana.close()
        document.documentElement.classList.remove('sin-scroll')
    }, DURACION_CIERRE)
}