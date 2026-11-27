const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const chatScroll = document.getElementById("chatScroll");

let chatHistory = JSON.parse(localStorage.getItem("fuadAIHistory") || "[]");
let userName = localStorage.getItem("fuadAIName") || "";

function saveHistory() {
  localStorage.setItem("fuadAIHistory", JSON.stringify(chatHistory.slice(-80)));
}

function googleUrl(query) {
  return "https://www.google.com/search?q=" + encodeURIComponent(query);
}

function addMessage(role, text, save = true, search = null, source = null) {
  welcome.hidden = true;
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "assistant" ? "✦" : (userName ? userName[0].toUpperCase() : "F");
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const p = document.createElement("p");
  p.textContent = text;
  bubble.appendChild(p);
  if (source) {
    const src = document.createElement("a");
    src.className = "google-link source-link";
    src.href = source.url;
    src.target = "_blank";
    src.rel = "noopener noreferrer";
    src.textContent = "📖 Источник: Википедия — " + source.title;
    bubble.appendChild(src);
  }
  if (search) {
    const link = document.createElement("a");
    link.className = "google-link";
    link.href = googleUrl(search);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "🔍 Найти в Google: «" + (search.length > 60 ? search.slice(0, 60) + "…" : search) + "»";
    bubble.appendChild(link);
  }
  row.append(avatar, bubble);
  messages.appendChild(row);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  if (save) {
    chatHistory.push({ role, text, search, source });
    saveHistory();
  }
  return row;
}

function normalize(text) {
  return text.toLowerCase().trim().replace(/[ё]/g, "е").replace(/[?!.,;:]+$/g, "");
}

function calculate(expression) {
  const cleaned = expression.replace(/,/g, ".").replace(/\s/g, "");
  if (!/^[0-9+\-*/().%]+$/.test(cleaned)) return null;
  if (!/[0-9]/.test(cleaned)) return null;
  try {
    // Вычисления разрешены только для математических символов и цифр.
    const result = Function(`"use strict"; return (${cleaned})`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return "Не получилось вычислить пример.";
    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(8)));
  } catch {
    return "Проверь запись примера. Например: 25 * (4 + 2)";
  }
}

const knowledge = [
  { keys: ["что такое html", "html"], answer: "HTML — язык разметки. С его помощью создают структуру веб-страницы: заголовки, текст, изображения, кнопки и другие элементы." },
  { keys: ["что такое css", "css"], answer: "CSS отвечает за внешний вид сайта: цвета, размеры, шрифты, расположение элементов, анимации и адаптацию под телефон." },
  { keys: ["что такое javascript", "javascript", "js"], answer: "JavaScript — язык программирования, который добавляет сайту интерактивность: обработку нажатий, вычисления, динамические элементы и многое другое." },
  { keys: ["что такое ии", "что такое искусственный интеллект", "искусственный интеллект"], answer: "Искусственный интеллект (ИИ) — технологии, которые позволяют компьютерным системам выполнять задачи, обычно требующие человеческих способностей: распознавать речь, находить закономерности и создавать тексты." },
  { keys: ["что такое интернет", "интернет"], answer: "Интернет — глобальная сеть, которая соединяет устройства и позволяет обмениваться информацией, открывать сайты и пользоваться онлайн-сервисами." },
  { keys: ["кто такой альберт эйнштейн", "эйнштейн"], answer: "Альберт Эйнштейн — физик-теоретик, известный теорией относительности и вкладом в развитие современной физики." },
  { keys: ["столица азербайджана", "столица азербайджана какая"], answer: "Столица Азербайджана — Баку." },
  { keys: ["сколько планет в солнечной системе", "планеты солнечной системы"], answer: "В Солнечной системе восемь планет: Меркурий, Венера, Земля, Марс, Юпитер, Сатурн, Уран и Нептун." },
  { keys: ["интересный факт о космосе", "факт о космосе", "расскажи факт"], answer: "Интересный факт: свет от Солнца до Земли летит примерно 8 минут 20 секунд. Поэтому мы видим Солнце таким, каким оно было чуть больше восьми минут назад." },
  { keys: ["что такое python", "язык python", "python"], answer: "Python — популярный язык программирования с понятным синтаксисом. Его используют для автоматизации, веб-разработки, анализа данных и машинного обучения." },
  { keys: ["что такое робот", "робот"], answer: "Робот — программируемое устройство, которое может выполнять действия в физическом мире. Обычно у него есть механизмы, датчики и программа управления." },
  { keys: ["что такое формула 1", "формула 1", "f1"], answer: "Формула 1 — высший международный класс соревнований по кольцевым автогонкам. Команды разрабатывают болиды, а пилоты соревнуются на трассах по всему миру." },
  { keys: ["о чём можно поговорить ?", "о чём поговорить", "что обсудить"], answer: "Мы можем обсудить технологии, науку, программирование, космос, интересные факты или просто поболтать. Попробуй задать вопрос или тему!" },
  { keys: ["что такое чат-бот", "чат-бот"], answer: "Чат-бот — программа, которая имитирует общение с пользователем. Она может отвечать на вопросы, выполнять команды и помогать с задачами." },
  { keys: ["что такое нейросеть", "нейросеть"], answer: "Нейросеть — модель, вдохновлённая работой человеческого мозга. Она состоит из узлов (нейронов), которые обрабатывают информацию и могут обучаться на данных для распознавания образов, текста и других задач." },
  { keys: ["чем можно заняться в свободное время", "чем заняться", "свободное время"], answer: "В свободное время ты можешь читать книги, смотреть фильмы, заниматься спортом, учиться новому, гулять на свежем воздухе, играть в настольные игры или общаться с друзьями." }

];

