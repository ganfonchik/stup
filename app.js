let jobs = [];
let currentIndex = 0;
let currentUser = null;
let currentUserRole = null;
let usersDatabase = JSON.parse(localStorage.getItem("usersDatabase")) || {};

// ---- LOAD DATA ----
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    jobs = data;
    autoLogin();
  });

// ---- SCREEN NAVIGATION ----
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");

  const appRoot = document.querySelector(".app");
  if (appRoot) {
    if (screenId === "main") {
      appRoot.classList.add("app--main");
    } else {
      appRoot.classList.remove("app--main");
    }
  }
}

function goToStartScreen() {
  showScreen("startScreen");
  currentIndex = 0;
}

function goToLoginScreen() {
  showScreen("loginScreen");
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  switchLoginRole("worker");
}

function goToRegisterScreen() {
  showScreen("registerScreen");
  document.getElementById("registerName").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
  document.getElementById("registerSpecialty").value = "";
  document.getElementById("registerSkills").value = "";
  document.getElementById("registerCompany").value = "";
  document.getElementById("registerDescription").value = "";
  switchRegisterRole("worker");
}

// ---- ROLE SWITCHING ----
function switchLoginRole(role) {
  currentUserRole = role;
  updateTabButtons("loginScreen", role);
}

function switchRegisterRole(role) {
  currentUserRole = role;
  updateTabButtons("registerScreen", role);
  
  const workerFields = document.getElementById("workerFields");
  const employerFields = document.getElementById("employerFields");
  
  if (role === "worker") {
    workerFields.classList.remove("hidden");
    employerFields.classList.add("hidden");
  } else {
    workerFields.classList.add("hidden");
    employerFields.classList.remove("hidden");
  }
}

function updateTabButtons(screenId, activeRole) {
  const screen = document.getElementById(screenId);
  const tabs = screen.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    const role = tab.dataset.role;
    if (role === activeRole) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

// ---- AUTHENTICATION ----
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (usersDatabase[email] && usersDatabase[email].password === password && usersDatabase[email].role === currentUserRole) {
    currentUser = usersDatabase[email];
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    loadMainScreen();
  } else {
    alert("Неверная почта, пароль или роль");
  }
}

function handleRegister(event) {
  event.preventDefault();
  
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  if (usersDatabase[email]) {
    alert("Эта почта уже зарегистрирована!");
    return;
  }

  const newUser = {
    email,
    password,
    role: currentUserRole,
    name,
    createdAt: new Date().toISOString()
  };

  if (currentUserRole === "worker") {
    newUser.specialty = document.getElementById("registerSpecialty").value;
    newUser.skills = document.getElementById("registerSkills").value.split(",").map(s => s.trim());
  } else {
    newUser.company = document.getElementById("registerCompany").value;
    newUser.description = document.getElementById("registerDescription").value;
  }

  usersDatabase[email] = newUser;
  localStorage.setItem("usersDatabase", JSON.stringify(usersDatabase));

  currentUser = newUser;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  
  alert("Регистрация успешна!");
  loadMainScreen();
}

function logout() {
  currentUser = null;
  currentUserRole = null;
  localStorage.removeItem("currentUser");
  currentIndex = 0;
  goToStartScreen();
}

function autoLogin() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    currentUserRole = currentUser.role;
    loadMainScreen();
  }
}

// ---- MAIN FEED ----
function loadMainScreen() {
  currentIndex = 0;
  const roleText = currentUserRole === "worker" 
    ? "Вакансии" 
    : "Кандидаты";
  
  document.getElementById("roleTitle").innerText = `${roleText} для ${currentUser.name}`;
  const sideMenu = document.getElementById("sideMenu");
  if (sideMenu && sideMenu.classList.contains("open")) {
    sideMenu.classList.remove("open");
  }
  showScreen("main");
  renderCard();
  updateCounter();
}

