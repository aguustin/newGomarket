import { useContext, useEffect, useState } from 'react';
import advicePng from '../../assets/images/advice.png'
import { createSellerProfileRequest } from '../../api/userRequests';
import UserContext from '../../context/userContext';

const UserInfo = () => {
    const {session} = useContext(UserContext)
    const [previewImage, setPreviewImage] = useState(null)
    const [imageFile, setImageFile] = useState()
    const [message, setMessage] = useState(0)

    const [nombre, setNombre] = useState()
    const [telefono, setTelefono] = useState()
    const [pais, setPais] = useState()
    const [dni, setDni] = useState()
    const [cuit, setCuit] = useState()
    const [domicilio, setDomicilio] = useState()
    const [cbu, setCbu] = useState()
    const [alias, setAlias] = useState()
    const [nombreTitular, setNombreTitular] = useState()
    const [mail, setMail] = useState()
    const [imgProductora, setImgProductora] = useState()

    const [nombreProductora, setNombreProductora] = useState()
    const [telefonoProductora, setTelefonoProductora] = useState()
    const [paisProductora, setPaisProductora] = useState()
    const [dniRepresentante, setDniRepresentante] = useState()
    const [cuitProductora, setCuitProductora] = useState()
    const [domicilioProductora, setDomicilioProductora] = useState()
    const [razonSocial, setRazonSocial] = useState()
    const [numeroCuenta, setnumeroCuenta] = useState()
    const [cbuProductora, setCbuProductora] = useState()
    const [nombreBanco, setNombreBanco] = useState()
    const [aliasProductora, setAliasProductora] = useState()
    const [codigoInternacional, setCodigoInternacional] = useState()
    const [mailProductora, setMailProductora] = useState()
    const [nombreTitularProductora, setNombreTitularProductora] = useState()


   useEffect(() => {
    if (session?.userFinded?.[0]?.nombreCompleto) {
        setNombre(session?.userFinded?.[0]?.nombreCompleto);
        setTelefono(session?.userFinded?.[0]?.telefono);
        setPais(session?.userFinded?.[0]?.pais);
        setDni(session?.userFinded?.[0]?.dni)
        setCuit(session?.userFinded?.[0]?.cuit)
        setDomicilio(session?.userFinded?.[0]?.domicilio)
        setCbu(session?.userFinded?.[0]?.cbu)
        setAlias(session?.userFinded?.[0]?.alias)
        setNombreTitular(session?.userFinded?.[0]?.nombreTitular)
        setMail(session?.userFinded?.[0]?.mail)
        
        setNombreProductora(session?.userFinded?.[0]?.nombreProductora);
        setTelefonoProductora(session?.userFinded?.[0]?.telefonoProductora);
        setPaisProductora(session?.userFinded?.[0]?.paisProductora);
        setDniRepresentante(session?.userFinded?.[0]?.dniRepresentante)
        setCuitProductora(session?.userFinded?.[0]?.cuitProductora)
        setDomicilioProductora(session?.userFinded?.[0]?.domicilioProductora)
        setRazonSocial(session?.userFinded?.[0]?.razonSocial)
        setnumeroCuenta(session?.userFinded?.[0]?.numeroCuenta)
        setCbuProductora(session?.userFinded?.[0]?.cbuProductora)
        setAliasProductora(session?.userFinded?.[0]?.aliasProductora)
        setNombreBanco(session?.userFinded?.[0]?.nombreBanco)
        setCodigoInternacional(session?.userFinded?.[0]?.codigoInternacional)
        setMailProductora(session?.userFinded?.[0]?.mail)
        setNombreTitularProductora(session?.userFinded?.[0]?.nombreTitularProductora)

        setImgProductora(session?.userFinded?.[0]?.imgProductora)
    }
}, [session]);

    const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setImageFile(file);
    }
  };

  const createSellerProfile = async (e, tipo) => {
      e.preventDefault()
      if(tipo === 1){
        console.log(tipo)
        const cbuToNumber = Number(e.target.elements.cbu.value)
        const formData = new FormData()
        formData.append('userId', session?.userFinded?.[0]?._id)
        formData.append('dataA', nombre ?? session?.userFinded?.[0]?.nombre)
        formData.append('dataB', dni ?? session?.userFinded?.[0]?.dni)
        formData.append('dataC', domicilio ?? session?.userFinded?.[0]?.domicilio)
        formData.append('dataD', cuit ?? session?.userFinded?.[0]?.cuit)
        formData.append('dataE', mail ?? session?.userFinded?.[0]?.mail)
        formData.append('dataF', telefono ?? session?.userFinded?.[0]?.telefono)
        formData.append('dataG', pais ?? session?.userFinded?.[0]?.pais)
        formData.append('dataH', cbuToNumber ?? session?.userFinded?.[0]?.cbu)
        formData.append('dataI', alias ?? session?.userFinded?.[0]?.alias)
        formData.append('dataJ', nombreTitular ?? session?.userFinded?.[0]?.nombreTitular)
        formData.append('tipo', tipo)

        if(imageFile){
            formData.append('productoraImg', imageFile)
        }else if(imgProductora?.length > 0){
            formData.append('productoraImg', imgProductora)
        }
        await createSellerProfileRequest(formData)
        setMessage(1)
        return;
    }

     if(tipo === 2){
        const cbuToNumber = Number(cbuProductora)
        const formData = new FormData()
        formData.append('userId', session?.userFinded?.[0]?._id)
        formData.append('dataA', nombreProductora ?? session?.userFinded?.[0]?.nombreProductora)
        formData.append('dataB', dniRepresentante ?? session?.userFinded?.[0]?.dniRepresentante)
        formData.append('dataC', domicilioProductora ?? session?.userFinded?.[0]?.domicilioProductora)
        formData.append('dataD', mailProductora ?? session?.userFinded?.[0]?.mailProductora)
        formData.append('dataE', cuitProductora ?? session?.userFinded?.[0]?.cuitProductora)
        formData.append('dataF', telefonoProductora ?? session?.userFinded?.[0]?.telefonoProductora)
        formData.append('dataG', paisProductora ?? session?.userFinded?.[0]?.paisProductora)
        formData.append('dataH', cbuToNumber ?? session?.userFinded?.[0]?.cbuToNumber)
        formData.append('dataI', aliasProductora ?? session?.userFinded?.[0]?.aliasProductora)
        formData.append('dataJ', nombreTitularProductora ?? session?.userFinded?.[0]?.nombreTitularProductora)
        formData.append('dataK', razonSocial ?? session?.userFinded?.[0]?.razonSocial)
        formData.append('dataL', numeroCuenta ?? session?.userFinded?.[0]?.numeroCuenta)
        formData.append('dataM', nombreBanco ?? session?.userFinded?.[0]?.nombreBanco)
        formData.append('dataN', codigoInternacional ?? session?.userFinded?.[0]?.codigoInternacional)
        formData.append('tipo', tipo)

        if(imageFile){
            formData.append('productoraImg', imageFile ?? session?.userFinded?.[0]?.imgProductora)
        }else if(imgProductora?.length > 0){
            formData.append('productoraImg', imgProductora ?? session?.userFinded?.[0]?.imgProductora)
        }
        await createSellerProfileRequest(formData)
        setMessage(2)
        return;
    }
  }

    return(
        <>
            <div className="p-6">
            <div>
            <p className="max-w-[1035px] flex items-center p-3 bg-[#ffdeca] mx-auto mt-3  mb-2 rounded-xl text-[#111827]!"><img className='mr-2' src={advicePng} alt=""></img>Asegurate de que todos los datos sean correctos. Estos seran los datos que se utilizaran para enviar el dinero a tu cuenta.</p>
                <form className="max-w-[455px] bg-white rounded-2xl p-3 mx-auto text-center mb-3">
                    <b className="text-[#111827] text-xl">Imagen de perfil (opcional)</b>
                    <img className="object-cover rounded-2xl mx-auto mt-3" src={previewImage ?? imgProductora} alt="" loading="lazy"></img>
                    <p className="flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827] text-left"><img className='mr-3' src={advicePng} alt=""></img> Recomendación: 250 x 300px JPG/PNG</p>
                    <div className="portal-evento bg-orange-500 p-3 text-center rounded-2xl">
                        <label htmlFor="fileUpload" className="text-[#111827]!">Imagen de perfil</label>
                        <input id="fileUpload" className="hidden" type="file" name="imgEvento" onChange={handleImageChange} />
                    </div>
                </form>
            </div>
            <div className='flex items-start'>
                <form className="relative border-[2px] border-gray-200 text-[#111827] rounded-lg bg-white w-[100%] mx-3 p-6" encType="multipart/form-data" onSubmit={(e) => createSellerProfile(e, 1)}>
                    <h1 className="text-center">Particular</h1>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Nombre completo</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreCompleto" value={nombre} onChange={(e) => setNombre(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Email</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="email" name="email" value={session?.userFinded?.[0]?.mail} disabled required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Telefono</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">DNI</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="dni" value={dni} onChange={(e) => setDni(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">CUIT</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="cuit" value={cuit} onChange={(e) => setCuit(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Domicilio</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="domicilio" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Pais</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="pais" value={pais} onChange={(e) => setPais(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">CBU</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="cbu" maxLength={22} pattern="\d*" inputMode="numeric" value={cbu} onChange={(e) => setCbu(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Alias</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="alias" value={alias} onChange={(e) => setAlias(e.target.value)} required></input>
                    </div>
                     <div className="mt-3 mb-16">
                        <label className="text-[#111827]!">Nombre del titular</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreTitular" value={nombreTitular} onChange={(e) => setNombreTitular(e.target.value)} required></input>
                    </div>
                    <button className="absolute right-5 bottom-5 p-3 rounded-lg bg-orange-500 text-[#111827] font-bold" type="submit">Guardar particular</button>
                </form>



                
                <form className="relative border-[2px] border-gray-200 text-[#111827] rounded-lg bg-white w-[100%] mx-3 p-6 pb-22" encType="multipart/form-data" onSubmit={(e) => createSellerProfile(e, 2)}>
                    <h1 className="text-center">Productora</h1>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Nombre de productora</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreProductora" value={nombreProductora} onChange={(e) => setNombreProductora(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">DNI del representante</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="dniRepresentante" value={dniRepresentante} onChange={(e) => setDniRepresentante(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Domicilio de Productora</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="domicilioProductora" value={domicilioProductora} onChange={(e) => setDomicilioProductora(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Telefono</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="telefonoProductora" value={telefonoProductora} onChange={(e) => setTelefonoProductora(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del titular</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="paisProductora" value={paisProductora} onChange={(e) => setPaisProductora(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Razon social</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="razonSocial" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Cuit de Productora</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="cuitProductora" value={cuitProductora} onChange={(e) => setCuitProductora(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Numero de cuenta</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="numeroCuenta" value={numeroCuenta} onChange={(e) => setnumeroCuenta(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del banco</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreBanco" value={nombreBanco} onChange={(e) => setNombreBanco(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">CBU</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="cbuProductora" value={cbuProductora} maxLength={22} pattern="\d*" inputMode="numeric" onChange={(e) => setCbuProductora(e.target.value)} required></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Alias</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="aliasProductora" value={aliasProductora} onChange={(e) => setAliasProductora(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Codigo internacional (solo si no eres de Argentina)</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="codigoInternacional" value={codigoInternacional} onChange={(e) => setCodigoInternacional(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Email</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="email" name="mailProductora" value={mailProductora} onChange={(e) => setMailProductora(e.target.value)} required></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del titular</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreTitularProductora" value={nombreTitularProductora} onChange={(e) => setNombreTitularProductora(e.target.value)} required></input>
                    </div>
                    <button className="absolute right-5 bottom-5 p-3 rounded-lg bg-orange-500 text-[#111827] font-bold" type="submit">Guardar productora</button>
                </form>
                </div>
            </div>
          
        </>
    )
}

export default UserInfo