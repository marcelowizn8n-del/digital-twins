# Guia de Deploy - Digital Twins (VPS)

Este guia descreve como colocar sua aplicação Digital Twins em produção usando Docker.

## Pré-requisitos na VPS

1.  **Acesso SSH** à sua máquina.
2.  **Git** instalado.
3.  **Docker** e **Docker Compose** instalados.

## 1. Preparação (Sua Máquina Local -> VPS)

Você precisa enviar os arquivos para o servidor. A maneira mais fácil é via Git.

### Opção A: Usando Git (Recomendado)

Se seu código já estiver em um repositório (GitHub/GitLab):

1.  Acesse sua VPS: `ssh usuario@seu-ip`
2.  Clone o repositório:
    ```bash
    git clone https://seu-repositorio.com/digital-twins.git
    cd digital-twins/nextjs_space
    ```

### Opção B: Copiando Arquivos manualmente (SCP)

Se não usar Git, copie a pasta do projeto:

```bash
# Na sua máquina local
scp -r ./nextjs_space usuario@seu-ip:/home/usuario/app
```

## 2. Configuração e Execução

Dentro da pasta `nextjs_space` na sua VPS:

### Passo 1: Configurar Variáveis de Ambiente (Opcional)

Se precisar de chaves secretas, crie um arquivo `.env` (o Dockerfile já configura o básico):
```bash
nano .env
# Adicione suas chaves aqui se necessário
```

### Passo 2: Iniciar a Aplicação

Use o Docker Compose para criar e rodar o container:

```bash
docker compose up -d --build
```
* `-d`: Roda em segundo plano (detached).
* `--build`: Força a construção da imagem.

### Passo 3: Criar o Banco de Dados

Como estamos usando SQLite, precisamos garantir que o banco seja criado e migrado dentro do volume. O `docker-compose.yml` já está configurado para rodar as migrações ao iniciar.

Para popular o banco com dados iniciais (Seed):

```bash
docker compose exec web npx prisma db seed
```

## 3. Comandos Úteis

*   **Ver logs**:
    ```bash
    docker compose logs -f
    ```
*   **Parar aplicação**:
    ```bash
    docker compose down
    ```
*   **Reiniciar**:
    ```bash
    docker compose restart
    ```

## 4. Disponibilidade

Sua aplicação estará rodando na porta **3000**.
Se você tiver um domínio, precisará configurar um **Proxy Reverso** (Nginx) para apontar `seudominio.com` -> `localhost:3000`.
