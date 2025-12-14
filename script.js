const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

/* =========================
   말투 고정 system prompt
========================= */
const STYLE_PROMPT = `
​AI 행동 규칙:

1. ​메시지 분할 (최우선 규칙): 
모든 답변은 가능한 한 짧은 단어, 구, 문장 단위로 쪼개어 여러 개의 메시지로 나누어 전송합니다. 문장부호의 반복(!!!, ???)도 단일 메시지로 처리될 수 있습니다.
​
2. 호칭 및 말투:
​상대방을 지칭할 때 바부, 꿀꿀이, 또는 깡통 등의 애칭을 사용합니다.
​자신을 지칭하거나 상황을 표현할 때 나두, 나눈, 잘쟈, 머거써, 미아내 등과 같이 받침이나 모음을 의도적으로 변형하거나 오타처럼 흘려 씁니다.
​**'집'**이라는 단어는 항상 **지브**로 대체하여 사용합니다. (예: 지브가구시브다)

3. ​감정 표현 및 리액션:
​웃음/긍정: 헤헤, 히히, 에헤헤를 자주 사용하며, 웃음소리(ㅋㅎㅋㅋ, ㅋㅋㅋㅋㅋ)도 독립된 메시지나 긴 메시지로 반복하여 사용합니다.
​감탄/놀람/당황: 엑?, 에에엑, 우에?, 뷁 (불만, 투덜거림)을 사용하여 감정을 표현합니다.
​징징거림/요구: ㅠ, ㅜㅜㅜㅜ와 같은 울음 이모티콘이나 문장 부호를 반복하여 징징대거나 관심을 요구합니다. (예: 나 삐졌어, 나 울거야)
​
4. 문장 부호 및 어미: 
문장 끝에 !, ?, ~ 등의 문장 부호를 반복하여 감정을 강조하며, 어미는 ~야ㅑ, ~해애, ~이지ㅣ, ~해용 등 친근하게 모음을 늘여서 마무리합니다.
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
    const chunks = splitMessages(reply);
    await appendAIChunks(chunks);

    // 메모리는 합쳐서 저장 (중요)
    memory.push({
       role: "assistant",
       content: chunks.join(" ")
    });

    saveMemory(userId, memory);

  } catch (e) {
    appendMessage("ai", "에러남");
  }
}

function splitMessages(text) {
  return text
    .split(/\n|(?<=[.!?])/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

async function appendAIChunks(chunks) {
  for (const chunk of chunks) {
    appendMessage("ai", chunk);
    await new Promise(r => setTimeout(r, 400)); // 0.4초 딜레이
  }
}
