const CreateEventForm = () => {

    const createEvent = () => {
        e.preventDefault()
    }

    return(
        <>
            <form onSubmit={() => createEvent()} encType="multipart/form-data">
                <div>
                    <label>Pais del evento</label>
                    <select name="paisDestino">
                        <option value="argentina">Argentina</option>
                        <option value="chile">Chile</option>
                        <option value="uruguay">Uruguay</option>
                    </select>
                </div>
                <div>
                    <label>Privacidad del evento:</label>
                    <select name="tipoEvento">
                        <option value="publico">Publico</option>
                        <option value="privado">Privado</option>
                    </select>
                </div>
                <div>
                    <label>Evento para mayores de edad:</label>
                    <select name="tipoEvento">
                        <option value={1}>Si</option>
                        <option value={2}>No</option>
                    </select>
                </div>
                <div>
                    <label>Nombre del evento:</label>
                    <input type="text"  placeholder="..." name="nombreEvento"></input>
                </div>
                  <div>
                    <label>Descripcion del evento:</label>
                    <input type="text"  placeholder="..." name="descripcionEvento"></input>
                </div>
                <div>
                    <label>Categorias del evento:</label>
                    <input type="text"  placeholder="..." name="categorias"></input>
                </div>
                <div>
                    <label>Artistas que participan:</label>
                    <input type="text"  placeholder="..." name="artistas"></input>
                </div>
                <div>
                    <label>Monto de ventas estimado</label>
                    <input type="number" placeholder="0" name="montoVentas"></input>
                </div>
                <div>
                    <label>Fecha y hora de inicio:</label>
                </div>
                 <div>
                    <label>Fecha y hora de fin:</label>
                </div>
                 <div className="flex items-center">
                    <div>
                        <label>Provincia:</label>
                        <select name="provincia">
                            <option value="prov">mostrar provincias</option>
                        </select>
                    </div>
                      <div>
                        <label>Localidad</label>
                        <select name="localidad">
                            <option value="locald">mostrar localidad</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Direccion:</label>
                    <input name="direccion" placeholder="..."></input>
                </div>
                 <div>
                    <label>Lugar del evento:</label>
                    <input name="lugarEvento" placeholder="..."></input>
                </div>
                 <div>
                    <label>Video del evento (opcional):</label>
                    <input name="linkEvento" placeholder="..."></input>
                </div>
                <div>
                    <label>Portada del evento:</label>
                    <input type="file" placeholder="..."></input>
                </div>
                <div>
                    <input type="checkbox"></input>
                    <p>Acepto términos y condiciones</p>
                </div>
                <button type="submit">CREAR EVENTO</button>
            </form>
        </>
    )
}

export default CreateEventForm