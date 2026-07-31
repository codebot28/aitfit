import { useEffect, useState } from 'react';

// Vraagt browser-locatie. Returnt { lat, lon } of null als afgewezen/niet beschikbaar.
// status: 'pending' | 'ok' | 'unavailable'
export default function useBrowserLocatie() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus('ok');
      },
      () => setStatus('unavailable'),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { coords, status };
}