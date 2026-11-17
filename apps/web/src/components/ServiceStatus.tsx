import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

/** How long a health check may take before "connecting" is shown (cold starts). */
const SLOW_AFTER_MS = 2_500;

/**
 * Shows whether the AdminGest server can be used before the person tries to sign in.
 * The readiness check also wakes a sleeping backend (for example Render Free) while
 * the person types. It never retries automatically.
 */
export function ServiceStatus() {
  const [slow, setSlow] = useState(false);
  const readiness = useQuery({
    queryKey: ['/health/ready'],
    queryFn: () => api<{ status: string }>('/health/ready'),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!readiness.isFetching) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [readiness.isFetching]);

  if (readiness.isFetching && slow) {
    return (
      <div className="alert service-status" role="status">
        Conectando con el servidor… Si estaba inactivo, puede tardar hasta un minuto.
      </div>
    );
  }

  const error = readiness.error;
  if (!readiness.isFetching && error instanceof ApiError && error.isServiceProblem) {
    return (
      <div className="alert error service-status" role="alert">
        {error.message}{' '}
        {error.kind !== 'not-configured' && (
          <button className="text-button" onClick={() => void readiness.refetch()} type="button">
            Reintentar
          </button>
        )}
      </div>
    );
  }
  return null;
}
