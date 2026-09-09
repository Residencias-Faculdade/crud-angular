/**
 * COMPATIBILIDADE COM ATIVIDADENGX (mesma nota de environment.ts)
 * ADICIONADO bloco keycloak para ng serve (--configuration development)
 * Mantem paridade com shell: url/realm/clientId idem a .env.example
 */
export const environment = {
  production: false,
  apiUrl: 'https://jsonplaceholder.typicode.com',
  // ADICIONADO para compatibilidade com shell atividadengx
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'atividadengx',
    clientId: 'frontend',
  },
};
