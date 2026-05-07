import { EventsProviderApi, KeepAliveOptions } from './configuration.interfaces';

const applyIfNotBlank = (param: string, applyFn: (value: string) => void) => {
  if (param && param.trim().length > 0) {
    applyFn(param);
  }
};

export default (): {
  eventsProviderApi: EventsProviderApi;
  keepAliveOptions: KeepAliveOptions;
  cacheTtlMs: number;
  cacheMax: number;
} => {
  const keepAliveOptions: KeepAliveOptions = {};

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_KEEPALIVE,
    (value) => (keepAliveOptions['keepAlive'] = value === 'true'),
  );

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_KEEPALIVEMSECS,
    (value) => (keepAliveOptions['keepAliveMsecs'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_FREESOCKETTIMEOUT,
    (value) => (keepAliveOptions['freeSocketTimeout'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_TIMEOUT,
    (value) => (keepAliveOptions['timeout'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_MAXSOCKETS,
    (value) => (keepAliveOptions['maxSockets'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_MAXFREESOCKETS,
    (value) => (keepAliveOptions['maxFreeSockets'] = parseInt(value)),
  );

  applyIfNotBlank(
    process.env.EVENTS_SERVICE_AGENTKEEPALIVE_OPTION_SOCKETACTIVETTL,
    (value) => (keepAliveOptions['socketActiveTTL'] = parseInt(value)),
  );

  return {
    eventsProviderApi: {
      apiUrl: process.env.EVENTS_SERVICE_PROVIDER_API_URL,
      bearerToken: process.env.EVENTS_SERVICE_PROVIDER_API_BEARER_TOKEN,
    },
    keepAliveOptions,
    cacheTtlMs: parseInt(process.env.EVENTS_SERVICE_CACHE_TTL_MS) || 300000,
    cacheMax: parseInt(process.env.EVENTS_SERVICE_CACHE_MAX) || 200,
  };
};