function answerQuestion(raw) {
  const q = normalize(raw);

  // Имя пользователя
  const nameMatch = raw.match(/(?:меня зовут|мое имя|моё имя|зови меня)\s+([а-яa-zё-]{2,20})/i);
  if (nameMatch) {
    userName = nameMatch[1][0].toUpperCase() + nameMatch[1].slice(1);
    localStorage.setItem("fuadAIName", userName);
    return `Приятно познакомиться, ${userName}! Я постараюсь обращаться к тебе по имени.`;
  }
  if (q.includes("как меня зовут") || q.includes("помнишь мое имя") || q.includes("помнишь моё имя")) {
    return userName ? `Тебя зовут ${userName}!` : "Ты ещё не говорил мне своё имя. Напиши, например: «Меня зовут Фуад».";
  }

  // Калькулятор: явное математическое выражение
  const mathCandidate = raw.replace(/^(сколько будет|посчитай|вычисли|реши)\s*/i, "").replace(/[?=]/g, "").trim();
  if (/^[\d\s()+\-*/.,%]+$/.test(mathCandidate) && /[+\-*/%]/.test(mathCandidate)) {
    return `Ответ: ${calculate(mathCandidate)}`;
  }
  const mathMatch = q.match(/(?:сколько будет|посчитай|вычисли|реши пример)\s+(.+)/);
  if (mathMatch) {
    const result = calculate(mathMatch[1].replace(/[?=]/g, ""));
    if (result !== null) return `Ответ: ${result}`;
  }

  if (["привет", "здравствуй", "здравствуйте", "хай", "салам", "hello", "hi"].includes(q)) {
    return `Привет${userName ? ", " + userName : ""}! 👋 Рад тебя видеть. Что будем делать?`;
  }
  if (q.includes("как дела") || q.includes("как ты")) return "У меня всё отлично! Я готов отвечать на вопросы. А как у тебя?";
  if (q.includes("спасибо") || q === "благодарю") return "Пожалуйста! 😊 Рад помочь.";
  if (q.includes("пока") || q.includes("до свидания")) return "До встречи! Возвращайся, когда понадоблюсь. 👋";
  if (q.includes("кто ты") || q.includes("как тебя зовут")) return "Я Fuad AI — небольшой чат-бот, созданный на HTML, CSS и JavaScript. Я работаю без API и интернета, используя встроенные правила и базу знаний.";
  if (q.includes("что ты умеешь") || q.includes("твои возможности")) {
    return "Я умею:\n• отвечать на некоторые общие вопросы из встроенной базы знаний;\n• решать простые математические примеры;\n• запоминать твоё имя;\n• сохранять историю чата в этом браузере;\n• поддерживать простой диалог.\n\nНо я не являюсь большой нейросетью и не умею самостоятельно узнавать новые факты из интернета.";
  }
  if (q.includes("ты настоящий ии") || q.includes("ты нейросеть")) return "Я программа-чатбот, а не большая нейросеть. Мои ответы формируются по правилам и встроенной базе знаний. Зато я полностью бесплатен в использовании и работаю офлайн.";
  if (q.includes("расскажи шутку") || q.includes("анекдот")) return "Почему программист не любит природу? Там слишком много багов! 😄";

  const found = knowledge.find(item => item.keys.some(key => q === key || q.includes(key)));
  if (found) return found.answer;

  const fallback = [
    "Интересный вопрос! Но пока я не знаю, как на него ответить. Моя база знаний ограничена.",
    "Я пока не умею рассуждать как ChatGPT. Попробуй задать вопрос по-другому или спроси: «Что ты умеешь?»",
    "В моей встроенной базе знаний нет точного ответа. Ты можешь научить меня: добавь новый вопрос и ответ в массив knowledge в файле script.js."
  ];
  return { text: fallback[Math.floor(Math.random() * fallback.length)] + "\n\nНо ты можешь поискать ответ в Google:", search: raw.trim() };
}

