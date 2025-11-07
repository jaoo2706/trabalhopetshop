function salvar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}
function carregar(chave) {
  const v = localStorage.getItem(chave);
  return v ? JSON.parse(v) : [];
}
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

let usuarios = carregar('usuarios');
let animais = carregar('animais');
let adocoes = carregar('adocoes');
animais.forEach(a => { if (!a.id) a.id = gerarId(); });
usuarios.forEach(u => { if (!u.id) u.id = gerarId(); });
adocoes.forEach(d => { if (!d.id) d.id = gerarId(); });
salvar('animais', animais);
salvar('usuarios', usuarios);
salvar('adocoes', adocoes);

function loginAdmin(usuario, senha) {
  if (usuario === 'admin' && senha === '1234') {
    sessionStorage.setItem('adminLogado', 'true');
    return true;
  }
  return false;
}
function isAdminLogado() {
  return sessionStorage.getItem('adminLogado') === 'true';
}
function logoutAdmin() {
  sessionStorage.removeItem('adminLogado');
}

function getUsuarioLogado() {
  const id = sessionStorage.getItem('usuarioLogadoId');
  if (!id) return null;
  return usuarios.find(u => u.id === id) || null;
}
function setUsuarioLogado(id) {
  if (id) sessionStorage.setItem('usuarioLogadoId', id);
  else sessionStorage.removeItem('usuarioLogadoId');
}

function initHome() {
  const tbody = document.querySelector('#tabela-animais tbody');
  const infoUsuario = document.getElementById('info-usuario');
  const infoMaisNovo = document.getElementById('info-mais-novo');
  const infoUltimaAdocao = document.getElementById('info-ultima-adocao');
  const usuario = getUsuarioLogado();

  if (infoUsuario) {
    infoUsuario.textContent = usuario
      ? `Logado como: ${usuario.nome} (${usuario.email})`
      : 'Você não está logado. Faça login para adotar.';
  }

  if (!tbody) return;
  tbody.innerHTML = '';
  const disponiveis = animais.filter(a => !a.adotado);
  if (disponiveis.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Nenhum animal disponível 🐶</td></tr>';
  } else {
    disponiveis.forEach(a => {
      const tr = document.createElement('tr');
      const acao = usuario
        ? `<button onclick="adotarAnimal('${a.id}')">Adotar</button>`
        : 'Faça login para adotar';
      tr.innerHTML = `
        <td>${a.nome}</td>
        <td>${a.especie}</td>
        <td>${a.raca || '-'}</td>
        <td>${a.idade}</td>
        <td>${acao}</td>`;
      tbody.appendChild(tr);
    });
  }

  if (infoMaisNovo) {
    if (disponiveis.length > 0) {
      const maisNovo = disponiveis.reduce((menor, atual) =>
        Number(atual.idade) < Number(menor.idade) ? atual : menor
      );
      infoMaisNovo.textContent = `${maisNovo.nome} (${maisNovo.idade} ano${maisNovo.idade > 1 ? 's' : ''})`;
    } else {
      infoMaisNovo.textContent = 'Nenhum animal disponível.';
    }
  }

  if (infoUltimaAdocao) {
    if (adocoes.length > 0) {
      const ultima = adocoes[adocoes.length - 1];
      const animal = animais.find(a => a.id === ultima.animalId);
      const adotante = usuarios.find(u => u.id === ultima.usuarioId);
      infoUltimaAdocao.textContent = `${animal ? animal.nome : '---'} por ${
        adotante ? adotante.nome : '---'
      } em ${ultima.data}`;
    } else {
      infoUltimaAdocao.textContent = 'Nenhuma adoção registrada.';
    }
  }
}

function adotarAnimal(idAnimal) {
  const usuario = getUsuarioLogado();
  if (!usuario) return alert('Você precisa estar logado para adotar.');
  const animal = animais.find(a => a.id === idAnimal);
  if (!animal || animal.adotado) return alert('Animal não disponível.');

  const hoje = new Date().toISOString().split('T')[0];
  animal.adotado = true;
  animal.adotanteId = usuario.id;
  adocoes.push({ id: gerarId(), animalId: animal.id, usuarioId: usuario.id, data: hoje });
  salvar('animais', animais);
  salvar('adocoes', adocoes);
  alert(`🎉 ${usuario.nome} adotou ${animal.nome}!`);
  initHome();
}

