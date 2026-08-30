<div align="center">

# ☁️ CloudInn

### Sistema de Gestão Hoteleira em Cloud

Aplicação web desenvolvida para centralizar e simplificar processos de gestão hoteleira, utilizando uma arquitetura organizada, integração com API REST e uma interface moderna construída em **React com JavaScript**.

<br>

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)

[![License: MIT](https://img.shields.io/github/license/LucasAioriaSerpa/CloudInn?style=for-the-badge)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/LucasAioriaSerpa/CloudInn?style=for-the-badge)](https://github.com/LucasAioriaSerpa/CloudInn/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/LucasAioriaSerpa/CloudInn?style=for-the-badge)](https://github.com/LucasAioriaSerpa/CloudInn/commits)
[![Repo Size](https://img.shields.io/github/repo-size/LucasAioriaSerpa/CloudInn?style=for-the-badge)](https://github.com/LucasAioriaSerpa/CloudInn)

</div>

---

## Endereço da site

[CloudInn](https://lemon-coast-0f8dbc70f.7.azurestaticapps.net/)

---

## Sobre o projeto

O **CloudInn** é um sistema web voltado à **gestão hoteleira**, desenvolvido para oferecer uma experiência centralizada, intuitiva e organizada para operações relacionadas ao ambiente de hospedagem.

O frontend da aplicação é construído em **React utilizando JavaScript**, seguindo uma arquitetura modular e consumindo os recursos disponibilizados pela API do projeto.

A implementação utiliza três artefatos principais como referência:

| Artefato                         | Responsabilidade                             |
| -------------------------------- | -------------------------------------------- |
| `swagger.yaml`                   | Fonte de verdade funcional e contrato da API |
| `arc42-arquitetura-sistemica.md` | Fonte de verdade arquitetural                |
| Mock Apidog                      | Fonte de verdade visual e de experiência     |

---

## Objetivos

O CloudInn busca:

- centralizar operações relacionadas à gestão hoteleira;
- disponibilizar uma interface moderna e intuitiva;
- integrar corretamente o frontend aos recursos disponibilizados pelo backend;
- manter uma arquitetura organizada e de fácil manutenção;
- reutilizar componentes e comportamentos sempre que possível;
- manter regras de integração separadas da camada visual;
- fornecer feedback adequado durante operações assíncronas;
- oferecer uma experiência responsiva em diferentes dispositivos.

---

## Fontes de verdade

### `swagger.yaml`

O arquivo `swagger.yaml` é a **fonte de verdade funcional da aplicação**.

Todas as integrações com o backend devem seguir exclusivamente sua especificação.

Ele determina:

- endpoints;
- métodos HTTP;
- parâmetros;
- query parameters;
- path parameters;
- request bodies;
- responses;
- códigos HTTP;
- estruturas de dados;
- tipos dos campos;
- campos obrigatórios;
- campos opcionais;
- formatos esperados pela API.

---

### Mock da aplicação

O mock deve ser utilizado como **referência visual e de experiência do usuário**.

### Referência

[CloudInn — Reservation Mock](https://mock.apidog.com/m1/1365796-1370036-1426621/reservation)

O mock orienta:

- disposição dos elementos;
- hierarquia visual;
- navegação;
- formulários;
- tabelas;
- botões;
- modais;
- cards;
- ações disponíveis;
- organização das páginas;
- comportamento esperado da interface.

---

### `arc42-arquitetura-sistemica.md`

O documento `arc42-arquitetura-sistemica.md` deve orientar as decisões arquiteturais da aplicação.

Ele é utilizado como referência para:

- separação de responsabilidades;
- organização dos módulos;
- comunicação entre frontend e backend;
- limites arquiteturais;
- integrações;
- decisões técnicas;
- manutenção;
- evolução futura do sistema.

---

## Identidade visual

A identidade visual do CloudInn utiliza a seguinte paleta:

| Cor            | Código    | Uso sugerido                   |
| -------------- | --------- | ------------------------------ |
| Grafite        | `#28262C` | Textos e superfícies escuras   |
| Roxo           | `#998FC7` | Destaques secundários          |
| Lavanda        | `#D4C2FC` | Elementos suaves e superfícies |
| Branco Lavanda | `#F9F5FF` | Background principal           |
| Azul           | `#14248A` | Ações principais e identidade  |

A paleta deve permanecer consistente entre:

- páginas;
- formulários;
- tabelas;
- modais;
- botões;
- cards;
- navegação;
- estados de interação.

---

## Tecnologias

### Frontend

Principais tecnologias utilizadas:

- ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) React;
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=000000) JavaScript;
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) HTML5;
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) CSS3;
- REST API;
- ![Swagger](https://img.shields.io/badge/Swagger-%2385EA2D.svg?style=for-the-badge&logo=swagger&logoColor=black) Swagger / OpenAPI.

---

## Arquitetura do frontend

A aplicação deve seguir uma organização modular, mantendo responsabilidades claramente separadas.

Uma estrutura esperada é:

```text
src/
├── assets/
├── components/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── styles/
├── utils/
├── App.jsx
└── main.jsx
```

### `assets`

Recursos estáticos utilizados pela aplicação.

Exemplos:

```text
images
icons
logos
fonts
```

### `components`

Componentes reutilizáveis da interface.

Exemplos:

```text
Button
Input
Select
Modal
Table
Card
Loading
ErrorState
EmptyState
```

### `pages`

Páginas e fluxos principais do sistema.

As páginas devem ser responsáveis principalmente pela composição dos componentes e pela coordenação dos dados necessários para cada fluxo.

### `services`

Responsável pela comunicação entre o frontend e a API.

Requisições HTTP não devem ficar espalhadas diretamente pelos componentes.

### `routes`

Centraliza as rotas e a navegação da aplicação.

### `hooks`

Contém hooks personalizados e comportamentos reutilizáveis entre diferentes partes da aplicação.

### `utils`

Funções auxiliares e utilidades independentes da camada visual.

### `styles`

Centraliza estilos globais, tokens visuais e configurações relacionadas à identidade do CloudInn.

---

## Fluxo da aplicação

Uma separação conceitual esperada é:

```text
Usuário
   ↓
Interface
   ↓
Página
   ↓
Componentes
   ↓
Services
   ↓
API CloudInn
```

Essa separação ajuda a evitar que:

- componentes conheçam detalhes desnecessários da API;
- URLs fiquem duplicadas;
- regras de integração sejam espalhadas pela aplicação;
- alterações futuras exijam mudanças em diversas telas.

---

## Integração com a API

Toda integração deve respeitar o contrato definido em:

```text
swagger.yaml
```

As chamadas devem ser centralizadas na camada de serviços.

Exemplo conceitual:

```javascript
export async function getReservations() {
  const response = await fetch(`${API_URL}/reservations`);

  if (!response.ok) {
    throw new Error("Não foi possível carregar as reservas.");
  }

  return response.json();
}
```

---

## Variáveis de ambiente

Configurações dependentes do ambiente não devem ficar diretamente escritas nos componentes.

Exemplo:

```env
VITE_API_URL=http://localhost:8080
```

Utilização:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

Um arquivo `.env.example` pode ser disponibilizado no repositório para documentar as variáveis necessárias:

```env
VITE_API_URL=
```

---

## Estados da interface

Toda operação assíncrona deve possuir estados adequados.

### Loading

Enquanto os dados estiverem sendo carregados, o usuário deve receber feedback visual.

### Sucesso

Operações concluídas devem possuir feedback claro.

Exemplos:

- reserva cadastrada;
- registro atualizado;
- operação excluída;
- alteração salva.

### Erro

Erros da API devem ser tratados e exibidos de maneira compreensível.

Informações técnicas desnecessárias não devem ser expostas diretamente ao usuário.

### Estado vazio

Quando uma consulta não retornar registros, deve existir uma representação adequada de estado vazio.

---

## Responsividade

O CloudInn deve ser responsivo e adaptável a diferentes resoluções.

A aplicação deve preservar:

- legibilidade;
- hierarquia visual;
- navegação;
- formulários;
- tabelas;
- ações;
- espaçamentos;
- usabilidade.

---

## Executando o projeto

### Pré-requisitos

Certifique-se de possuir:

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)

- Node.js;
- npm;
- Git.

---

### 1. Clone o repositório

```bash
git clone https://github.com/LucasAioriaSerpa/CloudInn.git
```

### 2. Acesse a pasta

```bash
cd CloudInn
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure o ambiente

Caso seja necessário, crie um arquivo `.env`:

```env
VITE_API_URL=http://localhost:8080
```

### 5. Execute a aplicação

```bash
npm run dev
```

### 6. Build de produção

```bash
npm run build
```

---

## Git e fluxo de contribuição

Para iniciar uma nova funcionalidade:

```bash
git checkout -b feature/nome-da-feature
```

Adicione as alterações:

```bash
git add .
```

Crie o commit:

```bash
git commit -m "feat: descrição da alteração"
```

Envie a branch:

```bash
git push origin feature/nome-da-feature
```

Depois, abra um **Pull Request** para revisão.

---

## Padrão recomendado de commits

Sugestão baseada em Conventional Commits:

```text
feat: adiciona nova funcionalidade
fix: corrige comportamento existente
docs: altera documentação
style: altera estilo sem modificar comportamento
refactor: reorganiza código
test: adiciona ou modifica testes
chore: manutenção do projeto
```

Exemplo:

```bash
git commit -m "feat: adiciona cadastro de reservas"
```

---

## Contribuidores

<a href="https://github.com/LucasAioriaSerpa/CloudInn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LucasAioriaSerpa/CloudInn" alt="Contribuidores do CloudInn" />
</a>

### Equipe

- [Alyson Ferreira de Souza](https://github.com/Alyson115)
- [Flavia Cristina Fagundes](https://github.com/flaviacfagundes)
- [Lucas Aioria Serpa](https://github.com/LucasAioriaSerpa)
- [Matheus Pereira Siqueira](https://github.com/MatheusP19)

---

## Documentação

Os principais documentos utilizados no desenvolvimento são:

| Documento                        | Finalidade                     |
| -------------------------------- | ------------------------------ |
| `README.md`                      | Documentação geral do projeto  |
| `swagger.yaml`                   | Contrato e documentação da API |
| `arc42-arquitetura-sistemica.md` | Arquitetura do sistema         |
| `LICENSE`                        | Licença de distribuição        |

---

## Licença

Este projeto está sob a licença **MIT**.

[![License: MIT](https://img.shields.io/github/license/LucasAioriaSerpa/CloudInn?style=for-the-badge)](https://github.com/LucasAioriaSerpa/CloudInn/blob/master/LICENSE)

Consulte o arquivo [LICENSE](https://github.com/LucasAioriaSerpa/CloudInn/blob/master/LICENSE) para mais informações.

---

## Repositório

[![Contributors][contributors-shield]][contributors-url]
[![Last Commit][last-commit-shield]][last-commit-url]
[![Repo Size][repo-size-shield]][repo-url]

---

<div align="center">

### ☁️ CloudInn

**Gestão hoteleira conectada, organizada e orientada por uma arquitetura bem definida.**

</div>

---

<!-- Shields dinâmicos -->

[contributors-shield]: https://img.shields.io/github/contributors/LucasAioriaSerpa/CloudInn.svg?style=for-the-badge
[contributors-url]: https://github.com/LucasAioriaSerpa/CloudInn/graphs/contributors
[last-commit-shield]: https://img.shields.io/github/last-commit/LucasAioriaSerpa/CloudInn.svg?style=for-the-badge
[last-commit-url]: https://github.com/LucasAioriaSerpa/CloudInn/commits
[repo-size-shield]: https://img.shields.io/github/repo-size/LucasAioriaSerpa/CloudInn.svg?style=for-the-badge
[repo-url]: https://github.com/LucasAioriaSerpa/CloudInn