function renderCard() {
  const card = document.getElementById("jobCard");
  const filteredJobs = getFilteredJobs();

  if (currentIndex >= filteredJobs.length) {
    card.innerHTML = `
      <div class="no-more">
        <h3>Больше нет ${currentUserRole === "worker" ? "вакансий" : "кандидатов"}!</h3>
        <p>Загляните позже за новыми ${currentUserRole === "worker" ? "вакансиями" : "кандидатами"}</p>
      </div>
    `;
    return;
  }

  const item = filteredJobs[currentIndex];
  const imageUrl = item.image || "images/peop1.jpeg";
  const fallbackImageUrl = imageUrl.startsWith("images/") ? `../${imageUrl}` : imageUrl;
  const summaryText = item.summary || "Кратко о кандидате: пока нет описания.";
  
  let cardHTML = `
    <div class="card-media">
      <img class="profile-photo" src="${imageUrl}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImageUrl}';">
    </div>
    <div class="card-header">
      <h3>${item.title}</h3>
      <span class="card-badge">${item.level || "Любой уровень"}</span>
    </div>
    <div class="card-body">
      <div class="card-item">
        <span class="label">Компания:</span>
        <span class="value">${item.company}</span>
      </div>
      <div class="card-item">
        <span class="label">Стек:</span>
        <span class="value">${item.stack}</span>
      </div>
      <div class="card-item">
        <span class="label">Формат:</span>
        <span class="value">${item.format}</span>
      </div>
      <div class="card-item">
        <span class="label">Зарплата:</span>
        <span class="value salary">${item.salary || "По договорённости"}</span>
      </div>
    </div>
    <div class="card-description">
      <p>${item.description || "Отличная возможность прокачать навыки!"}</p>
    </div>
    <div class="card-summary">
      <h4>Краткое резюме</h4>
      <p>${summaryText}</p>
    </div>
  `;

  card.innerHTML = cardHTML;
}

function updateCounter() {
  const counter = document.getElementById("counter");
  const filteredJobs = getFilteredJobs();
  const remaining = filteredJobs.length - currentIndex;
  counter.textContent = `Осталось: ${Math.max(0, remaining)}`;
}

// ---- SWIPE ----
function swipe(like) {
  const filteredJobs = getFilteredJobs();
  const currentJob = filteredJobs[currentIndex];
  
  // Add to favorites if super like
  if (like === "super" && currentJob) {
    addToFavorites(currentJob);
  }
  
  // Track likes
  if (like === true) {
    let likedCount = parseInt(localStorage.getItem("likedCount")) || 0;
    localStorage.setItem("likedCount", likedCount + 1);
  }
  
  if (like && Math.random() > 0.5) {
    showChat();
    return;
  }

  currentIndex++;
  renderCard();  
  updateCounter();
}

// ---- CHAT ----
function showChat() {
  const filteredJobs = getFilteredJobs();
  const item = filteredJobs[currentIndex];
  const title = currentUserRole === "worker" 
    ? item.company 
    : item.title;
  
  document.getElementById("matchTitle").textContent = `Совпадение с ${title}!`;
  showScreen("chatScreen");

  const chat = document.getElementById("chat");
  chat.innerHTML = "";

  addMessage("Система", `У вас совпадение с ${title}!`);
  setTimeout(() => {
    addMessage("HR", currentUserRole === "worker" 
      ? "Привет! Нам очень понравился ваш профиль! Давайте обсудим 😊" 
      : "Отличный профиль! Можем назначить интервью?");
  }, 800);
}

function backToMain() {
  currentIndex++;
  loadMainScreen();
}

