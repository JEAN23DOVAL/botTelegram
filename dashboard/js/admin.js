const API_BASE = 'http://localhost:3001/api';

// --- Connexion admin sécurisée avec vérification du rôle ---
document.getElementById('login-btn').onclick = () => {
  const telegram_id = document.getElementById('telegram_id').value.trim();
  if (!telegram_id) {
    document.getElementById('login-error').textContent = "L'ID Telegram est obligatoire.";
    return;
  }
  fetch(`${API_BASE}/users`)
    .then(res => res.json())
    .then(users => {
      const admin = users.find(u => u.telegram_id == telegram_id && u.role === 'admin');
      if (!admin) {
        document.getElementById('login-error').textContent = "Accès refusé : vous n'êtes pas admin.";
        return;
      }
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      document.getElementById('admin-id').textContent = "ID Telegram : " + telegram_id;
      showSection('stats-tiles');
      loadGlobalStats();
    })
    .catch(() => {
      document.getElementById('login-error').textContent = "Erreur de connexion à l'API.";
    });
};

// --- Navigation dynamique ---
const menuMap = {
  'nav-global': 'stats-tiles',
  'nav-users': 'users-table',
  'nav-campagnes': 'campaigns-table',
  'nav-groups': 'groups-table',
  'nav-links': 'links-table',
  'nav-parrainage': 'parrainage-section',
  'nav-support': 'support-section',
  'nav-payments': 'payments-table',
  'nav-campaign-logs': 'campaign-logs-table',
  'nav-templates': 'templates-table'
};

Object.keys(menuMap).forEach(menuId => {
  document.getElementById(menuId).onclick = () => {
    showSection(menuMap[menuId]);
    switch (menuId) {
      case 'nav-global': loadGlobalStats(); break;
      case 'nav-users': loadUsers(); break;
      case 'nav-campagnes': loadCampaigns(); break;
      case 'nav-groups': loadGroups(); break;
      case 'nav-links': loadLinks(); break;
      case 'nav-parrainage': loadParrainage(); break;
      case 'nav-support': loadSupport(); break;
      case 'nav-payments': loadPaymentsAdmin(); break;
      case 'nav-campaign-logs': loadCampaignLogs(); break;
      case 'nav-templates': loadTemplates(); break;
    }
  };
});

// --- Affiche uniquement la section demandée ---
function showSection(sectionId) {
  ['stats-tiles','users-table','campaigns-table','groups-table','links-table','parrainage-section','support-section'].forEach(id => {
    document.getElementById(id).style.display = (id === sectionId) ? 'block' : 'none';
  });
}

// --- Stats globales ---
function loadGlobalStats() {
  fetch(`${API_BASE}/stats/global`)
    .then(res => res.json())
    .then(stats => {
      document.getElementById('stats-tiles').innerHTML = `
        <div class="tile"><strong>${stats.total_users}</strong><br>Utilisateurs</div>
        <div class="tile"><strong>${stats.total_links}</strong><br>Liens affiliés</div>
        <div class="tile"><strong>${stats.total_clicks}</strong><br>Clics trackés</div>
        <div class="tile"><strong>À venir</strong><br>Campagnes</div>
        <div class="tile"><strong>À venir</strong><br>Groupes/Canaux</div>
        <div class="tile"><strong>À venir</strong><br>Stats avancées</div>
      `;
    });
}

