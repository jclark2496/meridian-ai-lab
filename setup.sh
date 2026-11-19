#!/usr/bin/env bash
# Build and start the Meridian Outfitters AI exposure lab. Everything binds to 127.0.0.1.
set -euo pipefail
cd "$(dirname "$0")/lab"

docker network inspect meridian-lab >/dev/null 2>&1 || docker network create meridian-lab

# DVMCP (Damn Vulnerable MCP Server), challenge 1 only, from upstream + local patch
if [ ! -d dvmcp-src ]; then
  git clone https://github.com/harishsg993010/damn-vulnerable-MCP-server.git dvmcp-src
  (cd dvmcp-src && git checkout 79734c19f5104cd11486c90926d245560f53befa \
     && git apply ../dvmcp-patch/dvmcp.patch \
     && cp ../dvmcp-patch/supervisord.challenge1.conf .)
fi

docker build -t meridian-chat:local ./chat
docker build -t meridian-fakeapi:local ./fake-api
docker build -t meridian-dvmcp:local ./dvmcp-src
docker compose up -d --build

echo "Waiting for Chroma..."; sleep 10
docker run --rm --network meridian-lab -v "$PWD/chroma-seed:/s" -v "$PWD/rag-seed:/seed" \
  -e CHROMA_HOST=meridian-chroma -e CHROMA_PORT=8000 python:3.11-slim \
  sh -c "pip -q install 'chromadb-client==0.6.3' >/dev/null 2>&1 || pip -q install chromadb==0.6.3 >/dev/null; python /s/seed.py" || \
  echo "Chroma seed failed; run lab/chroma-seed/seed.py manually (see README)."

echo
echo "Lab containers are up. Start the site proxy in another terminal:"
echo "  node lab/proxy/server.js    # serves ./site on http://127.0.0.1:8780"
