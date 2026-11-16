const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = import.meta.env.VITE_URL_BASE_API

export async function ObtenerPeliculasPopulares() {
    const response = await fetch(`${BASE_URL}movie/popular?api_key=${API_KEY}&language=es-MX`);
    const data = await response.json();
    return data;
}

export async function mostrarPeliculas() {
    const data = await ObtenerPeliculasPopulares();

    return data.results.map((pelicula) => {
        return `
            <div class="tarjeta">
                <img src="https://image.tmdb.org/t/p/w300${pelicula.poster_path}" alt="${pelicula.title}" />
                <h2>${pelicula.title}</h2>
                <p class="anio">Año: ${pelicula.release_date.slice(0, 4)}</p>
                <p class="sinopsis">${pelicula.overview}</p>
            </div>
        `
    })
}

export async function buscarPeliculasPorTitulo(titulo) {
    const response = await fetch(`${BASE_URL}search/movie?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(titulo)}`);
    const data = await response.json();
    return data;
}

export async function buscarPeliculaByTitulo(titulo) {
    const response = await fetch(`${BASE_URL}search/movie?api_key=${API_KEY}&language=es-MX&query=${titulo}`);
    const data = await response.json();
    return data.results;
}


export async function obtenerDetallesPelicula(id) {
    const response = await fetch(`${BASE_URL}movie/${id}?api_key=${API_KEY}&language=es-MX&append_to_response=credits`);

    if (!response.ok) {
        throw new Error("No se pudieron obtener los detalles de la película")
    }

    const data = await response.json();
    return data;
}