/**
 * COMPATIBILIDADE COM ATIVIDADENGX - bloco keycloak
 * --------------------------------------------------
 * MODIFICADO: adicionado objeto keycloak { url, realm, clientId }.
 * Antes continha apenas apiUrl.
 * Por que: precisa casar 1:1 com atividadengx/.env.example e atividadengx/keycloak/realm.json
 *   realm=atividadengx, clientId=frontend (publicClient + PKCE S256)
 *   url=http://localhost:8080 em dev; em prod virá via env build-time.
 * Usado por src/app/core/auth/keycloak.service.ts para Keycloak.init().
 * Mantido apiUrl original para nao quebrar repository de posts.
 */
export const environment = {
  production: false,
  apiUrl: 'https://jsonplaceholder.typicode.com',
  // ADICIONADO para compatibilidade com shell atividadengx
  keycloak: {
    url: 'http://localhost:8080', // deve ser igual a VITE_KEYCLOAK_URL da shell
    realm: 'atividadengx', // mesmo realm de keycloak/realm.json:2 em ambos projetos
    clientId: 'frontend', // mesmo client de realm.json:22 publicClient:true
  },
};
