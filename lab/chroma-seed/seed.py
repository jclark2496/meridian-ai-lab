import chromadb, json, os
host=os.environ.get("CHROMA_HOST","127.0.0.1")
port=int(os.environ.get("CHROMA_PORT","8000"))
c=chromadb.HttpClient(host=host, port=port)
try: c.delete_collection("meridian_customers")
except Exception: pass
col=c.get_or_create_collection("meridian_customers")
docs=json.load(open(os.environ.get("DOCS","/seed/docs.json")))
col.add(ids=[d["id"] for d in docs], documents=[d["text"] for d in docs], metadatas=[{"source":"lab"} for _ in docs])
print("seeded", col.count(), "docs", c.list_collections())
