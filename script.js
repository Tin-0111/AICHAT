const chat = document.getElementById("chat");

function saveKey() {
  const key = document.getElementById("apiKey").value;
  localStorage.setItem("OPENAI_API_KEY", key);
  alert("API 키 저장됨");
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";

  const apiKey = localStorage.getItem("OPENAI_API_KEY");
  if (!apiKey) {
    appendMessage("ai", "API 키를 먼저 입력하세요.");
    return;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();
    appendMessage("ai", data.choices[0].message.content);
  } catch (e) {
    appendMessage("ai", "오류 발생");
  }
}

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerText = `${role === "user" ? "나" : "AI"}: ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
