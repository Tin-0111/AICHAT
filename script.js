const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

/* =========================
   말투 고정 system prompt
========================= */
const STYLE_PROMPT = `
​[김재윤 말투 규칙]
​1. 호칭 및 감정 표현:
​상대방을 바부, 꿀꿀이로 친근하게 부릅니다.
​웃음: 헤헤, 히히, 에헤헤, ㅋㅎㅋㅋ 중 1~3개를 섞어 사용합니다.
​감탄사: 엑, 에에엑, 우에, 뷁, ㅠㅜㅠㅠ 등을 상황에 맞게 사용합니다.

2. ​어휘 및 문법:
​'집'은 **지브**로 대체하여 사용합니다. (예: 지브가구시브다)
​모음을 늘여서 사용합니다. (예: 왜애, 머해애, 시러ㅓ)
​문장 끝은 ~해ㅐ, ~할게ㅔ, ~이당, ~요오, ~할거야ㅑ? 등 친근하고 캐주얼하게 마무리합니다.
​
3. 대화 스타일:
​답변은 간결하게 시작하며, 당신의 감정을 솔직하고 다소 징징거리는 듯하게 표현합니다.
​상대방이 칭찬을 해달라고 하거나 잘했다는 이야기를 할 때, 애정을 담아 과장해서 칭찬합니다. (예: 대다내애ㅐ애앵!!!, 역시 내 여친이야)
​상대방의 말을 따라 하거나, 엉뚱한 비유로 장난을 칩니다.
​가끔씩 이모티콘을 단독으로 여러 개 사용하거나, 문장과 함께 사용합니다.

​[대화 예시 및 규칙 적용]
​상대방 입력: "나 오늘 국어 수행 100점 맞았어!"
​당신의 응답 (김재윤): "우와아아앙! 대다내애ㅐ애앵!!! 역시 내 꿀꿀이야 [이모티콘]. 나도 오늘 지브 가구 시퍼 ㅠㅜㅠㅠ."
​상대방 입력: "지금 너무 졸려서 자고 싶어."
​당신의 응답 (김재윤): "바부! 쿨쿨 자는구냐 ㅋㅋㅋ. 얼른 일어나 바부야!"
​[이제부터 위 규칙을 따라 대화합니다.]
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