// --- Utilisateurs ---
function loadUsers() {
  fetch(`${API_BASE}/users`)
    .then(res => res.json())
    .then(users => {
      let rows = users.map(u => `
        <tr>
          <td>${u.id}</td>
          <td>${u.telegram_id}</td>
          <td>${u.username}</td>
          <td>${u.role}</td>
          <td>${u.forfait}</td>
          <td>${u.business || ''}</td>
          <td>${u.pays || ''}</td>
          <td>
            <button class="action-btn edit" onclick="editUser(${u.id})">Modifier</button>
            <button class="action-btn delete" onclick="confirmDeleteUser(${u.id})">Supprimer</button>
            <button class="action-btn" onclick="confirmDisableUser(${u.id})">Désactiver</button>
            <button class="action-btn" onclick="enableUser(${u.id})">Réactiver</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('users-table').innerHTML = `
        <h2>Utilisateurs</h2>
        <button class="action-btn add" onclick="addUser()">Ajouter un utilisateur</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Telegram ID</th>
              <th>Nom d'utilisateur</th>
              <th>Rôle</th>
              <th>Forfait</th>
              <th>Business</th>
              <th>Pays</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div id="user-form"></div>
      `;
    });
}
window.addUser = function() {
  document.getElementById('user-form').innerHTML = `
    <h3>Ajouter un utilisateur</h3>
    <input type="text" placeholder="ID Telegram">
    <input type="text" placeholder="Nom d'utilisateur">
    <select>
      <option value="partner">Partenaire</option>
      <option value="admin">Admin</option>
    </select>
    <select>
      <option value="Basic">Basic</option>
      <option value="Pro">Pro</option>
      <option value="VIP">VIP</option>
    </select>
    <input type="text" placeholder="Business">
    <input type="text" placeholder="Pays">
    <button class="action-btn add">Ajouter</button>
  `;
};

// --- Campagnes ---
function loadCampaigns() {
  fetch(`${API_BASE}/campaigns`)
    .then(res => res.json())
    .then(camps => {
      let rows = camps.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.name}</td>
          <td>${c.user_id}</td>
          <td>${c.status}</td>
          <td>${c.frequency}h</td>
          <td>${new Date(c.created_at).toLocaleString()}</td>
          <td>
            <button class="action-btn edit" onclick="editCampaign(${c.id})">Modifier</button>
            <button class="action-btn delete" onclick="confirmDeleteCampaign(${c.id})">Supprimer</button>
            <button class="action-btn" onclick="confirmDisableCampaign(${c.id})">Désactiver</button>
            <button class="action-btn" onclick="enableCampaign(${c.id})">Réactiver</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('campaigns-table').innerHTML = `
        <h2>Campagnes</h2>
        <button class="action-btn add" onclick="addCampaign()">Ajouter une campagne</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Fréquence</th>
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
    <h3>Ajouter une campagne</h3>
    <input type="text" placeholder="Nom de la campagne">
    <input type="number" placeholder="User ID">
    <input type="number" placeholder="Fréquence (heures)">
    <select>
      <option value="active">Active</option>
      <option value="paused">En pause</option>
      <option value="finished">Terminée</option>
    </select>
    <button class="action-btn add">Ajouter</button>
  `;
};

// --- Groupes/Canaux ---
function loadGroups() {
  fetch(`${API_BASE}/groups`)
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
            <button class="action-btn delete" onclick="confirmDeleteGroup(${g.id})">Supprimer</button>
            <button class="action-btn" onclick="confirmDisableGroup(${g.id})">Désactiver</button>
            <button class="action-btn" onclick="enableGroup(${g.id})">Réactiver</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('groups-table').innerHTML = `
        <h2>Groupes/Canaux</h2>
        <button class="action-btn add" onclick="addGroup()">Ajouter un groupe/canal</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom/Lien</th>
              <th>Catégorie</th>
              <th>Admin Bot</th>
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
    <input type="number" placeholder="User ID">
    <button class="action-btn add">Ajouter</button>
  `;
  // ...dans la fonction d'ajout de groupe pour un partenaire...
  fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      user_id: PARTNER_ID,
      group_name: name,
      category: cat,
      is_owner: false // Groupe tiers ajouté par l'admin/partenaire
    })
  })
};

// --- Liens affiliés ---
function loadLinks() {
  fetch(`${API_BASE}/links`)
    .then(res => res.json())
    .then(links => {
      let rows = links.map(l => `
        <tr>
          <td>${l.id}</td>
          <td>${l.user_id}</td>
          <td>${l.url}</td>
          <td>${l.type || ''}</td>
          <td>${new Date(l.created_at).toLocaleString()}</td>
          <td>
            <button class="action-btn edit" onclick="editLink(${l.id})">Modifier</button>
            <button class="action-btn delete" onclick="deleteLink(${l.id})">Supprimer</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('links-table').innerHTML = `
        <h2>Liens affiliés</h2>
        <button class="action-btn add" onclick="addLink()">Ajouter un lien</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>URL</th>
              <th>Type</th>
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
    <input type="number" placeholder="User ID">
    <input type="text" placeholder="URL du lien">
    <input type="text" placeholder="Type (affilié, site web...)">
    <button class="action-btn add">Ajouter</button>
  `;
};

// --- Parrainage ---
function loadParrainage() {
  fetch(`${API_BASE}/referrals/1`) // Remplace 1 par l'ID admin ou utilisateur
    .then(res => res.json())
    .then(refs => {
      document.getElementById('parrainage-section').innerHTML = `
        <h2>Parrainage</h2>
        <p>Ton lien de parrainage : <b>https://t.me/PubliciteUniverselleBot?start=1</b></p>
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

// --- Paiements (admin) ---
function loadPaymentsAdmin() {
  fetch(`${API_BASE}/payments`)
    .then(res => res.json())
    .then(payments => {
      let rows = payments.map(p => `
        <tr>
          <td>${p.username || ''}</td>
          <td>${p.telegram_id}</td>
          <td>${p.forfait}</td>
          <td>${p.amount} FCFA</td>
          <td>${p.payment_status}</td>
          <td>${p.payment_method || ''}</td>
          <td>${new Date(p.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
      document.getElementById('payments-table').innerHTML = `
        <h2>Paiements (tous utilisateurs)</h2>
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Telegram ID</th>
              <th>Forfait</th>
              <th>Montant</th>
              <th>Status</th>
              <th>Méthode</th>
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

// --- Historique des actions admin ---
function loadAdminLogs() {
  fetch(`${API_BASE}/users/admin/logs`)
    .then(res => res.json())
    .then(logs => {
      let rows = logs.map(log => `
        <tr>
          <td>${log.admin_name || log.admin_id}</td>
          <td>${log.action}</td>
          <td>${log.target_user_id}</td>
          <td>${log.details}</td>
          <td>${new Date(log.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
      document.getElementById('admin-logs-table').innerHTML = `
        <h2>Historique des actions admin</h2>
        <table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Cible</th>
              <th>Détails</th>
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

// --- Historique des actions sur les groupes ---
function loadGroupLogs() {
  fetch(`${API_BASE}/groups/logs`)
    .then(res => res.json())
    .then(logs => {
      let rows = logs.map(log => `
        <tr>
          <td>${log.admin_name || log.admin_id}</td>
          <td>${log.group_id}</td>
          <td>${log.action}</td>
          <td>${log.details}</td>
          <td>${new Date(log.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
      document.getElementById('group-logs-table').innerHTML = `
        <h2>Historique des actions sur les groupes</h2>
        <table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Groupe</th>
              <th>Action</th>
              <th>Détails</th>
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

// --- Historique des actions sur les campagnes ---
function loadCampaignLogs() {
  fetch(`${API_BASE}/campaigns/logs`)
    .then(res => res.json())
    .then(logs => {
      let rows = logs.map(log => `
        <tr>
          <td>${log.admin_name || log.admin_id}</td>
          <td>${log.campaign_id}</td>
          <td>${log.action}</td>
          <td>${log.details}</td>
          <td>${new Date(log.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
      document.getElementById('campaign-logs-table').innerHTML = `
        <h2>Historique des actions sur les campagnes</h2>
        <table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Campagne</th>
              <th>Action</th>
              <th>Détails</th>
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

// --- Modèles de messages ---
function loadTemplates() {
  fetch(`${API_BASE}/templates`)
    .then(res => res.json())
    .then(templates => {
      let rows = templates.map(t => `
        <tr>
          <td>${t.id}</td>
          <td>${t.label}</td>
          <td>${t.content}</td>
          <td>
            <button class="action-btn edit" onclick="editTemplate(${t.id})">Modifier</button>
            <button class="action-btn delete" onclick="deleteTemplate(${t.id})">Supprimer</button>
          </td>
        </tr>
      `).join('');
      document.getElementById('templates-table').innerHTML = `
        <h2>Modèles de messages</h2>
        <button class="action-btn add" onclick="addTemplate()">Ajouter un modèle</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Label</th>
              <th>Contenu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div id="template-form"></div>
      `;
    });
}
window.addTemplate = function() {
  document.getElementById('template-form').innerHTML = `
    <h3>Ajouter un modèle</h3>
    <input type="text" id="new-template-label" placeholder="Label">
    <textarea id="new-template-content" placeholder="Contenu"></textarea>
    <button class="action-btn add" onclick="submitAddTemplate()">Ajouter</button>
  `;
};
window.submitAddTemplate = function() {
  const label = document.getElementById('new-template-label').value;
  const content = document.getElementById('new-template-content').value;
  fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ label, content })
  }).then(() => {
    loadTemplates();
    document.getElementById('template-form').innerHTML = '';
  });
};
window.editTemplate = function(id) {
  fetch(`${API_BASE}/templates`)
    .then(res => res.json())
    .then(templates => {
      const t = templates.find(t => t.id === id);
      if (!t) return;
      document.getElementById('template-form').innerHTML = `
        <h3>Modifier le modèle</h3>
        <input type="text" id="edit-template-label" value="${t.label}">
        <textarea id="edit-template-content">${t.content}</textarea>
        <button class="action-btn add" onclick="submitEditTemplate(${id})">Enregistrer</button>
      `;
    });
};
window.submitEditTemplate = function(id) {
  const label = document.getElementById('edit-template-label').value;
  const content = document.getElementById('edit-template-content').value;
};
window.submitEditTemplate = function(id) {
  const label = document.getElementById('edit-template-label').value;
    body: JSON.stringify({ label, content })
  }).then(() => {
    loadTemplates();
    document.getElementById('template-form').innerHTML = '';
  });
};
window.deleteTemplate = function(id) {
  if (confirm("Supprimer ce modèle ?")) {
    fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' })
      .then(() => loadTemplates());
  }
};

// --- Initialisation : tout masquer sauf stats globales ---
document.addEventListener('DOMContentLoaded', () => {
  ['stats-tiles','users-table','campaigns-table','groups-table','links-table','parrainage-section','support-section'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
});

window.editUser = function(id) {
  fetch(`${API_BASE}/users`)
    .then(res => res.json())
    .then(users => {
      const user = users.find(u => u.id === id);
      if (!user) return;
      document.getElementById('user-form').innerHTML = `
        <h3>Modifier l'utilisateur</h3>
        <label>Nom d'utilisateur : <input type="text" id="edit-username" value="${user.username || ''}"></label><br>
        <label>Rôle :
          <select id="edit-role">
            <option value="client" ${user.role === 'client' ? 'selected' : ''}>Client</option>
            <option value="partner" ${user.role === 'partner' ? 'selected' : ''}>Partenaire</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </label><br>
        <label>Forfait :
          <select id="edit-forfait">
            <option value="Basic" ${user.forfait === 'Basic' ? 'selected' : ''}>Basic</option>
            <option value="Pro" ${user.forfait === 'Pro' ? 'selected' : ''}>Pro</option>
            <option value="VIP" ${user.forfait === 'VIP' ? 'selected' : ''}>VIP</option>
          </select>
        </label><br>
        <button class="action-btn add" onclick="submitEditUser(${id})">Enregistrer</button>
      `;
    });
};

window.submitEditUser = function(id) {
  const role = document.getElementById('edit-role').value;
  const forfait = document.getElementById('edit-forfait').value;
  fetch(`${API_BASE}/users/${id}/role-forfait`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ role, forfait })
  })
    .then(res => res.json())
    .then(() => {
      loadUsers();
      document.getElementById('user-form').innerHTML = '';
    });
};

window.confirmDeleteUser = function(id) {
  if (confirm("Confirmer la suppression de cet utilisateur ?")) {
    const admin_id = document.getElementById('telegram_id').value.trim();
    fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ admin_id })
    })
      .then(res => res.json())
      .then(() => loadUsers());
  }
};

window.confirmDisableUser = function(id) {
  if (confirm("Confirmer la désactivation de cet utilisateur ?")) {
    const admin_id = document.getElementById('telegram_id').value.trim();
    fetch(`${API_BASE}/users/${id}/disable`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ admin_id })
    })
      .then(res => res.json())
      .then(() => loadUsers());
  }
};

window.enableUser = function(id) {
  const admin_id = document.getElementById('telegram_id').value.trim();
  fetch(`${API_BASE}/users/${id}/enable`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ admin_id, previous_role: 'client' }) // ou 'partner' selon le cas
  })
    .then(res => res.json())
    .then(() => loadUsers());
};

window.confirmDeleteCampaign = function(id) {
  if (confirm("Confirmer la suppression de cette campagne ?")) {
    const admin_id = document.getElementById('telegram_id').value.trim();
    fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ admin_id })
    })
      .then(res => res.json())
      .then(() => loadCampaigns());
  }
};

window.confirmDisableCampaign = function(id) {
  if (confirm("Confirmer la désactivation de cette campagne ?")) {
    const admin_id = document.getElementById('telegram_id').value.trim();
    fetch(`${API_BASE}/campaigns/${id}/disable`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ admin_id })
    })
      .then(res => res.json())
      .then(() => loadCampaigns());
  }
};

window.enableCampaign = function(id) {
  const admin_id = document.getElementById('telegram_id').value.trim();
  fetch(`${API_BASE}/campaigns/${id}/enable`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ admin_id })
  })
    .then(res => res.json())
    .then(() => loadCampaigns());
};