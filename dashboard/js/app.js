const API_BASE = 'http://localhost:3001/api';
function getTelegramIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('telegram_id');
}
const USER_ID = getTelegramIdFromUrl();

// --- Navigation dynamique ---
const menuMap = {
  'nav-global': 'stats-tiles',
  'nav-links': 'links-table',
  'nav-campagnes': 'campaigns-table',
  'nav-groups': 'groups-table',
  'nav-parrainage': 'parrainage-section',
  'nav-support': 'support-section',
  'nav-payments': 'payments-table'
};

Object.keys(menuMap).forEach(menuId => {
  document.getElementById(menuId).onclick = () => {
    showSection(menuMap[menuId]);
    switch (menuId) {
      case 'nav-global': loadGlobalStats(); break;
      case 'nav-links': loadUserLinks(); break;
      case 'nav-campagnes': loadUserCampaigns(); break;
      case 'nav-groups': loadUserGroups(); break;
      case 'nav-parrainage': loadParrainage(); break;
      case 'nav-support': loadSupport(); break;
      case 'nav-payments': loadPayments(); break;
    }
  };
});

function showSection(sectionId) {
  ['stats-tiles','links-table','campaigns-table','groups-table','parrainage-section','support-section'].forEach(id => {
    document.getElementById(id).style.display = (id === sectionId) ? 'block' : 'none';
  });
}

// --- Statistiques ---
function loadGlobalStats() {
  fetch(`${API_BASE}/stats/clicks/${USER_ID}`)
    .then(res => res.json())
    .then(stats => {
      document.getElementById('stats-tiles').innerHTML = `
        <div class="tile"><strong>${stats.clicks}</strong><br>Clics sur mes liens</div>
        <div class="tile"><strong>0</strong><br>Campagnes</div>
        <div class="tile"><strong>0</strong><br>Groupes</div>
        <div class="tile"><strong>À venir</strong><br>Stats avancées</div>
      `;
    });
}

// --- Liens affiliés ---
function loadUserLinks() {
  fetch(`${API_BASE}/links/${USER_ID}`)
    .then(res => res.json())
    .then(links => {
      let rows = links.map(link => `
        <tr>
          <td>${link.id}</td>
          <td>${link.url}</td>
          <td>${new Date(link.created_at).toLocaleString()}</td>
          <td>
            <button class="action-btn edit" onclick="editLink(${link.id})">Modifier</button>
            <button class="action-btn delete" onclick="deleteLink(${link.id})">Supprimer</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('links-table').innerHTML = `
        <h2>Mes liens affiliés</h2>
        <button class="action-btn add" onclick="addLink()">Ajouter un lien</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th>Date d'ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div id="link-form"></div>
      `;
    });
}
window.addLink = function() {
  document.getElementById('link-form').innerHTML = `
    <h3>Ajouter un lien affilié</h3>
    <input type="text" id="new-link-url" placeholder="URL du lien">
    <button class="action-btn add" onclick="submitAddLink()">Ajouter</button>
  `;
};
window.submitAddLink = function() {
  const url = document.getElementById('new-link-url').value;
  fetch(`${API_BASE}/links`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ user_id: USER_ID, url })
  }).then(() => loadUserLinks());
  document.getElementById('link-form').innerHTML = '';
};
window.editLink = function(id) {
  // À compléter : afficher le formulaire de modification
};
window.deleteLink = function(id) {
  // À compléter : appel API pour supprimer le lien
};

// --- Campagnes ---
function loadUserCampaigns() {
  fetch(`${API_BASE}/campaigns?user_id=${USER_ID}`)
    .then(res => res.json())
    .then(camps => {
      let rows = camps.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.name}</td>
          <td>${c.status}</td>
          <td>${new Date(c.created_at).toLocaleString()}</td>
          <td>
            <button class="action-btn edit" onclick="editCampaign(${c.id})">Modifier</button>
            <button class="action-btn delete" onclick="deleteCampaign(${c.id})">Supprimer</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('campaigns-table').innerHTML = `
        <h2>Mes campagnes</h2>
        <button class="action-btn add" onclick="addCampaign()">Créer une campagne</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Status</th>
              <th>Date création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div id="campaign-form"></div>
      `;
    });
}
window.addCampaign = function() {
  document.getElementById('campaign-form').innerHTML = `
    <h3>Créer une campagne</h3>
    <input type="text" placeholder="Nom de la campagne">
    <select>
      <option value="active">Active</option>
      <option value="paused">En pause</option>
      <option value="finished">Terminée</option>
    </select>
    <button class="action-btn add">Créer</button>
  `;
};
window.editCampaign = function(id) {
  // À compléter : afficher le formulaire de modification
};
window.deleteCampaign = function(id) {
  // À compléter : appel API pour supprimer la campagne
};

// --- Groupes affiliés ---
function loadUserGroups() {
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
      document.getElementById('groups-table').innerHTML = `
        <h2>Mes groupes/canaux</h2>
        <button class="action-btn add" onclick="addGroup()">Ajouter un groupe/canal</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom/Lien</th>
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
    <h3>Ajouter un groupe/canal</h3>
    <input type="text" placeholder="Nom ou lien du groupe/canal">
    <input type="text" placeholder="Catégorie">
    <button class="action-btn add">Ajouter</button>
  `;
};
window.editGroup = function(id) {
  // À compléter : afficher le formulaire de modification
};
window.deleteGroup = function(id) {
  // À compléter : appel API pour supprimer le groupe
};

// --- Parrainage ---
function loadParrainage() {
  fetch(`${API_BASE}/referrals/${USER_ID}`)
    .then(res => res.json())
    .then(refs => {
      document.getElementById('parrainage-section').innerHTML = `
        <h2>Parrainage</h2>
        <p>Ton lien de parrainage : <b>https://t.me/PubliciteUniverselleBot?start=${USER_ID}</b></p>
        <p>Nombre de filleuls : <span>${refs.length}</span></p>
        <p>Gains : <span>0</span> FCFA</p>
        <button class="action-btn add">Inviter un ami</button>
      `;
    });
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

// --- Paiements ---
function loadPayments() {
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
      document.getElementById('payments-table').innerHTML = `
        <h2>Mes paiements</h2>
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

// --- Infos utilisateur ---
function loadUserInfo() {
  fetch(`${API_BASE}/users/${USER_ID}`)
    .then(res => res.json())
    .then(user => {
      document.getElementById('username').textContent = user.username || 'Utilisateur';
      document.getElementById('role').textContent = user.forfait || 'Basic';
    });
}
document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  ['stats-tiles','links-table','campaigns-table','groups-table','parrainage-section','support-section'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  showSection('stats-tiles');
});