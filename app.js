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
    if (tab.textContent.toLowerCase() === (activeRole === "worker" ? "worker" : "employer")) {
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
    alert("Invalid email, password, or role mismatch");
  }
}

function handleRegister(event) {
  event.preventDefault();
  
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  if (usersDatabase[email]) {
    alert("Email already registered!");
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
  
  alert("Registration successful!");
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
    ? "Job Vacancies" 
    : "Candidates";
  
  document.getElementById("roleTitle").innerText = `${roleText} for ${currentUser.name}`;
  document.getElementById("filterPanel").classList.remove("open");
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
        <h3>🎉 No more ${currentUserRole === "worker" ? "vacancies" : "candidates"}!</h3>
        <p>Check back later for new ${currentUserRole === "worker" ? "job" : "candidate"} listings</p>
      </div>
    `;
    return;
  }

  const item = filteredJobs[currentIndex];
  
  let cardHTML = `
    <div class="card-header">
      <h3>${item.title}</h3>
      <span class="card-badge">${item.level || "All Levels"}</span>
    </div>
    <div class="card-body">
      <div class="card-item">
        <span class="label">Company:</span>
        <span class="value">${item.company}</span>
      </div>
      <div class="card-item">
        <span class="label">Stack:</span>
        <span class="value">${item.stack}</span>
      </div>
      <div class="card-item">
        <span class="label">Format:</span>
        <span class="value">${item.format}</span>
      </div>
      <div class="card-item">
        <span class="label">Salary:</span>
        <span class="value salary">${item.salary || '$TBD'}</span>
      </div>
    </div>
    <div class="card-description">
      <p>${item.description || "Exciting opportunity to grow your skills!"}</p>
    </div>
  `;

  card.innerHTML = cardHTML;
}

function updateCounter() {
  const counter = document.getElementById("counter");
  const filteredJobs = getFilteredJobs();
  const remaining = filteredJobs.length - currentIndex;
  counter.textContent = `${Math.max(0, remaining)} left`;
}

// ---- SWIPE ----
function swipe(like) {
  const filteredJobs = getFilteredJobs();
  
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
  
  document.getElementById("matchTitle").textContent = `Match with ${title}! 🎉`;
  showScreen("chatScreen");

  const chat = document.getElementById("chat");
  chat.innerHTML = "";

  addMessage("System", `You matched with ${title}!`);
  setTimeout(() => {
    addMessage("HR", currentUserRole === "worker" 
      ? "Hi! We love your profile! Let's talk 😊" 
      : "Great profile! Can we schedule an interview?");
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

  addMessage("You", text);
  input.value = "";

  setTimeout(() => {
    const responses = [
      "That sounds great!",
      "Tell us more about your experience",
      "When can you start?",
      "Excellent! Let's move forward.",
      "Looking forward to working with you!"
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addMessage("HR", randomResponse);
  }, 700);
}

function addMessage(author, text) {
  const chat = document.getElementById("chat");
  const msg = document.createElement("div");
  msg.className = `message ${author === "You" ? "user" : "hr"}`;
  msg.innerHTML = `<strong>${author}:</strong> ${text}`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

// ---- FILTER FUNCTIONS ----
let filters = {
  direction: '',
  minProjects: 0,
  maxProjects: 100,
  level: ''
};

function toggleFilterPanel() {
  const panel = document.getElementById("filterPanel");
  panel.classList.toggle("open");
}

function closeFilterPanel() {
  document.getElementById("filterPanel").classList.remove("open");
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
    direction: '',
    minProjects: 0,
    maxProjects: 100,
    level: ''
  };
  
  document.getElementById("filterDirection").value = '';
  document.getElementById("filterMinProjects").value = '0';
  document.getElementById("filterMaxProjects").value = '100';
  document.getElementById("filterLevel").value = '';
  
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
      if (filters.level === 'junior' && yearsExp > 2) return false;
      if (filters.level === 'middle' && (yearsExp <= 2 || yearsExp > 5)) return false;
      if (filters.level === 'senior' && yearsExp <= 5) return false;
    }
    
    return true;
  });
}

// Close panel when clicking outside (backdrop)
document.addEventListener('click', function(event) {
  const filterPanel = document.getElementById('filterPanel');
  const filterToggle = document.querySelector('.filter-toggle');
  
  if (filterPanel && filterPanel.classList.contains('open')) {
    // Check if click is outside both panel and toggle button
    if (!filterPanel.contains(event.target) && event.target !== filterToggle) {
      filterPanel.classList.remove('open');
    }
  }
}, true);
