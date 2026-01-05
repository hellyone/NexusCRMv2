# Correção Rápida - Conflito Git

## Situação
Você tem mudanças locais no arquivo `scripts/update-production.sh` que conflitam com as mudanças do GitHub.

## Solução Rápida (Recomendada)

Como a correção já está no GitHub, descarte as mudanças locais:

```bash
# Descartar mudanças locais no arquivo
git checkout -- scripts/update-production.sh

# Agora fazer pull
git pull origin main
```

## Solução Alternativa (Manter Mudanças Locais)

Se quiser manter suas mudanças locais primeiro:

```bash
# Guardar mudanças locais
git stash

# Fazer pull
git pull origin main

# Ver o que estava guardado (opcional)
git stash show -p

# Aplicar mudanças guardadas (se necessário)
git stash pop
```

## Depois do Pull

Execute o script de atualização:

```bash
chmod +x scripts/update-production.sh
./scripts/update-production.sh
```