function sendMessage(e) {
  if (e.key !== "Enter") return;

  const input = e.target;
  const text = input.value.trim();
  if (!text) return;

  addMessage("Вы", text);
  input.value = "";

  setTimeout(() => {
    const responses = [
      "Звучит отлично!",
      "Расскажите подробнее о своём опыте",
      "Когда вы можете начать?",
      "Отлично! Давайте двигаться дальше.",
      "Ждём сотрудничества!"
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addMessage("HR", randomResponse);
  }, 700);
}

function addMessage(author, text) {
  const chat = document.getElementById("chat");
  const msg = document.createElement("div");
  msg.className = `message ${author === "Вы" ? "user" : "hr"}`;
  msg.innerHTML = `<strong>${author}:</strong> ${text}`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

// ---- FILTER FUNCTIONS ----
let filters = {
  direction: "",
  minProjects: 0,
  maxProjects: 100,
  level: ""
};

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  menu.classList.toggle("open");
  updateAccountInfo();
}

function updateAccountInfo() {
  const accountInfo = document.getElementById("accountInfo");
  if (currentUser) {
    accountInfo.innerHTML = `<p class="user-info">${currentUser.name}<br><small>${currentUser.email}</small></p>`;
  }
}

function applyFilters() {
  filters.direction = document.getElementById("filterDirection").value;
  filters.minProjects = parseInt(document.getElementById("filterMinProjects").value) || 0;
  filters.maxProjects = parseInt(document.getElementById("filterMaxProjects").value) || 100;
  filters.level = document.getElementById("filterLevel").value;
  
  currentIndex = 0;
  renderCard();
  updateCounter();
}

function resetFilters() {
  filters = {
    direction: "",
    minProjects: 0,
    maxProjects: 100,
    level: ""
  };
  
  document.getElementById("filterDirection").value = "";
  document.getElementById("filterMinProjects").value = "0";
  document.getElementById("filterMaxProjects").value = "100";
  document.getElementById("filterLevel").value = "";
  
  currentIndex = 0;
  renderCard();
  updateCounter();
}

function getFilteredJobs() {
  return jobs.filter(job => {
    // Filter by direction
    if (filters.direction && job.specialty && job.specialty.toLowerCase() !== filters.direction.toLowerCase()) {
      return false;
    }
    
    // Filter by projects count
    const projectsCount = job.projectsCount || 0;
    if (projectsCount < filters.minProjects || projectsCount > filters.maxProjects) {
      return false;
    }
    
    // Filter by experience level
    if (filters.level) {
      const yearsExp = job.yearsExperience || 0;
      if (filters.level === "junior" && yearsExp > 2) return false;
      if (filters.level === "middle" && (yearsExp <= 2 || yearsExp > 5)) return false;
      if (filters.level === "senior" && yearsExp <= 5) return false;
    }
    
    return true;
  });
}

// Close menu when clicking outside (backdrop)
document.addEventListener("click", function(event) {
  const sideMenu = document.getElementById("sideMenu");
  const menuToggle = document.querySelector(".menu-toggle");
  
  if (sideMenu && sideMenu.classList.contains("open")) {
    // Check if click is outside both menu and toggle button
    if (!sideMenu.contains(event.target) && event.target !== menuToggle) {
      sideMenu.classList.remove("open");
    }
  }
}, true);

// ---- STATISTICS & FAVORITES ----
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let stats = {
  viewed: 0,
  liked: 0,
  favorites: 0
};

function toggleStatsPanel() {
  const panel = document.getElementById("statsPanel");
  panel.classList.toggle("open");
  updateStatistics();
}

function updateStatistics() {
  stats.viewed = currentIndex;
  stats.liked = localStorage.getItem("likedCount") ? parseInt(localStorage.getItem("likedCount")) : 0;
  stats.favorites = favorites.length;
  
  document.getElementById("totalViewed").textContent = stats.viewed;
  document.getElementById("totalLiked").textContent = stats.liked;
  document.getElementById("totalFavorites").textContent = stats.favorites;
  
  renderFavoritesList();
}

function renderFavoritesList() {
  const favoritesList = document.getElementById("favoritesList");
  
  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-message">Пока нет избранного. Добавьте с помощью кнопки ★</p>';
    return;
  }
  
  favoritesList.innerHTML = favorites.map(job => `
    <div class="favorite-item">
      <h5 style="margin: 0 0 4px 0;">${job.title}</h5>
      <p style="margin: 0; font-size: 12px; color: #666;">${job.company}</p>
    </div>
  `).join("");
}

function addToFavorites(job) {
  if (!favorites.find(fav => fav.title === job.title)) {
    favorites.push(job);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateStatistics();
  }
}

// ---- SCREEN NAVIGATION ----
function goToMainScreen() {
  showScreen("main");
  document.getElementById("sideMenu").classList.remove("open");
}

function goToChatsScreen() {
  showScreen("chatsScreen");
  renderChatsList();
}

function backToChats() {
  goToChatsScreen();
}

function renderChatsList() {
  const chatsList = document.getElementById("chatsList");
  
  // Simulated chats - replace with real data
  const mockChats = [
    { id: 1, company: "Google", lastMessage: "Хотим пригласить вас на интервью", time: "2ч" },
    { id: 2, company: "Microsoft", lastMessage: "Ваш профиль нам подходит", time: "4ч" },
    { id: 3, company: "Apple", lastMessage: "Вам интересна эта позиция?", time: "1д" }
  ];
  
  if (mockChats.length === 0) {
    chatsList.innerHTML = '<div class="empty-state"><p>Пока нет сообщений</p><p class="small">Сообщения от компаний появятся здесь</p></div>';
    return;
  }
  
  chatsList.innerHTML = '<div class="chats-list-inner">' + mockChats.map(chat => `
    <div class="chat-item" onclick="openChat(${chat.id})">
      <div class="chat-item-header">
        <h4>${chat.company}</h4>
        <span class="chat-time">${chat.time}</span>
      </div>
      <p class="chat-item-message">${chat.lastMessage}</p>
    </div>
  `).join("") + '</div>';
}

function openChat(chatId) {
  showScreen("chatScreen");
  document.getElementById("matchTitle").textContent = "Чат #" + chatId;
  document.getElementById("chat").innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;">Сообщения чата появятся здесь</p>';
}
