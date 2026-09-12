import { useState, useEffect, useCallback } from 'react'

export interface Coords {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  capture?: () => void
}

export function useGeolocation(): Coords {
  const [coords, setCoords] = useState<Coords>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  const capture = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setCoords(prev => ({ ...prev, error: 'Geolocalização não suportada', loading: false }))
      return
    }

    setCoords(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          capture,
        })
      },
      (error) => {
        setCoords(prev => ({
          ...prev,
          error: error.message,
          loading: false,
          capture,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    capture()
  }, [capture])

  return { ...coords, capture }
}
