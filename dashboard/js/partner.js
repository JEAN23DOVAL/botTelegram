const API_BASE = 'http://localhost:3001/api';
const USER_ID = getTelegramIdFromUrl(); // À remplacer par l'id du partenaire connecté

function getTelegramIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('telegram_id');
}

const menuMap = {
  'nav-stats': 'stats-section',
  'nav-gains': 'gains-section',
  'nav-thematiques': 'thematiques-section',
  'nav-groupes': 'groupes-section',
  'nav-notifs': 'notifs-section',
  'nav-support': 'support-section'
};

Object.keys(menuMap).forEach(menuId => {
  document.getElementById(menuId).onclick = () => {
    showSection(menuMap[menuId]);
    switch (menuId) {
      case 'nav-stats': loadStats(); break;
      case 'nav-gains': loadPaymentsPartner(); break;
      case 'nav-thematiques': loadThematiques(); break;
      case 'nav-groupes': loadGroupes(); break;
      case 'nav-notifs': loadNotifs(); break;
      case 'nav-support': loadSupport(); break;
    }
  };
});

function showSection(sectionId) {
  ['stats-section','gains-section','thematiques-section','groupes-section','notifs-section','support-section'].forEach(id => {
    document.getElementById(id).style.display = (id === sectionId) ? 'block' : 'none';
  });
}

// --- Stats Groupe ---
function loadStats() {
  fetch(`${API_BASE}/groups/${USER_ID}`)
    .then(res => res.json())
    .then(groups => {
      let rows = groups.map(g => `
        <tr>
          <td>${g.group_name}</td>
          <td>${g.category || ''}</td>
          <td>À venir</td>
          <td>À venir</td>
        </tr>
      `).join('');
      document.getElementById('stats-section').innerHTML = `
        <h2>Stats Groupe</h2>
        <table>
          <thead>
            <tr>
              <th>Nom du groupe</th>
              <th>Catégorie</th>
              <th>Impressions</th>
              <th>Clics</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    });
}

// --- Gains ---
function loadPaymentsPartner() {
  fetch(`${API_BASE}/payments/${USER_ID}`)
    .then(res => res.json())
    .then(payments => {
      let rows = payments.map(p => `
        <tr>
          <td>${p.forfait}</td>
          <td>${p.amount} FCFA</td>
          <td>${p.payment_status}</td>
          <td>${new Date(p.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
      document.getElementById('gains-section').innerHTML = `
        <h2>Mes Paiements</h2>
        <table>
          <thead>
            <tr>
              <th>Forfait</th>
              <th>Montant</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    });
}

// --- Thématiques ---
function loadThematiques() {
  document.getElementById('thematiques-section').innerHTML = `
    <h2>Thématiques</h2>
    <p>Accepter/refuser les thématiques pour la diffusion dans votre groupe.</p>
    <button class="action-btn" onclick="acceptTheme('Paris sportif')">Accepter Paris sportif</button>
    <button class="action-btn delete" onclick="refuseTheme('Jeux d\'argent')">Refuser Jeux d'argent</button>
  `;
}
window.acceptTheme = function(theme) { alert('Thématique acceptée : ' + theme); };
window.refuseTheme = function(theme) { alert('Thématique refusée : ' + theme); };

// --- Gestion Groupe ---
function loadGroupes() {
  fetch(`${API_BASE}/groups/${USER_ID}`)
    .then(res => res.json())
    .then(groups => {
      let rows = groups.map(g => `
        <tr>
          <td>${g.id}</td>
          <td>${g.group_name}</td>
          <td>${g.category || ''}</td>
          <td>${g.is_admin ? '✅ Oui' : '❌ Non'}</td>
          <td>${new Date(g.created_at).toLocaleString()}</td>
          <td>
            <button class="action-btn edit" onclick="editGroup(${g.id})">Modifier</button>
            <button class="action-btn delete" onclick="deleteGroup(${g.id})">Supprimer</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('groupes-section').innerHTML = `
        <h2>Gestion Groupe</h2>
        <button class="action-btn add" onclick="addGroup()">Ajouter un groupe</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom du groupe</th>
              <th>Catégorie</th>
              <th>Bot admin</th>
              <th>Date création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div id="group-form"></div>
      `;
    });
}

window.addGroup = function() {
  document.getElementById('group-form').innerHTML = `
    <h3>Ajouter un groupe</h3>
    <input type="text" id="new-group-name" placeholder="Nom du groupe">
    <input type="text" id="new-group-cat" placeholder="Catégorie">
    <button class="action-btn add" onclick="submitAddGroup()">Ajouter</button>
  `;
};
window.submitAddGroup = function() {
  const name = document.getElementById('new-group-name').value;
  const cat = document.getElementById('new-group-cat').value;
  fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ user_id: USER_ID, group_name: name, category: cat })
  }).then(() => loadGroupes());
  document.getElementById('group-form').innerHTML = '';
};
window.editGroup = function(id) {
  // À compléter : afficher le formulaire de modification
};
window.deleteGroup = function(id) {
  fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' })
    .then(() => loadGroupes());
};

// --- Notifications ---
function loadNotifs() {
  document.getElementById('notifs-section').innerHTML = `
    <h2>Notifications</h2>
    <p>Aucune notification pour le moment.</p>
  `;
}

// --- Support ---
function loadSupport() {
  document.getElementById('support-section').innerHTML = `
    <h2>Support</h2>
    <p>Besoin d'aide ? Consulte la FAQ ou contacte l'équipe technique.</p>
    <button class="action-btn add">Voir la FAQ</button>
    <button class="action-btn edit">Contacter le support</button>
  `;
}

// --- Infos Utilisateur ---
function loadUserInfo() {
  fetch(`${API_BASE}/users/${USER_ID}`)
    .then(res => res.json())
    .then(user => {
      document.getElementById('username').textContent = user.username || 'Utilisateur';
      document.getElementById('role').textContent = user.forfait || 'Basic';
    });
}

// --- Initialisation : tout masquer sauf stats groupe ---
document.addEventListener('DOMContentLoaded', () => {
  ['stats-section','gains-section','thematiques-section','groupes-section','notifs-section','support-section'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  showSection('stats-section');
  loadStats();
  loadUserInfo();
});