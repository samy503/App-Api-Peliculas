// Capa para consumir los personajes de dragonball de una API

// funcion asincronica que se ejecuta en segundo plano
export async function obtenerPersonajes() {
    // fetch => es el metodo que permite consumir un endpoint de una API (GET)
    const response = await fetch("https://dragonball-api.com/api/characters") //promesa (respuesta donde se puede cumplir o no)

    // data recibe los datos ya formateados en json para poder trabajar con ellos
    const data = await response.json()
    return data
}

// metodo para mostrar la informacion de los personajes
export async function mostrarPersonajes() {
    // obteniendo la lista de personajes
    const response = await obtenerPersonajes()
    //console.log(response)
    // de la respuesta de la api, solo accedemos al arreglo de los personajes
    const listaPersonajes = response.items; //[]

    //iterando el arreglo de personajes
    return listaPersonajes.map((personaje) => {
        console.log(personaje)

        return `
            <div>
                <h2>${personaje.name}</h2>
                <p>Raza: ${personaje.race}</p>
                <img src=${personaje.image} style="width: 100px" />
            </div>
        `
    })
}

// sincronica
function saludo() {

}