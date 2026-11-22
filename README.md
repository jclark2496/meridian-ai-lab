# Meridian Outfitters AI Exposure Lab

> **WARNING: deliberately vulnerable. Run on localhost only.**
> Every port is published on `127.0.0.1`. Do not change that, put it behind a tunnel, or run it on a shared or internet-facing host. Langflow 1.2.0 and the old n8n image have real, publicly known remote-code-execution bugs.
>
> **All keys, tokens and customer records here are fake canaries** (for example `canary-meridian-*`, `sk-1234`, `AKIAIOSFODNN7EXAMPLE`). None of them work anywhere.

Meridian Outfitters is a fictional outdoor retailer built to answer a practical question: which parts of an AI application does a security scanner actually recognize? The customer-facing experience is a gear shop with a shopping assistant. The underlying lab provides known services and synthetic data to compare against a scanner’s report.

![Camp Concierge answering a tent question on the Meridian Outfitters storefront](https://forkthis.ai/assets/shots/meridian.jpg)

[View the architecture diagram](meridian-lab-diagram.pdf) · [Preview the storefront](#quick-start)

## What it can do

- **Show the shopper’s experience.** Browse the gear catalog and product pages, add an item to the cart, or ask Camp Concierge about equipment. The chat widget includes canned gear advice when its backend is unavailable.
- **Show the architecture behind the chat.** The lab brings together a storefront proxy, chat and model services, MCP tool interfaces, and seeded vector stores. The diagram shows where these components fit.
- **Check detection coverage.** The synthetic records and known services give a reviewer an expected result to compare with the separate scanner’s report. The scanner lives in its own repository.

## Quick start

To see the shopper’s side, open the local copy of [`site/index.html`](site/index.html) in a browser. Select **Shop the Camp Edit**, then **Meridian 2P Tent**. The product page shows the tent, its price, and an Add to cart button. The storefront can be explored on its own. The full local lab has additional prerequisites below.

## One design decision

Meridian uses recognizable synthetic records in its data stores. When one appears in a report, the reviewer can trace it back to a known fixture. That makes it possible to compare coverage across scanner versions using the same baseline.

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

[MIT License](LICENSE) · [Forkthis build notes](https://forkthis.ai/meridian/)
