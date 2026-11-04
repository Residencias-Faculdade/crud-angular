export const environment = {
  production: true,
  apiUrl: 'https://jsonplaceholder.typicode.com',
  auth: {
    enabled: true,
  },
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'atividadengx',
    clientId: 'frontend',
  },
};
