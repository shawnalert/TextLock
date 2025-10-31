async function getKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText() {
  const text = document.getElementById("plainText").value;
  const password = document.getElementById("password").value;
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );
  const result = btoa([...iv, ...new Uint8Array(encrypted)].map(b => String.fromCharCode(b)).join(""));
  document.getElementById("result").textContent = result;
}

async function decryptText() {
  const encryptedText = document.getElementById("encryptedText").value;
  const password = document.getElementById("password").value;
  const data = atob(encryptedText).split("").map(c => c.charCodeAt(0));
  const iv = new Uint8Array(data.slice(0, 12));
  const encrypted = new Uint8Array(data.slice(12));
  const key = await getKey(password);
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    const dec = new TextDecoder();
    document.getElementById("result").textContent = dec.decode(decrypted);
  } catch (e) {
    document.getElementById("result").textContent = "Decryption failed. Check your password.";
  }
}

function copyToClipboard() {
  const text = document.getElementById("result").textContent;
  navigator.clipboard.writeText(text);
}

function shareText() {
  const text = document.getElementById("result").textContent;
  if (navigator.share) {
    navigator.share({ text });
  } else {
    alert("Web Share API not supported.");
  }
}