// Поиск ответа в интернете без API-ключа: открытое API Википедии.
async function searchWeb(query) {
  const q = query
    .replace(/^(что такое|кто такой|кто такая|что значит|расскажи про|расскажи о)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .trim() || query;
  const url = "https://ru.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch="
    + encodeURIComponent(q) + "&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&exsentences=4&redirects=1";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const page = data.query && data.query.pages ? Object.values(data.query.pages)[0] : null;
    if (!page || !page.extract) return null;
    return {
      text: page.extract.trim(),
      source: { title: page.title, url: "https://ru.wikipedia.org/?curid=" + page.pageid }
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function submitMessage(text) {
  const value = text.trim();
  if (!value) return;
  addMessage("user", value);
  const reply = answerQuestion(value);
  if (reply && typeof reply === "object") {
    const loading = addMessage("assistant", "🔎 Ищу ответ в интернете…", false);
    const web = await searchWeb(reply.search);
    loading.remove();
    if (web) addMessage("assistant", web.text, true, reply.search, web.source);
    else addMessage("assistant", reply.text, true, reply.search);
  } else {
    addMessage("assistant", reply);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const value = input.value;
  input.value = "";
  input.style.height = "auto";
  submitMessage(value);
  input.focus();
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
});

function clearChat() {
  chatHistory = [];
  saveHistory();
  messages.replaceChildren();
  welcome.hidden = false;
  input.focus();
}
document.getElementById("newChat").addEventListener("click", clearChat);
document.getElementById("clearChat").addEventListener("click", clearChat);

document.querySelectorAll(".quick").forEach(button => {
  button.addEventListener("click", () => submitMessage(button.dataset.question));
});

// Восстановление переписки после перезагрузки страницы.
if (chatHistory.length) {
  welcome.hidden = true;
  for (const item of chatHistory) addMessage(item.role, item.text, false, item.search, item.source);
}


// Вкладка базы знаний: автоматически показывает все keys из массива knowledge.
const chatTab = document.getElementById("chatTab");
const knowledgeTab = document.getElementById("knowledgeTab");
const mobileTab = document.getElementById("mobileTab");
const chatView = document.getElementById("chatScroll");
const knowledgePage = document.getElementById("knowledgePage");
const composerArea = document.querySelector(".composer-area");
const knowledgeSearch = document.getElementById("knowledgeSearch");
const knowledgeList = document.getElementById("knowledgeList");
const knowledgeCount = document.getElementById("knowledgeCount");
const knowledgeEmpty = document.getElementById("knowledgeEmpty");
const topTitle = document.getElementById("topTitle");

function getAllKnowledge() {
  return currentTier === "free" ? knowledge : [...knowledge, ...proKnowledge];
}

function renderKnowledge(searchText = "") {
  const query = normalize(searchText);
  knowledgeList.replaceChildren();
  const allKeys = getAllKnowledge().flatMap(item => item.keys.map(key => ({ key, answer: item.answer })));
  const filtered = allKeys.filter(item => !query || normalize(item.key).includes(query));

  filtered.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "knowledge-card";
    const number = document.createElement("span");
    number.className = "knowledge-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const content = document.createElement("div");
    content.className = "knowledge-card-content";
    const keyText = document.createElement("div");
    keyText.className = "knowledge-key";
    keyText.textContent = item.key;
    const toggle = document.createElement("button");
    toggle.className = "knowledge-show";
    toggle.type = "button";
    toggle.textContent = "Показать ответ";
    toggle.setAttribute("aria-expanded", "false");
    const answer = document.createElement("p");
    answer.className = "knowledge-answer";
    answer.textContent = item.answer;
    answer.hidden = true;
    toggle.addEventListener("click", () => {
      answer.hidden = !answer.hidden;
      toggle.textContent = answer.hidden ? "Показать ответ" : "Скрыть ответ";
      toggle.setAttribute("aria-expanded", String(!answer.hidden));
    });
    content.append(keyText, toggle, answer);
    card.append(number, content);
    knowledgeList.appendChild(card);
  });

  knowledgeCount.textContent = `Найдено ключей: ${filtered.length} из ${allKeys.length}`;
  knowledgeEmpty.hidden = filtered.length !== 0;
}

function showAppTab(tab) {
  const showKnowledge = tab === "knowledge";
  chatView.hidden = showKnowledge;
  knowledgePage.hidden = !showKnowledge;
  composerArea.hidden = showKnowledge;
  chatTab.classList.toggle("active", !showKnowledge);
  knowledgeTab.classList.toggle("active", showKnowledge);
  mobileTab.textContent = showKnowledge ? "✉ Чат" : "⌕ База знаний";
  topTitle.innerHTML = showKnowledge
    ? 'База знаний <span>KNOWLEDGE</span>'
    : 'Личный ИИ-помощник <span>OFFLINE</span>';
  if (showKnowledge) {
    renderKnowledge(knowledgeSearch.value);
    knowledgeSearch.focus();
  }
}

chatTab.addEventListener("click", () => showAppTab("chat"));
knowledgeTab.addEventListener("click", () => showAppTab("knowledge"));
mobileTab.addEventListener("click", () => {
  showAppTab("chat");
});
knowledgeSearch.addEventListener("input", () => renderKnowledge(knowledgeSearch.value));


// Тарифы Fudik AI. Выбор локальный и демонстрационный: платежи не списываются.
const codeTab = document.getElementById("codeTab");
const plansTab = document.getElementById("plansTab");
const codePage = document.getElementById("codePage");
const plansPage = document.getElementById("plansPage");
const codeSearch = document.getElementById("codeSearch");
const codeList = document.getElementById("codeList");
const codeCount = document.getElementById("codeCount");
const codeEmpty = document.getElementById("codeEmpty");
const currentPlan = document.getElementById("currentPlan");
let currentTier = localStorage.getItem("fudikAITier") || "free";

const proKnowledge = [
 {keys:["что такое алгоритм","алгоритм"],answer:"Алгоритм — точная последовательность шагов для решения задачи. Он может быть записан словами, блок-схемой или программным кодом."},
 {keys:["что такое переменная","переменная"],answer:"Переменная — именованное место для хранения значения. В JavaScript: let score = 10;"},
 {keys:["что такое массив","массив"],answer:"Массив хранит несколько значений в одном списке. Пример JavaScript: const fruits = ['яблоко', 'банан'];"},
 {keys:["что такое функция","функция"],answer:"Функция — блок кода, который можно вызывать много раз. Пример: function hello() { return 'Привет!'; }"},
 {keys:["что такое база данных","база данных"],answer:"База данных — организованное хранилище информации, в котором данные можно добавлять, искать, изменять и удалять."},
 {keys:["что такое api","api"],answer:"API — интерфейс, через который программы взаимодействуют друг с другом, например сайт обращается к серверу за данными."},
 {keys:["что такое git","git"],answer:"Git — система контроля версий. Она помогает сохранять историю изменений проекта, создавать ветки и возвращаться к прошлым версиям."},
 {keys:["что такое github","github"],answer:"GitHub — платформа для хранения Git-репозиториев и совместной разработки программ."},
 {keys:["что такое искусственная нейросеть","обучение нейросети"],answer:"Нейросеть обучается на примерах, постепенно настраивая внутренние параметры так, чтобы лучше выполнять заданную задачу."},
 {keys:["что такое гравитация","гравитация"],answer:"Гравитация — фундаментальное взаимодействие, из-за которого тела с массой притягиваются друг к другу."},
 {keys:["что такое фотосинтез","фотосинтез"],answer:"Фотосинтез — процесс, при котором растения используют энергию света, воду и углекислый газ для образования органических веществ и выделения кислорода."},
 {keys:["что такое первая мировая война","первая мировая война"],answer:"Первая мировая война продолжалась с 1914 по 1918 год. В ней участвовали многие государства Европы и других регионов мира."},
 {keys:["что такое солнечная система","солнечная система"],answer:"Солнечная система включает Солнце, восемь планет, их спутники, карликовые планеты, астероиды и кометы."},
 {keys:["что такое css flexbox","flexbox"],answer:"Flexbox — технология CSS для расположения элементов в строке или столбце и управления расстояниями, выравниванием и переносом."},
 {keys:["что такое sql","sql"],answer:"SQL — язык запросов для работы с реляционными базами данных. С его помощью выбирают, добавляют, изменяют и удаляют записи."},
 {keys:["что такое unreal engine","unreal engine"],answer:"Unreal Engine — игровой движок для создания 3D- и 2D-игр, интерактивных приложений и визуализаций."},
 {keys:["что такое unity","unity"],answer:"Unity — игровой движок, который используют для разработки игр на компьютеры, консоли, мобильные устройства и другие платформы."},
 {keys:["что такое кибербезопасность","кибербезопасность"],answer:"Кибербезопасность — защита устройств, сетей и данных от взлома, вредоносных программ и несанкционированного доступа."}
];

// Примеры и каталог. Промокоды помечены как примеры/непроверенные: офлайн-клиент не проверяет их действительность.
const codeCatalog = [
 {name:"HTML — базовая страница",category:"Сайты · HTML",description:"Минимальная структура HTML-документа.",code:`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Мой сайт</title>
</head>
<body>
  <h1>Привет, мир!</h1>
</body>
</html>`},
 {name:"CSS — центрирование",category:"Сайты · CSS",description:"Разместить блок по центру экрана.",code:".container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}"},
 {name:"JavaScript — кнопка",category:"Сайты · JavaScript",description:"Обработчик нажатия кнопки.",code:"document.querySelector('button').addEventListener('click', () => {\n  alert('Привет!');\n});"},
 {name:"Python — простой калькулятор",category:"Программирование · Python",description:"Сложение двух чисел.",code:"a = float(input('Первое число: '))\nb = float(input('Второе число: '))\nprint('Сумма:', a + b)"},
 {name:"Roblox — получение игрока",category:"Игры · Roblox Lua",description:"Пример серверного скрипта Roblox.",code:"local Players = game:GetService('Players')\n\nPlayers.PlayerAdded:Connect(function(player)\n    print(player.Name .. ' joined the game!')\nend)"},
 {name:"Blox Fruits — промокоды",category:"Игры · Roblox",description:"Категория для поиска промокодов Blox Fruits. Актуальные коды требуют проверки в игре или у разработчиков.",code:"Проверяй официальные источники Blox Fruits. Не вводи пароль Roblox на сторонних сайтах.\n\nСтатус кодов: не проверены в офлайн-каталоге."},
 {name:"Roblox — безопасный пример",category:"Игры · Roblox",description:"Пример вывода сообщения игроку через серверный скрипт.",code:"game:GetService('Players').PlayerAdded:Connect(function(player)\n    player:WaitForChild('PlayerGui')\n    print('Добро пожаловать, ' .. player.Name)\nend)"},
 {name:"Сайт — адаптация под телефон",category:"Сайты · CSS",description:"Пример медиазапроса для мобильных экранов.",code:"@media (max-width: 600px) {\n  .container {\n    padding: 12px;\n    flex-direction: column;\n  }\n}"}
];

function tierName(tier) { return ({free:"FREE",pro:"PRO",super:"SUPER"})[tier] || "FREE"; }
function updateTierUI() {
  currentPlan.textContent = `Текущий тариф: ${tierName(currentTier)} · демонстрационный режим, оплата не подключена`;
  const profilePlan = document.getElementById("profilePlan");
  if (profilePlan) profilePlan.textContent = `Тариф: ${tierName(currentTier)}`;
  document.querySelectorAll('[data-plan]').forEach(button => {
    button.textContent = button.dataset.plan === currentTier ? `Текущий тариф: ${tierName(currentTier)}` : `Выбрать ${tierName(button.dataset.plan)}`;
  });
  codeTab.disabled = currentTier !== "super";
  codeTab.title = currentTier === "super" ? "Открыть Fudik AI Code" : "Доступно в тарифе SUPER";
}
function renderCode(searchText="") {
  const q = normalize(searchText);
  const items = codeCatalog.filter(item => normalize(item.name + " " + item.category + " " + item.description).includes(q));
  codeList.replaceChildren();
  items.forEach(item => {
    const card = document.createElement('article'); card.className='knowledge-card';
    const content=document.createElement('div'); content.className='knowledge-card-content';
    const category=document.createElement('div'); category.className='code-category'; category.textContent=item.category;
    const name=document.createElement('div'); name.className='knowledge-key'; name.textContent=item.name;
    const desc=document.createElement('p'); desc.className='knowledge-answer'; desc.textContent=item.description;
    const pre=document.createElement('code'); pre.className='code-snippet'; pre.textContent=item.code;
    const copy=document.createElement('button'); copy.className='code-copy'; copy.textContent='Копировать код';
    copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(item.code); copy.textContent='Скопировано!'; } catch { copy.textContent='Не удалось скопировать'; } });
    content.append(category,name,desc,pre,copy); card.append(content); codeList.append(card);
  });
  codeCount.textContent=`Найдено: ${items.length} из ${codeCatalog.length}`;
  codeEmpty.hidden=items.length!==0;
}
function showAppTab(tab) {
  const showChat=tab==='chat', showKnowledge=tab==='knowledge', showCode=tab==='code', showPlans=tab==='plans';
  if (showCode && currentTier !== 'super') { addMessage('assistant','Fudik AI Code доступен только в тарифе SUPER за $13.99. Открой раздел «Тарифы», чтобы посмотреть возможности.'); return; }
  chatView.hidden=!showChat; knowledgePage.hidden=!showKnowledge; codePage.hidden=!showCode; plansPage.hidden=!showPlans;
  composerArea.hidden=!showChat;
  chatTab.classList.toggle('active',showChat); knowledgeTab.classList.toggle('active',showKnowledge); codeTab.classList.toggle('active',showCode); plansTab.classList.toggle('active',showPlans);
  mobileTab.textContent=showKnowledge?'✉ Чат':showCode?'✧ Тарифы':showPlans?'✉ Чат':'⌕ База знаний';
  topTitle.innerHTML=showKnowledge?'База знаний <span>KNOWLEDGE</span>':showCode?'Fudik AI Code <span>SUPER</span>':showPlans?'Тарифы <span>PLANS</span>':'Личный ИИ-помощник <span>OFFLINE</span>';
  if(showKnowledge) renderKnowledge(knowledgeSearch.value);
  if(showCode) renderCode(codeSearch.value);
  if(showPlans) updateTierUI();
}
codeTab.addEventListener('click',()=>showAppTab('code'));
plansTab.addEventListener('click',()=>showAppTab('plans'));
codeSearch.addEventListener('input',()=>renderCode(codeSearch.value));
const purchaseModal = document.getElementById("purchaseModal");
const purchaseText = document.getElementById("purchaseText");
const confirmPurchase = document.getElementById("confirmPurchase");
const cancelPurchase = document.getElementById("cancelPurchase");
let pendingTier = null;

