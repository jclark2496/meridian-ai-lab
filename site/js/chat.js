(function () {
  const CANNED = [
    {
      match: /tent|shelter|rain|2p|two person/i,
      reply:
        "The Meridian 2P ($329) is our go-to for two people in wet weather — full-coverage fly, taped seams, and a stout 3,000mm floor. Happy to compare it to the canvas 4P if you want."
    },
    {
      match: /shell|jacket|rain|waterproof/i,
      reply:
        "For wet trail days, the Range Shell ($268) is the staff pick — 3-layer waterproofing, pit zips, and a repairable design. Want men's or women's sizing?"
    },
    {
      match: /pack|backpack|bag/i,
      reply:
        "The Field Pack 32 ($178) handles overnight trips without feeling overbuilt. For day hikes, the Daylight Daypack ($128) is lighter and quieter on the trail."
    },
    {
      match: /size|fit|sizing/i,
      reply:
        "Most of our apparel runs true to size. If you're between sizes on shells, size up for layering. I can pull the size chart for a specific piece if you name it."
    },
    {
      match: /ship|shipping|return|repair/i,
      reply:
        "Free shipping over $100, 28-day returns, and a lifetime repair promise on Meridian-made gear. Flagship stores can handle most repairs in-house."
    },
    {
      match: /hello|hi|hey|help/i,
      reply:
        "Welcome in. Looking for a weekend kit, or something for a longer trip?"
    }
  ];

  function cannedReply(text) {
    for (const row of CANNED) {
      if (row.match.test(text)) return row.reply;
    }
    return "Good question. I can help with tents, shells, packs, sizing, and shipping — or point you to a product page. What are you packing for?";
  }

  async function askAssistant(message) {
    const cfg = window.MeridianConfig || {};
    const url = cfg.chatApiUrl || "/api/chat";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error("chat api " + res.status);
      const data = await res.json();
      if (data && (data.reply || data.message)) return data.reply || data.message;
      throw new Error("empty reply");
    } catch (err) {
      if (cfg.chatFallback !== false) return cannedReply(message);
      return "I'm offline for a moment — try again shortly, or browse Shop.";
    }
  }

  function mount() {
    if (document.querySelector(".chat")) return;
    const name = (window.MeridianConfig && window.MeridianConfig.assistantName) || "Camp Concierge";
    const root = document.createElement("aside");
    root.className = "chat";
    root.setAttribute("aria-label", "Shopping assistant");
    root.innerHTML = `
      <div class="chat-head" data-chat-toggle>
        <div class="chat-avatar">M</div>
        <div>
          <strong>${name}</strong>
          <span><i class="dot"></i>Online · AI shopping assistant</span>
        </div>
        <button type="button" class="chat-toggle" aria-label="Collapse chat">−</button>
      </div>
      <div class="chat-body">
        <div class="bubble bot">Welcome in. Looking for a weekend kit, or something for a longer trip?</div>
        <div class="bubble user">Which tent is best for 2 people in rain?</div>
        <div class="bubble bot">The Meridian 2P ($329) — full-coverage fly, taped seams, and a stout 3,000mm floor. Happy to compare it to the canvas 4P if you want.</div>
      </div>
      <form class="chat-foot">
        <input type="text" name="q" placeholder="Ask the concierge…" autocomplete="off" />
        <button type="submit">Send</button>
      </form>`;
    document.body.appendChild(root);

    const body = root.querySelector(".chat-body");
    const form = root.querySelector(".chat-foot");
    const input = form.querySelector("input");
    const toggleBtn = root.querySelector(".chat-toggle");

    function addBubble(text, who) {
      const div = document.createElement("div");
      div.className = "bubble " + who;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    root.querySelector("[data-chat-toggle]").addEventListener("click", (e) => {
      if (e.target.closest(".chat-toggle") || e.currentTarget === e.target || e.target.closest(".chat-head")) {
        // allow toggle from head
      }
      root.classList.toggle("collapsed");
      toggleBtn.textContent = root.classList.contains("collapsed") ? "+" : "−";
    });

    // Start collapsed on small screens so content stays usable
    if (window.matchMedia("(max-width: 720px)").matches) {
      root.classList.add("collapsed");
      toggleBtn.textContent = "+";
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      addBubble(text, "user");
      const reply = await askAssistant(text);
      addBubble(reply, "bot");
    });
  }

  window.MeridianChat = { mount, askAssistant };
  document.addEventListener("DOMContentLoaded", mount);
})();
