document.addEventListener('DOMContentLoaded', () => {
  const isLogged = localStorage.getItem('pncp_auth');
  if (isLogged === 'true' && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
      window.location.href = 'app.html';
  }
});

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const user = document.getElementById('username').value;
      const pass = document.getElementById('password').value;

      // CREDENCIAIS DE ACESSO
      const validUser = "admin";
      const validPass = "123456";

      if (user === validUser && pass === validPass) {
          errorMsg.classList.add('hidden');
          localStorage.setItem('pncp_auth', 'true');
          window.location.href = 'app.html';
      } else {
          errorMsg.classList.remove('hidden');
          const card = loginForm.parentElement;
          card.classList.add('translate-x-1');
          setTimeout(() => card.classList.remove('translate-x-1'), 100);
      }
  });
}

function checkAuth() {
  const isLogged = localStorage.getItem('pncp_auth');
  if (isLogged !== 'true') {
      window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('pncp_auth');
  window.location.href = 'index.html';
}