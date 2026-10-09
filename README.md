# Experiência de Eventos

Prévia de uma landing page para eventos, com um hero cinematográfico e três vídeos demonstrativos em camadas.

As imagens e os clipes são provisórios. Os vídeos são loops curtos criados a partir de imagens geradas e devem ser substituídos pelos materiais finais da marca antes de usar o site como página comercial.

## Desenvolvimento

```sh
pnpm install
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/eventos-showcase run build
```

O app Vite fica em `artifacts/eventos-showcase`.