function initLoginPage() {
  const formReg = document.getElementById('form-registro');
  const formLog = document.getElementById('form-login');
  const status = document.getElementById('status');
  const info = document.getElementById('info-logado');
  const btnLogout = document.getElementById('btn-logout');
  const usuario = getUsuarioLogado();

  if (info) info.textContent = usuario ? `Logado como: ${usuario.nome}` : 'Nenhum usuário logado.';

  if (formReg) {
    formReg.addEventListener('submit', e => {
      e.preventDefault();
      const nome = formReg.nome.value.trim();
      const email = formReg.email.value.trim();
      const senha = formReg.senha.value.trim();
      if (!nome || !email || !senha) return alert('Preencha todos os campos.');
      if (usuarios.some(u => u.email === email)) return alert('Email já cadastrado.');
      usuarios.push({ id: gerarId(), nome, email, senha });
      salvar('usuarios', usuarios);
      alert('Usuário registrado!');
      formReg.reset();
    });
  }

  if (formLog) {
    formLog.addEventListener('submit', e => {
      e.preventDefault();
      const email = formLog.email.value.trim();
      const senha = formLog.senha.value.trim();
      const user = usuarios.find(u => u.email === email && u.senha === senha);
      if (user) {
        setUsuarioLogado(user.id);
        alert('Login realizado!');
        window.location.href = 'index.html';
      } else {
        status.textContent = 'Credenciais incorretas.';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      setUsuarioLogado(null);
      alert('Logout realizado.');
      window.location.reload();
    });
  }
}

function initAdminPage() {
  const formLogin = document.getElementById('form-admin-login');
  const status = document.getElementById('admin-status');
  const area = document.getElementById('admin-area');
  const btnLogout = document.getElementById('btn-admin-logout');
  const formAnimal = document.getElementById('form-animal');
  const tabelaAnimais = document.querySelector('#tabela-admin-animais tbody');
  const tabelaUsuarios = document.querySelector('#tabela-admin-usuarios tbody');

  if (isAdminLogado()) mostrarPainelAdmin();

  if (formLogin) {
    formLogin.addEventListener('submit', e => {
      e.preventDefault();
      const usuario = formLogin.usuario.value.trim();
      const senha = formLogin.senha.value.trim();
      if (loginAdmin(usuario, senha)) {
        status.textContent = 'Login realizado!';
        mostrarPainelAdmin();
      } else {
        status.textContent = 'Usuário ou senha incorretos.';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logoutAdmin();
      alert('Sessão encerrada.');
      window.location.href = 'admin.html';
    });
  }

  function mostrarPainelAdmin() {
    sessionStorage.setItem('adminLogado', 'true');
    if (area) area.style.display = 'block';
    listarAnimais();
    listarUsuarios();
  }

  function listarAnimais() {
    tabelaAnimais.innerHTML = '';
    if (animais.length === 0) {
      tabelaAnimais.innerHTML = '<tr><td colspan="3">Nenhum animal cadastrado.</td></tr>';
      return;
    }
    animais.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.nome}</td>
        <td>${a.raca || '-'}</td>
        <td>
          <button onclick="editarAnimal('${a.id}')">Editar</button>
          <button onclick="excluirAnimal('${a.id}')">Excluir</button>
        </td>`;
      tabelaAnimais.appendChild(tr);
    });
  }

  function listarUsuarios() {
    tabelaUsuarios.innerHTML = '';
    if (usuarios.length === 0) {
      tabelaUsuarios.innerHTML = '<tr><td colspan="2">Nenhum usuário cadastrado.</td></tr>';
      return;
    }
    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.nome} (${u.email})</td>
        <td><button onclick="excluirUsuario('${u.id}')">Excluir</button></td>`;
      tabelaUsuarios.appendChild(tr);
    });
  }

  if (formAnimal) {
    formAnimal.addEventListener('submit', e => {
      e.preventDefault();
      const nome = formAnimal.nome.value.trim();
      const especie = formAnimal.especie.value.trim();
      const raca = formAnimal.raca.value.trim();
      const idade = formAnimal.idade.value.trim();
      if (!nome || !especie || !raca || !idade) return alert('Preencha todos os campos.');
      animais.push({ id: gerarId(), nome, especie, raca, idade, adotado: false });
      salvar('animais', animais);
      formAnimal.reset();
      listarAnimais();
    });
  }

  window.editarAnimal = id => {
    const a = animais.find(x => x.id === id);
    if (!a) return;
    a.nome = prompt('Novo nome:', a.nome) || a.nome;
    a.especie = prompt('Nova espécie:', a.especie) || a.especie;
    a.raca = prompt('Nova raça:', a.raca) || a.raca;
    a.idade = prompt('Nova idade:', a.idade) || a.idade;
    salvar('animais', animais);
    listarAnimais();
  };
  window.excluirAnimal = id => {
    if (!confirm('Excluir este animal?')) return;
    animais = animais.filter(a => a.id !== id);
    salvar('animais', animais);
    listarAnimais();
  };
  window.excluirUsuario = id => {
    if (!confirm('Excluir este usuário?')) return;
    usuarios = usuarios.filter(u => u.id !== id);
    salvar('usuarios', usuarios);
    listarUsuarios();
  };
}

function initRelatoriosPage() {
  if (!isAdminLogado()) {
    alert('Acesso restrito. Faça login como admin.');
    window.location.href = 'admin.html';
    return;
  }

  const tA = document.querySelector('#tabela-rel-animais tbody');
  const tU = document.querySelector('#tabela-rel-usuarios tbody');
  const tD = document.querySelector('#tabela-rel-adocoes tbody');

  tA.innerHTML = '';
  animais.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.nome}</td><td>${a.especie}</td><td>${a.raca || '-'}</td><td>${a.idade}</td><td>${a.adotado ? 'Adotado' : 'Disponível'}</td>`;
    tA.appendChild(tr);
  });

  tU.innerHTML = '';
  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.nome}</td><td>${u.email}</td>`;
    tU.appendChild(tr);
  });

  tD.innerHTML = '';
  if (adocoes.length === 0) {
    tD.innerHTML = '<tr><td colspan="3">Nenhuma adoção registrada.</td></tr>';
  } else {
    adocoes.forEach(d => {
      const a = animais.find(x => x.id === d.animalId);
      const u = usuarios.find(x => x.id === d.usuarioId);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a ? a.nome : '-'}</td><td>${u ? u.nome : '-'}</td><td>${d.data}</td>`;
      tD.appendChild(tr);
    });
  }
}
