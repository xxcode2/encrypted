// script.js

// Sound Effect (base64 encoded simple beep)
const decryptSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function shortenHash(hash) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let short = '#';
  for (let i = 0; i < 10; i++) {
    const index = parseInt(hash[i], 16) % chars.length;
    short += chars[index];
  }
  return short;
}

function getRankedAvatar(hash) {
  const byte = parseInt(hash.slice(2, 4), 16);
  const ranks = ["Common", "Rare", "Epic", "Legendary"];
  const files = ["common.png", "rare.png", "epic.png", "legendary.png"];
  const index = byte % ranks.length;
  return {
    rank: ranks[index],
    url: `ai/${files[index]}`
  };
}

async function generateAvatar() {
  const discordName = document.getElementById("discordInput").value.trim().toLowerCase();
  const errorElem = document.getElementById("error-message");
  const regex = /^[a-z0-9._]{2,32}#[0-9]{4}$/;
  if (!regex.test(discordName)) {
    errorElem.textContent = "Invalid format! Use username#1234";
    errorElem.classList.add("show");
    return;
  }
  errorElem.classList.remove("show");

  document.getElementById("avatarContainer").innerHTML = `<div id="loading-spinner" style="display:block;"></div>`;

  try {
    const hash = await sha256(discordName);
    const encryptedCode = shortenHash(hash);
    const avatar = getRankedAvatar(hash);

    document.getElementById("avatarContainer").innerHTML = `
      <div class="card">
        <div class="card-inner">
          <div class="card-front">
            <p style="color:#a259ff; font-weight:bold; font-size:18px;">Decrypting...</p>
          </div>
          <div class="card-back">
            <img id="avatarImg" src="${avatar.url}" alt="${avatar.rank} Avatar" style="width:100%; border-radius:12px; margin-top:20px;">
            <p style="color:#a259ff; font-weight:bold; font-size:16px;">Rank: ${avatar.rank}</p>
            <p style="margin-top:10px; font-size:18px; color:#a259ff; font-weight:bold;">
              Encrypted Code: ${encryptedCode}
            </p>
            <button onclick="downloadAvatar('${avatar.url}', '${avatar.rank}', '${encryptedCode}')">Download Avatar</button>
            <button onclick="shareContent('${encryptedCode}', '${avatar.rank}')">Share Code</button>
            <button onclick="copyCode('${encryptedCode}')">Copy Code</button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const cardInner = document.querySelector(".card-inner");
      if (cardInner) {
        cardInner.classList.add("is-flipped");
        decryptSound.play().catch(error => console.error('Audio playback interrupted:', error));
      }
      saveToGallery(discordName, avatar.rank, encryptedCode, avatar.url);
    }, 1500);
  } catch (err) {
    alert("Error generating avatar: " + err.message);
  }
}

function downloadAvatar(url, rank, code) {
  const canvas = document.createElement('canvas');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height + 50; // Extra space for text
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = '#a259ff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Rank: ${rank}`, 10, img.height + 20);
    ctx.fillText(`Code: ${code}`, 10, img.height + 40);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${rank}_avatar_${code}.png`;
    a.click();
  };
}

async function shareContent(code, rank) {
  const shareData = {
    title: 'Encrypted Avatar',
    text: `My Encrypted Code: ${code} (Rank: ${rank})`,
    url: window.location.href
  };
  try {
    await navigator.share(shareData);
  } catch (err) {
    navigator.clipboard.writeText(shareData.text);
    alert('Code copied to clipboard!');
  }
}

function copyCode(code) {
  navigator.clipboard.writeText(code);
  alert('Encrypted Code copied!');
}

function saveToGallery(username, rank, code, url) {
  const gallery = JSON.parse(localStorage.getItem('avatarGallery') || '[]');
  gallery.push({ username, rank, code, url });
  localStorage.setItem('avatarGallery', JSON.stringify(gallery));
}

function loadGallery() {
  const gallery = JSON.parse(localStorage.getItem('avatarGallery') || '[]');
  const container = document.getElementById('galleryContainer');
  container.innerHTML = '';
  gallery.forEach((item, index) => {
    const card = `
      <div class="card" style="width:200px;">
        <img src="${item.url}" alt="${item.rank}" style="width:100%; border-radius:12px;">
        <p>Rank: ${item.rank}</p>
        <p>Code: ${item.code}</p>
        <p>Username: ${item.username}</p>
        <button onclick="deleteFromGallery(${index})">Delete</button>
      </div>
    `;
    container.innerHTML += card;
  });
}

function deleteFromGallery(index) {
  const gallery = JSON.parse(localStorage.getItem('avatarGallery') || '[]');
  gallery.splice(index, 1);
  localStorage.setItem('avatarGallery', JSON.stringify(gallery));
  loadGallery();
}

function clearGallery() {
  localStorage.removeItem('avatarGallery');
  loadGallery();
}

// Navbar & Sections Navigation
document.querySelectorAll('.menu a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    // sembunyikan semua section
    document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));

    // ambil target id
    const targetId = link.getAttribute('href').substring(1); // buang tanda #
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }

    // update menu aktif
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');

    // load gallery atau game
    if (targetId === 'gallery') loadGallery();
    if (targetId === 'game') initGame();
  });
});

document.querySelector('.hamburger').addEventListener('click', () => {
  document.querySelector('.menu').classList.toggle('show');
});

// Dark/Light Mode
const modeToggle = document.getElementById('mode-toggle');
modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  modeToggle.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
  localStorage.setItem('mode', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

// Load Mode
if (localStorage.getItem('mode') === 'light') {
  document.body.classList.add('light-mode');
  modeToggle.textContent = '☀️';
}

// Back to Top
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop.style.display = window.scrollY > 200 ? 'block' : 'none';
});
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Init Particles
particlesJS('particles-js', {
  particles: {
    number: { value: 50, density: { enable: true, value_area: 800 } },
    color: { value: '#a259ff' },
    shape: { type: 'circle' },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    line_linked: { enable: true, distance: 150, color: '#a259ff', opacity: 0.4, width: 1 },
    move: { enable: true, speed: 2, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
  },
  interactivity: {
    detect_on: 'canvas',
    events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
    modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
  },
  retina_detect: true
});

// Tambah event listener untuk button generate
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generate-btn').addEventListener('click', generateAvatar);
});

// Game Logic (disesuaikan dan digabung)
let shrimpX;
let score;
let level;
let gameRunning;
let gamePaused;
let foods;
let bubbles;
let gameSpeed;
let foodSpawnRate;
let foodFallSpeed;
let gameTime;
let timeLeft;
let gameLoopId = null;
let gameTimer = null;
window._gameLoopRunning = false;

function initGame() {
  const gameContainer = document.getElementById('gameContainer');
  const gameArea = document.getElementById('gameArea');
  const shrimp = document.getElementById('shrimp');
  const scoreElement = document.getElementById('score');
  const levelElement = document.getElementById('level');
  const speedElement = document.getElementById('speed');
  const timerElement = document.getElementById('timer');
  const gameOverElement = document.getElementById('gameOver');
  const pauseScreenElement = document.getElementById('pauseScreen');
  const finalScoreElement = document.getElementById('finalScore');
  const finalLevelElement = document.getElementById('finalLevel');
  const mobileControls = document.getElementById('mobileControls');
  const leftBtn = document.getElementById('btnLeft');
  const rightBtn = document.getElementById('btnRight');
  const pauseBtn = document.getElementById('btnPause');

  // Reset variables
  shrimpX = 410;
  score = 0;
  level = 1;
  gameRunning = true;
  gamePaused = false;
  foods = [];
  bubbles = [];
  gameSpeed = 1;
  foodSpawnRate = 0.012;
  foodFallSpeed = 1;
  timeLeft = 60;

  scoreElement.textContent = score;
  levelElement.textContent = level;
  speedElement.textContent = '1x';
  timerElement.textContent = timeLeft;
  shrimp.style.left = shrimpX + 'px';
  shrimp.style.transform = 'scaleX(1)';

  // Hapus semua makanan dan gelembung existing
  const existingFoods = gameArea.querySelectorAll('.food');
  existingFoods.forEach(food => food.remove());
  const existingBubbles = gameArea.querySelectorAll('.bubble');
  existingBubbles.forEach(bubble => bubble.remove());
  const existingParticles = gameArea.querySelectorAll('.particle');
  existingParticles.forEach(particle => particle.remove());

  gameOverElement.style.display = 'none';
  pauseScreenElement.style.display = 'none';

  // Hentikan timer dan loop jika ada
  if (gameTimer) clearInterval(gameTimer);
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  // Mulai timer
  gameTimer = setInterval(() => {
    if (!gameRunning || gamePaused) return;
    timeLeft--;
    timerElement.textContent = timeLeft;
    if (timeLeft <= 10) {
      timerElement.style.color = '#ff4444';
      timerElement.style.fontSize = '18px';
    } else if (timeLeft <= 20) {
      timerElement.style.color = '#ffaa00';
    } else {
      timerElement.style.color = '#ffd700';
      timerElement.style.fontSize = '16px';
    }
    if (timeLeft <= 0) {
      gameOver();
    }
  }, 1000);

  // Mulai game loop jika belum running
  if (!window._gameLoopRunning) {
    window._gameLoopRunning = true;
    gameLoop();
  }

  // Spawn makanan awal
  setTimeout(() => createFood(), 2000);

  // Update mobile controls
  updateMobileControls();

  // Event listeners (hanya tambah jika belum ada)
  document.removeEventListener('keydown', handleKeydown);
  document.addEventListener('keydown', handleKeydown);

  leftBtn.removeEventListener('click', handleLeftClick);
  leftBtn.addEventListener('click', handleLeftClick);
  rightBtn.removeEventListener('click', handleRightClick);
  rightBtn.addEventListener('click', handleRightClick);
  pauseBtn.removeEventListener('click', handlePauseClick);
  pauseBtn.addEventListener('click', handlePauseClick);

  leftBtn.removeEventListener('touchstart', handleLeftTouch);
  leftBtn.addEventListener('touchstart', handleLeftTouch);
  rightBtn.removeEventListener('touchstart', handleRightTouch);
  rightBtn.addEventListener('touchstart', handleRightTouch);
  pauseBtn.removeEventListener('touchstart', handlePauseTouch);
  pauseBtn.addEventListener('touchstart', handlePauseTouch);
}

function handleKeydown(e) {
  if (!gameRunning) return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePause();
    return;
  }
  if (gamePaused) return;
  const speed = 12;
  switch(e.key) {
    case 'ArrowLeft':
      if (shrimpX > 0) {
        shrimpX -= speed;
        document.getElementById('shrimp').style.transform = 'scaleX(-1)';
      }
      break;
    case 'ArrowRight':
      if (shrimpX < 820) {
        shrimpX += speed;
        document.getElementById('shrimp').style.transform = 'scaleX(1)';
      }
      break;
  }
  document.getElementById('shrimp').style.left = shrimpX + 'px';
}

function handleLeftClick() {
  if (!gameRunning || gamePaused) return;
  if (shrimpX > 0) {
    shrimpX -= 12;
    document.getElementById('shrimp').style.transform = 'scaleX(-1)';
    document.getElementById('shrimp').style.left = shrimpX + 'px';
  }
}

function handleRightClick() {
  if (!gameRunning || gamePaused) return;
  if (shrimpX < 820) {
    shrimpX += 12;
    document.getElementById('shrimp').style.transform = 'scaleX(1)';
    document.getElementById('shrimp').style.left = shrimpX + 'px';
  }
}

function handlePauseClick() {
  togglePause();
}

function handleLeftTouch(e) {
  e.preventDefault();
  handleLeftClick();
}

function handleRightTouch(e) {
  e.preventDefault();
  handleRightClick();
}

function handlePauseTouch(e) {
  e.preventDefault();
  togglePause();
}

function togglePause() {
  gamePaused = !gamePaused;
  if (gamePaused) {
    document.getElementById('pauseScreen').style.display = 'block';
  } else {
    document.getElementById('pauseScreen').style.display = 'none';
  }
}

function createFood() {
  const food = document.createElement('div');
  food.className = 'food';
  food.style.left = Math.random() * 860 + 'px';
  food.style.top = '80px';

  const img = document.createElement('img');
  img.src = 'ai/arcium.jpg';
  img.alt = 'Irys';
  food.appendChild(img);

  document.getElementById('gameArea').appendChild(food);
  foods.push({
    element: food,
    x: parseFloat(food.style.left),
    y: 80,
    speed: foodFallSpeed + Math.random() * 2
  });
}

function createBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const size = Math.random() * 25 + 15;
  bubble.style.width = size + 'px';
  bubble.style.height = size + 'px';
  bubble.style.left = Math.random() * 880 + 'px';
  bubble.style.bottom = '0px';
  document.getElementById('gameArea').appendChild(bubble);
  
  setTimeout(() => {
    if (bubble.parentNode) {
      bubble.parentNode.removeChild(bubble);
    }
  }, 4000);
}

function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + Math.random() * 40 + 'px';
    particle.style.top = y + Math.random() * 40 + 'px';
    document.getElementById('gameArea').appendChild(particle);
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 1000);
  }
}

function checkCollision(shrimpRect, foodRect) {
  return !(shrimpRect.right < foodRect.left || 
          shrimpRect.left > foodRect.right || 
          shrimpRect.bottom < foodRect.top || 
          shrimpRect.top > foodRect.bottom);
}

function gameLoop() {
  gameLoopId = requestAnimationFrame(gameLoop);
  if (!gameRunning || gamePaused) {
    return;
  }

  const shrimpRect = document.getElementById('shrimp').getBoundingClientRect();

  foods.forEach((food, index) => {
    food.y += food.speed * gameSpeed;
    food.element.style.top = food.y + 'px';

    const foodRect = food.element.getBoundingClientRect();
    if (checkCollision(shrimpRect, foodRect)) {
      createParticles(food.x, food.y);
      food.element.remove();
      foods.splice(index, 1);
      score += 10 * level;
      document.getElementById('score').textContent = score;
      
      if (score >= level * 200) {
        level++;
        document.getElementById('level').textContent = level;
        gameSpeed += 0.1;
        foodSpawnRate += 0.003;
        foodFallSpeed += 0.3;
        document.getElementById('speed').textContent = gameSpeed.toFixed(1) + 'x';
      }
    } else if (food.y > (window.innerWidth <= 600 ? 520 : 670)) {
      food.element.remove();
      foods.splice(index, 1);
    }
  });

  if (Math.random() < foodSpawnRate) {
    createFood();
  }

  if (Math.random() < 0.02) {
    createBubble();
  }

  if (!gameRunning) {
    window._gameLoopRunning = false;
  }
}

function gameOver() {
  gameRunning = false;
  clearInterval(gameTimer);
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalLevel').textContent = level;
  document.getElementById('gameOver').style.display = 'block';
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

function restartGame() {
  initGame();  // Restart dengan inisialisasi ulang
}

function updateMobileControls() {
  const controls = document.getElementById('mobileControls');
  if (window.innerWidth <= 600) {
    controls.style.display = 'flex';
  } else {
    controls.style.display = 'none';
  }
}
window.addEventListener('resize', updateMobileControls);

// Expose function to global for onclick
window.generateAvatar = generateAvatar;
window.downloadAvatar = downloadAvatar;
window.shareContent = shareContent;
window.copyCode = copyCode;
window.clearGallery = clearGallery;
window.deleteFromGallery = deleteFromGallery;
window.togglePause = togglePause;
window.restartGame = restartGame;