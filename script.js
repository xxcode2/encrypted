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
        decryptSound.play();
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
    document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
    document.querySelector(link.getAttribute('href')).classList.remove('hidden');
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    if (link.getAttribute('href') === '#gallery') loadGallery();
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

// Expose function to global for onclick
window.generateAvatar = generateAvatar;
window.downloadAvatar = downloadAvatar;
window.shareContent = shareContent;
window.copyCode = copyCode;
window.clearGallery = clearGallery;
window.deleteFromGallery = deleteFromGallery;