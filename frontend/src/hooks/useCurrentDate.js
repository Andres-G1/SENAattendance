import { useEffect, useState } from 'react'

const DATE_OPTIONS = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

// Devuelve la fecha de hoy formateada en español, ej: "miércoles, 19 de agosto de 2026"
export default function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState('Cargando fecha...')

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('es-ES', DATE_OPTIONS))
  }, [])

  return currentDate
}
