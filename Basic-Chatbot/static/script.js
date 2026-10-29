const splash = document.getElementById("splash");
const app = document.getElementById("app");
const startButton = document.getElementById("startButton");
const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const historyList = document.getElementById("historyList");
const attachmentPreview = document.getElementById("attachmentPreview");

let chats = JSON.parse(localStorage.getItem("robosaathi-chats") || "[]");
let activeChatId = null;
let selectedFiles = [];

function saveChats() {
  localStorage.setItem("robosaathi-chats", JSON.stringify(chats));
}

function makeNewChat() {
  const chat = {
    id: Date.now().toString(),
    title: "New conversation",
    messages: []
  };
  chats.unshift(chat);
  activeChatId = chat.id;
  saveChats();
  render();
}

function currentChat() {
  return chats.find(chat => chat.id === activeChatId);
}

function renderHistory() {
  historyList.innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = "history-item" + (chat.id === activeChatId ? " active" : "");
    item.textContent = "💬 " + chat.title;
    item.title = chat.title;

    item.addEventListener("click", () => {
      activeChatId = chat.id;
      render();
    });

    historyList.appendChild(item);
  });
}

function renderMessages() {
  const chat = currentChat();
  messages.innerHTML = "";

  if (!chat || chat.messages.length === 0) {
    messages.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-robot">🤖</div>
        <h1>Hey there! 👋</h1>
        <p>I’m RoboSaathi. Say hello, ask how I’m doing, or tell me your name!</p>
        <div class="suggestions">
          <button class="suggestion">Hello!</button>
          <button class="suggestion">How are you?</button>
          <button class="suggestion">What can you do?</button>
        </div>
      </div>`;
    addSuggestionListeners();
    return;
  }

  chat.messages.forEach(message => {
    const bubble = document.createElement("div");
    bubble.className = "message " + message.role;

    const text = document.createElement("div");
    text.textContent = message.text;
    bubble.appendChild(text);

    if (message.fileName) {
      const file = document.createElement("small");
      file.textContent = "📎 " + message.fileName;
      bubble.appendChild(file);
    }

    messages.appendChild(bubble);
  });

  messages.scrollTop = messages.scrollHeight;
}

function render() {
  renderHistory();
  renderMessages();
}

function addSuggestionListeners() {
  document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.textContent;
      sendMessage();
    });
  });
}

function getReply(text) {
  const message = text.toLowerCase().trim();

  if (/\b(hi|hello|hey|namaste)\b/.test(message)) {
    return "Hello! 👋 Main RoboSaathi hoon. Tumse baat karke khushi hui!";
  }
  if (message.includes("how are you") || message.includes("kaise ho")) {
    return "Main bilkul badhiya hoon! 😊 Tum kaise ho?";
  }
  if (message.includes("your name") || message.includes("naam")) {
    return "Mera naam RoboSaathi hai — tumhara friendly chatbot! 🤖";
  }
  if (message.includes("what can you do") || message.includes("kya kar")) {
    return "Main simple messages ka friendly reply de sakta hoon. Mujhe hello bolo, apna naam batao, ya mujhse sawaal karo!";
  }
  if (/\b(thank|thanks|shukriya)\b/.test(message)) {
    return "You’re welcome! 😊";
  }
  if (/\b(bye|goodbye|alvida)\b/.test(message)) {
    return "Bye! Phir baat karenge 👋";
  }
  if (message) {
    return "Achha sawaal hai! 😊 Main abhi ek simple chatbot hoon, isliye main hello, haal-chaal aur kuch basic messages ka reply de sakta hoon.";
  }
  return "File mil gayi! 📎 Abhi main file ke andar ka content padh nahi sakta, par tum uske baare mein message likh sakte ho.";
}

function sendMessage() {
  const text = input.value.trim();
  if (!text && selectedFiles.length === 0) return;

  if (!activeChatId || !currentChat()) {
    makeNewChat();
  }

  const chat = currentChat();
  const fileNames = selectedFiles.map(file => file.name);

  chat.messages.push({
    role: "user",
    text: text || "Maine file attach ki hai.",
    fileName: fileNames.join(", ")
  });

  if (chat.title === "New conversation" && text) {
    chat.title = text.length > 25 ? text.slice(0, 25) + "…" : text;
  }

  const reply = getReply(text);
  chat.messages.push({
    role: "bot",
    text: reply,
    fileName: ""
  });

  input.value = "";
  selectedFiles = [];
  attachmentPreview.innerHTML = "";
  saveChats();
  render();
}

function addFiles(fileList) {
  selectedFiles.push(...Array.from(fileList));
  attachmentPreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const chip = document.createElement("span");
    chip.className = "attachment-chip";
    chip.textContent = "📎 " + file.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove " + file.name);
    remove.style.cssText = "border:0;background:none;cursor:pointer;font-size:18px;color:#776b91;";
    remove.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      addFiles([]);
    });

    chip.appendChild(remove);
    attachmentPreview.appendChild(chip);
  });
}

document.querySelectorAll(".attach-button input").forEach(fileInput => {
  fileInput.addEventListener("change", event => {
    addFiles(event.target.files);
    event.target.value = "";
  });
});

startButton.addEventListener("click", () => {
  splash.classList.add("hidden");
  app.classList.remove("hidden");

  if (chats.length > 0) {
    activeChatId = chats[0].id;
  } else {
    makeNewChat();
  }
  render();
});

document.getElementById("newChatButton").addEventListener("click", makeNewChat);
document.getElementById("deleteChatButton").addEventListener("click", () => {
  if (!activeChatId) return;
  chats = chats.filter(chat => chat.id !== activeChatId);
  activeChatId = chats.length ? chats[0].id : null;
  saveChats();
  render();
});

document.getElementById("clearHistoryButton").addEventListener("click", () => {
  if (!chats.length) return;
  if (confirm("Saari chat history delete karni hai?")) {
    chats = [];
    activeChatId = null;
    saveChats();
    render();
  }
});

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

addSuggestionListeners();