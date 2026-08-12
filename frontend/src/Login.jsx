import {useState, useEffect} from 'react';

export default function Micomponente() {
    const [mensaje, setMensaje] = useState("Cargando mensaje...")

    useEffect(() => {
    fetch("http://localhost:8000/mensaje")
        .then((response) => response.json())
        .then((data) => setMensaje(data.texto))
        .catch((error) => setMensaje("Error al cargar el servidor"));
    }, []);

    return (
        <h1>{mensaje}</h1>
    );
}