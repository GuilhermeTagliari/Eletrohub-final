# EletroHub

Marketplace de eletrodomésticos e eletrônicos com trade-in integrado e logística regional, desenvolvido em React Native (frontend) e Java Spring Boot com microsserviços (backend).

## Integrantes

| Nome | RA | Papel | Contribuição |
|---|---|---|---|
| Guilherme Tagliari | 1134870 | Frontend | Desenvolvimento completo do frontend em React Native: 30+ telas, 13 contextos de estado global, sistema de navegação por abas e stack, tema claro/escuro, carrinho de compras, pagamento multi-moeda, chat, favoritos, avaliações, notificações e tela de trade-in com cálculo automático de depreciação. |
| Arthur | 1137711 | Backend | Implementação do auth-service (Spring Security + JWT, cadastro e login de usuários, geração e validação de tokens) e do product-service (cadastro, listagem, busca e gerenciamento de produtos com Flyway e PostgreSQL). Configuração inicial do Eureka Discovery e Spring Cloud. |
| Lorenzo | 1134869 | Backend | Implementação do currency-service (conversão de moedas BRL/USD/EUR via API externa com cache Caffeine e circuit breaker Resilience4j), do order-service (criação e histórico de pedidos) e do gateway-service (roteamento, filtros JWT e balanceamento de carga via Spring Cloud Gateway). |
| Naubert | 1138130 | UI/UX (Figma) | Criação do protótipo de alta fidelidade no Figma: identidade visual, paleta de cores, tipografia, iconografia e componentes reutilizáveis (cards de produto, botões, modais). Entrega de todas as telas navegáveis para guiar o desenvolvimento frontend. |
| Léo Felipe Zoldan | 1138725 | Frontend | Desenvolvimento das telas de perfil do usuário, edição de perfil, configurações, central de ajuda, política de privacidade, termos de uso, onboarding e tela de redefinição de senha. Implementação dos contextos de endereço e verificação de conta. |
| João Ricardo | 1134269 | Integração Frontend/Backend | Responsável pela camada de serviços do frontend (api.js, logisticsAPI.js, tradeInAPI.js), mapeamento de endpoints, configuração de headers JWT, tratamento de erros HTTP e testes de integração entre o app React Native e os microsserviços Java. |

## Repositórios

- **Frontend:** https://github.com/GuilhermeTagliari/Eletrohub
- **Backend:** https://github.com/arthurmarcolin/microservices-java
