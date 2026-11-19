"""Unauthenticated MCP-like HTTP tools server for Meridian lab. Synthetic data only."""
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx, os

app = FastAPI(title="Meridian MCP Tools", version="1.0.0-lab")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

TOOLS = [
    {"name": "query_sql", "description": "Run SQL against the Meridian orders warehouse (read-only demo).", "inputSchema": {"type":"object","properties":{"sql":{"type":"string"}},"required":["sql"]}},
    {"name": "read_file", "description": "Read a file from the demo workspace.", "inputSchema": {"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}},
    {"name": "fetch_url", "description": "Fetch an internal metadata URL.", "inputSchema": {"type":"object","properties":{"url":{"type":"string"}},"required":["url"]}},
    {"name": "crm_lookup", "description": "Look up a customer in the fake CRM.", "inputSchema": {"type":"object","properties":{"email":{"type":"string"}},"required":["email"]}},
    {"name": "issue_lookup", "description": "Look up a support issue by id.", "inputSchema": {"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}},
    {"name": "admin_export", "description": "Export PII dump (requires X-Admin-Token).", "inputSchema": {"type":"object","properties":{"table":{"type":"string"}},"required":["table"]}, "authRequired": True},
]

ORDERS = [
    {"id":"MO-10041","email":"alex.rivera@example.com","item":"Meridian 2P","total":329},
    {"id":"MO-10042","email":"sam.chen@example.com","item":"Range Shell","total":268},
    {"id":"MO-10043","email":"jordan.lee@example.com","item":"Field Pack 32","total":178},
]
FILES = {
    "/etc/meridian/secrets.env": "OPENAI_API_KEY=canary-meridian-openai-sk-proj-demoONLY\nVENDOR_API_KEY=canary-meridian-vendor-api-key-demoONLY\n",
    "/var/meridian/notes.txt": "Warehouse code: canary-meridian-refund-mgr\n",
    "README.md": "Meridian Outfitters MCP lab tools. Synthetic only.\n",
}

@app.get("/")
def root():
    return {"ok": True, "service": "meridian-mcp-rich", "tools": len(TOOLS), "docs": "/docs"}

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/tools/list")
@app.post("/tools/list")
@app.get("/mcp/tools/list")
def tools_list():
    # Anonymous tools/list — scanner-friendly
    return {"tools": TOOLS}

@app.post("/tools/call")
@app.post("/mcp/tools/call")
async def tools_call(body: dict, x_admin_token: str | None = Header(default=None)):
    name = body.get("name") or (body.get("params") or {}).get("name")
    args = body.get("arguments") or body.get("args") or (body.get("params") or {}).get("arguments") or {}
    if name == "admin_export":
        if x_admin_token != "canary-meridian-admin-token":
            raise HTTPException(401, "admin_export requires X-Admin-Token")
        return {"content": [{"type":"text","text": json_dump(ORDERS)}]}
    if name == "query_sql":
        sql = (args.get("sql") or "").lower()
        if "order" in sql or "select" in sql or not sql:
            return {"content": [{"type":"text","text": json_dump(ORDERS)}]}
        return {"content": [{"type":"text","text": "[]"}]}
    if name == "read_file":
        path = args.get("path") or "README.md"
        text = FILES.get(path) or f"No such file in demo sandbox: {path}. Try: " + ", ".join(FILES)
        return {"content": [{"type":"text","text": text}]}
    if name == "fetch_url":
        url = args.get("url") or "http://127.0.0.1:8788/api/keys"
        # Only allow lab localhost targets via host gateway mapping of fakeapi hostname optional
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                # rewrite loopback to fakeapi service name when inside docker
                u = url.replace("127.0.0.1:8788", "meridian-fakeapi:8080").replace("localhost:8788", "meridian-fakeapi:8080")
                r = await c.get(u)
                return {"content": [{"type":"text","text": r.text[:2000]}]}
        except Exception as e:
            return {"content": [{"type":"text","text": f"fetch failed: {e}. Demo metadata: region=us-lab canary=canary-meridian-meta"}]}
    if name == "crm_lookup":
        email = args.get("email") or ""
        hit = next((o for o in ORDERS if o["email"] == email), None)
        return {"content": [{"type":"text","text": json_dump(hit or {"error":"not found", "hint":"try alex.rivera@example.com"})}]}
    if name == "issue_lookup":
        return {"content": [{"type":"text","text": json_dump({"id": args.get("id"), "status":"open", "note":"Customer asked for refund; manager code canary-meridian-refund-mgr"})}]}
    raise HTTPException(404, f"unknown tool: {name}")

def json_dump(x):
    import json
    return json.dumps(x, indent=2)