function closePurchaseModal() {
  purchaseModal.hidden = true;
  pendingTier = null;
}
document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{
  const selectedTier = button.dataset.plan;
  if (selectedTier === currentTier) return;
  pendingTier = selectedTier;
  const price = selectedTier === "pro" ? "$5.99" : selectedTier === "super" ? "$13.99" : "$0";
  purchaseText.textContent = `Ты действительно хочешь выбрать тариф ${tierName(selectedTier)} за ${price}? После подтверждения тариф включится. Деньги списываться не будут.`;
  purchaseModal.hidden = false;
}));
cancelPurchase.addEventListener("click", closePurchaseModal);
document.querySelector("[data-close-purchase]").addEventListener("click", closePurchaseModal);
confirmPurchase.addEventListener("click",()=>{
  if (!pendingTier) return;
  currentTier = pendingTier;
  localStorage.setItem('fudikAITier', currentTier);
  closePurchaseModal();
  updateTierUI();
  renderKnowledge(knowledgeSearch.value);
  if(currentTier==='super') addMessage('assistant','SUPER включён! Теперь доступен Fudik AI Code. Это демонстрационная активация — реальная оплата не производилась.');
  else addMessage('assistant',`Тариф ${tierName(currentTier)} выбран. Это демонстрационная активация — реальная оплата не производилась.`);
});
updateTierUI();

// Дополнительные ответы доступны только на PRO и SUPER.
const originalAnswerQuestion = answerQuestion;
answerQuestion = function(raw) {
  const q=normalize(raw);
  if(currentTier==='free' && (q.includes('код blox fruits') || q.includes('fudik ai code') || q.includes('промокод'))) return 'Каталог Fudik AI Code доступен в тарифе SUPER за $13.99. Открой раздел «Тарифы», чтобы узнать больше.';
  if(currentTier==='pro' || currentTier==='super') {
    const found=proKnowledge.find(item=>item.keys.some(key=>q===key || q.includes(key)));
    if(found) return found.answer;
    if(q.includes('что нового в pro') || q.includes('возможности pro')) return 'В PRO доступны расширенная база знаний по программированию, технологиям, науке, истории и географии, а также более подробные встроенные ответы.';
  }
  return originalAnswerQuestion(raw);
};


