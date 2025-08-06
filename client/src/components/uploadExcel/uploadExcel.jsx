import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';

function UploadExcel() {
  const {eventId} = useParams()
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return alert('Selecciona un archivo');

    const formData = new FormData();
    formData.append('excel', file);
    formData.append('excel', file);
    formData.append('eventId', eventId);
    formData.append('excelName', file.name);
    formData.append('dateT', new Date().toISOString());

    try {
      const res = await axios.post('http://localhost:4000/upload_excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Respuesta del servidor:', res.data);
    } catch (error) {
      console.error('Error al subir:', error);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)}>
      <input type="file" accept=".xlsx, .xls" onChange={handleChange} />
      <button type="submit">Subir Excel</button>
    </form>
  );
}

export default UploadExcel;