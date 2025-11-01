# Pivô Board (Frontend)

Este é o frontend do projeto Pivô, um quadro Kanban completo construído com Next.js, TypeScript e React Query.

O projeto se conecta a um [backend NestJS](https://github.com/ismaeldan/Pivo-BackEnd) para gerenciamento de usuários, colunas e tarefas, incluindo uma robusta lógica de reordenação em tempo real.

## Tecnologias Principais

* **Framework:** Next.js (App Router)
* **Linguagem:** TypeScript
* **Gerenciamento de Estado de API:** TanStack (React) Query
* **Drag and Drop:** @dnd-kit (Core & Sortable)
* **Autenticação:** Gerenciamento de sessão via Context API (`AuthProvider`)
* **Estilização:** CSS Modules

## Funcionalidades

### 1. Autenticação e Usuário
* **Criação de Conta:** Página de cadastro (`/signup`) que cria um novo usuário no backend (nome, email, senha).
* **Login de Usuário:** Página de login (`/`) que autentica o usuário e armazena o JWT no `localStorage`.
* **Gerenciamento de Perfil:** Um modal "Editar Perfil" (acessível pela Sidebar) permite ao usuário logado:
    * Atualizar nome e email.
    * Atualizar a senha com validação em tempo real (8 caracteres e confirmação de senha).
* **Sessão Persistente:** O `AuthProvider` busca os dados do usuário (`/users/me`) em toda a aplicação, garantindo que o usuário permaneça logado.
* **Logout:** Limpa o token do `localStorage` e redireciona para o login.

### 2. Quadro Kanban (Board)
* **Busca de Tarefas:** Uma barra de busca no header que filtra o board em tempo real (com *debounce*).
* **Filtro por Status:** Um dropdown no header permite filtrar as tarefas por status (Pendente, Em Progresso, Concluído).

### 3. Colunas
* **CRUD Completo:**
    * **Criar:** Adiciona novas colunas. Permite adicionar tarefas no momento da criação da coluna.
    * **Ler:** Busca todas as colunas e suas tarefas aninhadas.
    * **Editar:** Permite editar o título da coluna com um duplo-clique.
    * **Deletar:** Exclui colunas (e todas as suas tarefas) com um modal de confirmação.
* **Reordenação (Drag and Drop):**
    * As colunas podem ser arrastadas e reordenadas horizontalmente.
    * A ordem é salva no backend, garantindo persistência.

### 4. Tarefas
* **CRUD Completo:**
    * **Criar:** Adiciona novas tarefas (título, descrição, status) dentro de uma coluna específica.
    * **Ler:** As tarefas são carregadas dentro de suas respectivas colunas.
    * **Editar:** Um modal (`EditTaskModal`) permite alterar título, descrição, status e mover a task para o topo da coluna.
    * **Deletar:** Exclui tarefas com um modal de confirmação.
* **Reordenação (Drag and Drop):**
    * As tarefas podem ser reordenadas *dentro* da mesma coluna.
    * As tarefas podem ser movidas *entre* colunas.
    * Toda reordenação é otimista (atualiza a UI instantaneamente) e persistida no backend.

## Como Rodar o Projeto

1.  **Clone o repositório**
    ```bash
    git clone [URL_DO_SEU_REPOSITORIO_FRONTEND]
    cd [pasta-do-frontend]
    ```

2.  **Instale as dependências**
    (O projeto usa `pnpm`)
    ```bash
    pnpm install
    ```

3.  **Configuração de Ambiente**
    * *Este projeto não requer um `.env` local, pois se conecta diretamente à URL da API definida no `lib/apiClient.ts`.*

4.  **Rode o Backend**
    * Certifique-se de que o projeto [Pivo-BackEnd](https://github.com/ismaeldan/Pivo-BackEnd) esteja rodando em `http://localhost:3100`.

5.  **Rode o Servidor de Desenvolvimento**
    ```bash
    pnpm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.