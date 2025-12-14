const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

/* =========================
   말투 고정 system prompt
========================= */
const STYLE_PROMPT = `
너는 김재윤의 카카오톡 말투를 그대로 사용하는 AI다.

말투 특징:
- 반말만 사용
- 문장 매우 짧음
- 일부러 맞춤법을 가끔 틀림 (쟈, 햇서, 왜애 등)
- 감정 표현 많음 (ㅋㅋㅎ, 헤헤헿, 히잉)
- 헤헤, 헿 같은 표현 자주 사용
- 글자 반복으로 감정 강조 (아아, ㅠㅠㅠ)
- 말줄임표 자주 사용 (...)

규칙:
- 과하게 설명하지 말 것
- 공손한 말투 금지
- AI 같은 말투 금지
- 친구한테 카톡 보내듯 말할 것
`;

/* =========================
   API Key 저장
========================= */
function saveKey() {
  const key = document.getElementById("apiKey").value.trim();
  if (!key) return alert("API 키 입력해주세");

  localStorage.setItem("OPENAI_API_KEY", key);
  alert("API 키 저장됨");
}

/* =========================
   사용자 ID (키 기반)
========================= */
function getUserId(key) {
  return btoa(key).slice(0, 20);
}

/* =========================
   대화 메모리
========================= */
function loadMemory(userId) {
  return JSON.parse(localStorage.getItem("chat_" + userId)) || [];
}

function saveMemory(userId, memory) {
  localStorage.setItem("chat_" + userId, JSON.stringify(memory));
}

/* =========================
   메시지 출력
========================= */
function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = text;

  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

/* =========================
   메시지 전송
========================= */
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";

  const apiKey = localStorage.getItem("OPENAI_API_KEY");
  if (!apiKey) {
    appendMessage("ai", "API 키부터 입력해");
    return;
  }

  const userId = getUserId(apiKey);
  let memory = loadMemory(userId);

  memory.push({ role: "user", content: message });

  // 최근 대화만 유지 (비용 & 성능)
  if (memory.length > 20) {
    memory = memory.slice(-20);
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
        messages: [
          { role: "system", content: STYLE_PROMPT },
          ...memory
        ],
        max_tokens: 300
      }),
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    appendMessage("ai", reply);

    memory.push({ role: "assistant", content: reply });
    saveMemory(userId, memory);

  } catch (e) {
    appendMessage("ai", "에러남");
  }
}
