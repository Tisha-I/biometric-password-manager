document.getElementById('register').onclick = register;
document.getElementById('login').onclick = login;
document.getElementById('save').onclick = savePassword;

function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function register() {
  const challenge = Uint8Array.from('random-challenge-1234', c => c.charCodeAt(0));

  const publicKey = {
    challenge: challenge,
    rp: {
      name: "Biometric Password Manager"
    },
    user: {
      id: Uint8Array.from('user123', c => c.charCodeAt(0)),
      name: "user@example.com",
      displayName: "Example User"
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // tells it to use Windows Hello
      userVerification: "required"
    },
    timeout: 60000,
    attestation: "none"
  };

  try {
    const credential = await navigator.credentials.create({ publicKey });
    const id = bufferToBase64(credential.rawId);
    localStorage.setItem('webauthnId', id);
    alert("Registration complete with Windows Hello!");
  } catch (err) {
    console.error(err);
    alert("Registration failed: " + err.message);
  }
}

async function login() {
  const rawId = localStorage.getItem('webauthnId');
  if (!rawId) {
    alert("No credential registered yet.");
    return;
  }

  const publicKey = {
    challenge: Uint8Array.from('login-challenge-5678', c => c.charCodeAt(0)),
    allowCredentials: [{
      id: base64ToBuffer(rawId),
      type: "public-key",
      transports: ["internal"]
    }],
    userVerification: "required",
    timeout: 60000
  };

  try {
    const assertion = await navigator.credentials.get({ publicKey });
    document.getElementById('auth-status').textContent = "Authenticated with Windows Hello!";
    document.getElementById('manager').style.display = 'block';
    loadPasswords();
  } catch (err) {
    console.error(err);
    document.getElementById('auth-status').textContent = "Authentication failed: " + err.message;
  }
}

function savePassword() {
  const site = document.getElementById('site').value;
  const pass = document.getElementById('password').value;

  if (!site || !pass) {
    alert("Please enter both fields.");
    return;
  }

  const data = JSON.parse(localStorage.getItem('passwords') || "{}");
  data[site] = pass;
  localStorage.setItem('passwords', JSON.stringify(data));
  loadPasswords();

  document.getElementById('site').value = '';
  document.getElementById('password').value = '';
}

function loadPasswords() {
  const data = JSON.parse(localStorage.getItem('passwords') || "{}");
  const list = document.getElementById('passwords');
  list.innerHTML = '';
  for (let site in data) {
    const li = document.createElement('li');
    li.textContent = `${site}: ${data[site]}`;
    list.appendChild(li);
  }
}
