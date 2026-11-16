

const URL_IMAGENES = 'https://image.tmdb.org/t/p/'


export function limpiar(texto = "") {
    const simbolos = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return String(texto).replace(/[&<>"']/g, (simbolo) => simbolos[simbolo])
}


export function urlImagen(ruta, tamanio = 'w342') {
    return ruta ? `${URL_IMAGENES}${tamanio}${ruta}` : ""
}


export function anioDe(fecha) {
    return fecha ? fecha.slice(0, 4) : "Sin fecha"
}


export function notaDe(voto) {
    return voto > 0 ? voto.toFixed(1) : ""
}