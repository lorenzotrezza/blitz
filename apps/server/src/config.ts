const DEFAULT_PORT = 3004;
const MAX_PORT = 65_535;
const DEFAULT_SOCKET_CORS_ORIGIN = '*';
const PORT_PATTERN = /^(0|[1-9]\d{0,4})$/;

export interface ServerConfig {
  port: number;
  socketCorsOrigin: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const portValue = env.PORT;

  if (!portValue) {
    return {
      port: DEFAULT_PORT,
      socketCorsOrigin: env.SOCKET_IO_CORS_ORIGIN ?? DEFAULT_SOCKET_CORS_ORIGIN,
    };
  }

  if (!PORT_PATTERN.test(portValue)) {
    throw new Error(`Invalid PORT value: ${portValue}`);
  }

  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 0 || port > MAX_PORT) {
    throw new Error(`Invalid PORT value: ${portValue}`);
  }

  return {
    port,
    socketCorsOrigin: env.SOCKET_IO_CORS_ORIGIN ?? DEFAULT_SOCKET_CORS_ORIGIN,
  };
}
