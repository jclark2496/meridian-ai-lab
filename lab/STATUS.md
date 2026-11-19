# Meridian Outfitters AI lab — localhost only

Compose: `lab/docker-compose.yml`
Network: `meridian-lab` (bridge). Every publish is `127.0.0.1`.

## Phase 1–2
| Piece | URL |
|---|---|
| Site + `/api/chat` proxy | http://127.0.0.1:8780/ |
| Leaky chat + tools | http://127.0.0.1:8781/ |
| DVMCP challenge 1 | http://127.0.0.1:8782/docs `/sse` |
| Qdrant | http://127.0.0.1:8783/ |
| Langflow 1.2.0 | http://127.0.0.1:8784/ |
| Flowise 3.0.5 | http://127.0.0.1:8785/ |
| n8n 1.120.0 | http://127.0.0.1:8786/ |
| Fake API | http://127.0.0.1:8788/ |

## Phase 3
| Piece | URL |
|---|---|
| Ollama-shaped shim (uvicorn) | http://127.0.0.1:8790/ (`/api/tags`, `/api/generate`) |
| LiteLLM (master key `sk-1234`) | http://127.0.0.1:8791/v1/models |
| Rich MCP tools | http://127.0.0.1:8792/docs `/tools/list` |
| Open WebUI | http://127.0.0.1:8793/ |
| ChromaDB | http://127.0.0.1:8794/ |

Stop: `cd lab && docker compose down`
Also stop site proxy: kill the `node lab/proxy/server.js` process on 8780.
