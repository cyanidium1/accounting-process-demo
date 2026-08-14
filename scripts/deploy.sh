#!/usr/bin/env bash
# Деплой статичного експорту на GitHub Pages з гілки gh-pages.
#
# Основний шлях — .github/workflows/deploy.yml (Actions). Цей скрипт потрібен,
# коли Actions недоступні: він збирає проєкт локально й пушить вміст out/
# у гілку gh-pages, звідки Pages віддає сайт.
set -euo pipefail

REPO_URL="https://github.com/cyanidium1/accounting-process-demo.git"
export NEXT_PUBLIC_BASE_PATH="/accounting-process-demo"

npm run build

cd out
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Статичний експорт секції-демо процесу"
git remote add origin "$REPO_URL"
git push -q -f origin gh-pages

echo "Готово: https://cyanidium1.github.io/accounting-process-demo/"
