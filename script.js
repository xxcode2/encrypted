// script.js

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

export async function generateAvatar() {
  // Ambil username Discord + discriminator dari input
  const discordName = document.getElementById("discordInput").value.trim();
  if (!discordName) return;

  // Hash username Discord (contoh: Irgi#1234)
  const hash = await sha256(discordName.toLowerCase());
  const encryptedCode = shortenHash(hash);
  const avatar = getRankedAvatar(hash);

  // Buat struktur card
  document.getElementById("avatarContainer").innerHTML = `
    <div class="card">
      <div class="card-inner">
        <div class="card-front">
          <p style="color:#a259ff; font-weight:bold; font-size:18px;">Decrypting...</p>
        </div>
        <div class="card-back">
          <img src="${avatar.url}" alt="${avatar.rank} Avatar" style="width:200px; border-radius:12px; margin-top:20px;">
          <p style="color:#a259ff; font-weight:bold; font-size:16px;">Rank: ${avatar.rank}</p>
          <p style="margin-top:10px; font-size:18px; color:#a259ff; font-weight:bold;">
            Encrypted Code: ${encryptedCode}
          </p>
        </div>
      </div>
    </div>
  `;

  // Flip animasi setelah delay
  setTimeout(() => {
    const cardInner = document.querySelector(".card-inner");
    if (cardInner) cardInner.classList.add("is-flipped");
  }, 1500);
}

window.generateAvatar = generateAvatar;