let chain = {};

// 페이지 로드 시 학습 자동 실행
fetch("train.txt")
  .then(res => res.text())
  .then(text => train(text));

function train(text) {
  const words = text.split(/\s+/);

  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i];
    const next = words[i + 1];
    if (!chain[w]) chain[w] = [];
    chain[w].push(next);
  }
}

function generate(max = 20) {
  const keys = Object.keys(chain);
  if (keys.length === 0) return "…";

  let word = keys[Math.floor(Math.random() * keys.length)];
  let result = [word];

  for (let i = 0; i < max; i++) {
    const next = chain[word];
    if (!next) break;
    word = next[Math.floor(Math.random() * next.length)];
    result.push(word);
  }

  return result.join(" ");
}

function send() {
  const input = document.getElementById("userInput");
  const msg = input.value.trim();
  if (!msg) return;

  append("user", msg);
  input.value = "";

  setTimeout(() => {
    append("ai", generate());
  }, 300);
}

function append(role, text) {
  const div = document.createElement("div");
  div.className = role;
  div.textContent = (role === "user" ? "나: " : "AI: ") + text;
  document.getElementById("chat").appendChild(div);
}
