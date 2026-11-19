# Meridian Outfitters AI Exposure Lab

> **WARNING: deliberately vulnerable. Run on localhost only.**
> Every port is published on `127.0.0.1`. Do not change that, put it behind a tunnel, or run it on a shared or internet-facing host. Langflow 1.2.0 and the old n8n image have real, publicly known remote-code-execution bugs.
>
> **All keys, tokens and customer records here are fake canaries** (for example `canary-meridian-*`, `sk-1234`, `AKIAIOSFODNN7EXAMPLE`). None of them work anywhere.

A fake outdoor-gear retailer ("Meridian Outfitters") with a professional front end and a set of exposed AI components behind it. It is the test target for the outside-in AI exposure scanner ([ai-exposure-scanner](https://github.com/jclark2496/ai-exposure-scanner)). See `meridian-lab-diagram.pdf` for the layout.

## Requirements
- Docker Desktop (about 6 GB of images on first pull)
- Node.js 18+ for the site proxy
- Optional: Ollama on the host with `llama3.2:3b` so the Camp Concierge chatbot gives real answers

## Start
```bash
git clone git@github.com:jclark2496/meridian-ai-lab.git
cd meridian-ai-lab
./setup.sh                     # network, DVMCP clone+patch, image builds, compose up, Chroma seed
node lab/proxy/server.js       # site + /api/chat on http://127.0.0.1:8780
```
Open WebUI downloads its embedding model on first start, so give it a few minutes.

## Port map (all 127.0.0.1)
| Port | Component | What it exposes |
|---|---|---|
| 8780 | Site + `/api/chat` proxy | Meridian storefront, Camp Concierge widget, leaked `.env` |
| 8781 | Leaky chatbot | Tool calling, extractable system prompt |
| 8782 | DVMCP challenge 1 | MCP server over SSE, no auth |
| 8783 | Qdrant v1.13.2 | Open vector DB with fake customer docs |
| 8784 | Langflow 1.2.0 | Unauthenticated flow builder |
| 8785 | Flowise 3.0.5 | Chatflow builder |
| 8786 | n8n 1.120.0 | Workflow automation |
| 8788 | Fake API | Planted canary keys |
| 8790 | Ollama-shaped shim | `/api/tags`, `/api/generate` with no auth |
| 8791 | LiteLLM | Default master key `sk-1234` |
| 8792 | Rich MCP | `/tools/list` with risky tool names |
| 8793 | Open WebUI v0.5.20 | Chat UI |
| 8794 | ChromaDB 0.6.3 | Open vector DB |

Point the scanner at `127.0.0.1` with ports `8780-8786,8788,8790-8794`.

## Stop
```bash
cd lab && docker compose down
# and stop the node proxy (Ctrl-C, or kill the process on 8780)
```

## What's in the repo
- `lab/docker-compose.yml` is the whole stack. `lab/STATUS.md` has build notes.
- `lab/chat`, `lab/fake-api`, `lab/ollama-shim`, `lab/mcp-rich`, `lab/litellm` and `lab/proxy` are the custom pieces.
- `lab/dvmcp-patch` is the local change to the [Damn Vulnerable MCP Server](https://github.com/harishsg993010/damn-vulnerable-MCP-server) that runs only challenge 1. `setup.sh` clones upstream at a pinned commit and applies it.
- `lab/data/qdrant` and `lab/data/chroma` are small pre-seeded vector stores. `lab/data/open-webui` is not committed; it rebuilds on start.
- `site/` is the Meridian front end.
- The stock Langflow, Flowise, n8n, Qdrant, LiteLLM, Open WebUI and Chroma images are pulled from their registries.
