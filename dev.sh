#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RPC_URL="${NEXT_PUBLIC_RPC_URL:-http://127.0.0.1:8545}"
NODE_PID=""

cleanup() {
  if [[ -n "${NODE_PID}" ]] && kill -0 "${NODE_PID}" 2>/dev/null; then
    echo ""
    echo "Stopping Hardhat node (pid ${NODE_PID})..."
    kill "${NODE_PID}" 2>/dev/null || true
    wait "${NODE_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> Installing backend dependencies (if needed)"
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  npm --prefix "$BACKEND_DIR" install
fi

echo "==> Installing frontend dependencies (if needed)"
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  npm --prefix "$FRONTEND_DIR" install
fi

rpc_ready() {
  curl -s -X POST "$RPC_URL" \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    | grep -q "result"
}

STARTED_NODE=0
if rpc_ready; then
  echo "==> Hardhat RPC already available at $RPC_URL"
else
  echo "==> Starting Hardhat node on $RPC_URL"
  (
    cd "$BACKEND_DIR"
    npx hardhat node
  ) &
  NODE_PID=$!
  STARTED_NODE=1

  echo -n "    Waiting for RPC"
  for _ in $(seq 1 60); do
    if rpc_ready; then
      echo " — ready"
      break
    fi
    if ! kill -0 "${NODE_PID}" 2>/dev/null; then
      echo ""
      echo "Hardhat node exited unexpectedly."
      exit 1
    fi
    echo -n "."
    sleep 0.5
  done

  if ! rpc_ready; then
    echo ""
    echo "Timed out waiting for Hardhat node."
    exit 1
  fi
fi

echo "==> Compiling contracts"
npm --prefix "$BACKEND_DIR" run compile

echo "==> Deploying contracts to localhost"
npm --prefix "$BACKEND_DIR" run deploy:local

echo "==> Syncing ABI to frontend"
node "$ROOT_DIR/scripts/sync-abi.mjs"

echo "==> Starting frontend"
echo ""
echo "MetaMask: add network Hardhat Local"
echo "  RPC: http://127.0.0.1:8545"
echo "  Chain ID: 31337"
echo "  Import Hardhat account #0 as owner"
echo ""

cd "$FRONTEND_DIR"
npm run dev
