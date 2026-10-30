#!/bin/zsh
set -e
cd "$(dirname "$0")"
TASK_NODE="$(command -v node || true)"
if [[ -z "$TASK_NODE" && -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  TASK_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ -z "$TASK_NODE" ]]; then
  echo 'Node.js 20.19 이상을 설치한 뒤 다시 실행해 주세요.'
  exit 1
fi
if [[ ! -f dist/index.html ]]; then
  echo '먼저 npm install 및 npm run build를 실행해 주세요.'
  exit 1
fi
echo '브라우저에서 http://127.0.0.1:5173 을 여세요. 중지하려면 Ctrl+C를 누르세요.'
exec "$TASK_NODE" server/index.mjs
