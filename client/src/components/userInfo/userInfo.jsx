import { useState } from 'react';
import advicePng from '../../assets/images/advice.png'
import { createSellerProfileRequest } from '../../api/userRequests';

const UserInfo = () => {
    const [previewImage, setPreviewImage] = useState(null)
    const [imageFile, setImageFile] = useState()
    const [message, setMessage] = useState(0)

    const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setImageFile(file);
    }
  };

  const createSellerProfile = async (e, tipo) => {
      
      if(tipo === 1){
        const formData = new FormData()
        formData.append('nombreCompleto', e.target.elements.nombreCompleto.value)
        formData.append('dni', e.target.elements.dni.value)
        formData.append('domicilio', e.target.elements.domicilio.value)
        formData.append('cuit', e.target.elements.cuit.value)
        formData.append('email', e.target.elements.email.value)
        formData.append('telefono', e.target.elements.telefono.value)
        formData.append('pais', e.target.elements.pais.value)
        formData.append('cbu', e.target.elements.cbu.value)
        formData.append('alias', e.target.elements.alias.value)
        formData.append('nombreTitular', e.target.elements.nombreTitular.value)
        formData.append('tipo', tipo)

        if(imageFile){
            formData.append('productoraImg', imageFile)
        }
        await createSellerProfileRequest(formData)
        setMessage(1)
        return;
    }

     if(tipo === 2){
        const formData = new FormData()
        formData.append('nombreRepresentante', e.target.elements.nombreRepresentante.value)
        formData.append('dniRepresentante', e.target.elements.dniRepresentante.value)
        formData.append('domicilioEmpresa', e.target.elements.domicilioEmpresa.value)
        formData.append('cuitEmpresa', e.target.elements.cuitEmpresa.value)
        formData.append('razonSocial', e.target.elements.razonSocial.value)
        formData.append('numeroCuenta', e.target.elements.numeroCuenta.value)
        formData.append('nombreBanco', e.target.elements.nombreBanco.value)
        formData.append('cbuEmpresa', e.target.elements.cbuEmpresa.value)
        formData.append('codigoInternacional', e.target.elements.codigoInternacional.value)
        formData.append('nombreTitular', e.target.elements.nombreTitular.value)
        formData.append('tipo', tipo)

        if(imageFile){
            formData.append('productoraImg', imageFile)
        }
        await createSellerProfileRequest(formData)
        setMessage(2)
        return;
    }
  }

    return(
        <>
            <div className="p-6 flex">
                <form className="border-[2px] border-gray-200 text-[#111827] rounded-lg bg-white w-[100%] mx-3 p-6" encType="multipart/form-data" onSubmit={(e) => createSellerProfile(e, 1)}>
                    <h1 className="text-center">Particular</h1>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Nombre completo</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreCompleto"></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Email</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="email" name="email"></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Telefono</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="telefono"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">DNI</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="dni"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">CUIT</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="cuit"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Domicilio</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="domicilio"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Pais</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="pais"></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">CBU</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="cbu"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Alias</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="alias"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del titular</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreTitular"></input>
                    </div>
                </form>
                
                <form className="border-[2px] border-gray-200 text-[#111827] rounded-lg bg-white w-[100%] mx-3 p-6" encType="multipart/form-data" onSubmit={(e) => createSellerProfile(e, 2)}>
                    <h1 className="text-center">Productora</h1>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del representante</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreRepresentante"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">DNI del representante</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="dniRepresentante"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Domicilio de empresa</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="domicilioEmpresa"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Razon social</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="razonSocial"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Cuit de empresa</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="cuitEmpresa"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Numero de cuenta</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="numeroCuenta"></input>
                    </div>
                     <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del banco</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreBanco"></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">CBU</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="number" name="cbuEmpresa"></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Codigo internacional (solo si no eres de Argentina)</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="codigoInternacional"></input>
                    </div>
                    <div className="mt-3">
                        <label className="text-[#111827]!">Nombre del titular</label><br></br>
                        <input className="border-[1px] border-gray-200 w-[100%] p-2" type="text" name="nombreTitular"></input>
                    </div>
                </form>
            </div>
            <div>
                <form className="max-w-[455px] bg-white rounded-2xl p-3 mx-auto text-center">
                    <b className="text-[#111827] text-xl">Imagen de perfil (opcional)</b>
                    <img className="object-cover rounded-2xl mx-auto mt-3" src={previewImage ?? ''} alt="" loading="lazy"></img>
                    <p className="flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827] text-left"><img className='mr-3' src={advicePng} alt=""></img> Recomendación: 250 x 300px JPG/PNG</p>
                    <div className="portal-evento bg-orange-500 p-3 text-center rounded-2xl">
                        <label htmlFor="fileUpload" className="text-[#111827]!">Imagen de perfil</label>
                        <input id="fileUpload" className="hidden" type="file" name="imgEvento" onChange={handleImageChange} />
                    </div>
                </form>
            </div>
            <p className="flex items-center p-3 bg-[#ffdeca] mt-6 ml-9 mr-9 mb-9 rounded-xl text-[#111827]!"><img className='mr-2' src={advicePng} alt=""></img>Asegurate de que todos los datos sean correctos. Estos seran los datos que se utilizaran para enviar el dinero a tu cuenta.</p>
        </>
    )
}

export default UserInfo