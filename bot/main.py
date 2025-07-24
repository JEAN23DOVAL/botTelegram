from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
import requests
import os
from dotenv import load_dotenv
import asyncio
import datetime

load_dotenv()
TOKEN = os.getenv("TELEGRAM_TOKEN")
if not TOKEN:
    raise Exception("Le token Telegram n'est pas défini dans .env")

(
    MENU,
    CREER_CAMPAGNE,
    CHOIX_BUSINESS,
    AJOUT_LIENS,
    AJOUT_MEDIA,
    AJOUT_CIBLAGE,
    AJOUT_GROUPE,
    CHOIX_FORFAIT,
    CONFIRMATION,
    ABONNEMENT
) = range(10)

API_BASE = "http://localhost:3001/api"

FORFAIT_RULES = {
    "Basic":   {"max_tiers": 3,  "frequency": 60,  "stats_pro": False},  # 60 min
    "Pro":     {"max_tiers": 10, "frequency": 30,  "stats_pro": True},   # 30 min
    "VIP":     {"max_tiers": 50, "frequency": 10,  "stats_pro": True},   # 10 min
    "admin":   {"max_tiers": 9999, "frequency": 1, "stats_pro": True},
    "partner": {"max_tiers": 10, "frequency": 30, "stats_pro": True}
}

def compose_message(admin_template, client_message):
    return f"{admin_template}\n\n{client_message}"

async def diffusion_automatique(application):
    while True:
        try:
            r = requests.get(f"{API_BASE}/campaigns")
            campagnes = r.json() if r.ok else []
            for campagne in campagnes:
                if campagne.get("status") != "active":
                    continue
                user_id = campagne["user_id"]
                r_user = requests.get(f"{API_BASE}/users/{user_id}")
                user = r_user.json() if r_user.ok else {}
                forfait = user.get("forfait", "Basic")
                role = user.get("role", "client")
                rules = FORFAIT_RULES.get(forfait, FORFAIT_RULES["Basic"])
                r_groups = requests.get(f"{API_BASE}/campaigns/{campagne['id']}/groups")
                groupes = r_groups.json() if r_groups.ok else []
                groupes_propres = [g for g in groupes if g.get("is_owner")]
                groupes_tiers = [g for g in groupes if not g.get("is_owner")][:rules["max_tiers"]]
                # Groupes propres : pas de limite de fréquence
                for group in groupes_propres:
                    await send_if_due(application, campagne, group, unlimited=True)
                # Groupes tiers : respecter la fréquence
                for group in groupes_tiers:
                    await send_if_due(application, campagne, group, freq_min=rules["frequency"])
        except Exception as e:
            print("Erreur diffusion automatique:", e)
        await asyncio.sleep(60)  # Vérifie toutes les minutes

async def check_and_update_admin_status(application, group):
    try:
        chat_member = await application.bot.get_chat_member(group["group_name"], application.bot.id)
        is_admin = chat_member.status in ["administrator", "creator"]
        # Met à jour la base via l'API
        requests.put(
            f"{API_BASE}/groups/admin-status/{group['id']}",
            json={"is_admin": is_admin}
        )
        return is_admin
    except Exception as e:
        print(f"Erreur vérification admin dans {group['group_name']}: {e}")
        return False

async def send_if_due(application, campagne, group, freq_min=None, unlimited=False):
    try:
        # Vérifie si le bot est admin dans le groupe
        if not group.get("is_admin"):
            is_admin = await check_and_update_admin_status(application, group)
            if not is_admin:
                print(f"Bot non admin dans {group['group_name']}, diffusion ignorée.")
                return
        # ... (reste de la logique inchangée)
        r = requests.get(f"{API_BASE}/diffusions?campaign_id={campagne['id']}&group_id={group['id']}")
        last = r.json()[0] if r.ok and r.json() else None
        now = datetime.datetime.utcnow()
        can_send = unlimited
        if not unlimited and last and last.get("last_sent_at"):
            last_sent = datetime.datetime.strptime(last["last_sent_at"], "%Y-%m-%dT%H:%M:%S")
            can_send = (now - last_sent).total_seconds() >= freq_min * 60
        elif not last:
            can_send = True
        if can_send:
            admin_template = "🔥 Découvrez cette offre exclusive !"
            client_message = campagne.get("message", "")
            message = f"{admin_template}\n\n{client_message}"
            try:
                await application.bot.send_message(chat_id=group["group_name"], text=message)
                requests.post(f"{API_BASE}/diffusions", json={
                    "campaign_id": campagne["id"],
                    "group_id": group["id"],
                    "last_sent_at": now.isoformat()
                })
                print(f"Message envoyé dans {group['group_name']} pour campagne {campagne['id']}")
                await asyncio.sleep(1)  # Respect Telegram
            except Exception as e:
                print(f"Erreur envoi dans {group['group_name']}: {e}")
    except Exception as e:
        print("Erreur send_if_due:", e)

def inscrire_ou_mettre_a_jour_utilisateur(telegram_id, username):
    payload = {
        "telegram_id": str(telegram_id),
        "username": username,
        "role": "client",  # ou "partner" selon le contexte
        "forfait": "Basic"
    }
    try:
        r = requests.post(f"{API_BASE}/users/upsert", json=payload, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API:", e)
        return None

def mettre_a_jour_forfait(telegram_id, forfait):
    try:
        r = requests.put(
            f"{API_BASE}/users/forfait/{telegram_id}",
            json={"forfait": forfait},
            timeout=5
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (forfait):", e)
        return None

def creer_campagne_api(user_id, nom, message, image_id, frequency, status):
    payload = {
        "user_id": user_id,
        "name": nom,
        "message": message,
        "image_id": image_id,
        "frequency": frequency,
        "status": status
    }
    try:
        r = requests.post(f"{API_BASE}/campaigns", json=payload, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (campagne):", e)
        return None

def ajouter_lien_affilie(user_id, url, type="affilié"):
    payload = {"user_id": user_id, "url": url, "type": type}
    try:
        r = requests.post(f"{API_BASE}/links", json=payload, timeout=5)
        r.raise_for_status()
        return r.json()["id"]
    except Exception as e:
        print("Erreur API (lien):", e)
        return None

def lier_liens_a_campagne(campaign_id, link_ids):
    try:
        r = requests.post(
            f"{API_BASE}/campaigns/{campaign_id}/links",
            json={"link_ids": link_ids},
            timeout=5
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (liaison liens):", e)
        return None

def ajouter_groupe(user_id, group_name, category=None):
    payload = {
        "user_id": user_id,
        "group_name": group_name,
        "category": category,
        "is_owner": True  # Toujours True depuis le bot pour un client
    }
    try:
        r = requests.post(f"{API_BASE}/groups", json=payload, timeout=5)
        r.raise_for_status()
        return r.json()["id"]
    except Exception as e:
        print("Erreur API (groupe):", e)
        return None

def lier_groupes_a_campagne(campaign_id, group_ids):
    try:
        r = requests.post(
            f"{API_BASE}/campaigns/{campaign_id}/groups",
            json={"group_ids": group_ids},
            timeout=5
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (liaison groupes):", e)
        return None

def get_user_stats(user_id):
    try:
        r = requests.get(f"{API_BASE}/stats/clicks/{user_id}", timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (stats):", e)
        return None

def get_parrainage(telegram_id):
    try:
        r = requests.get(f"{API_BASE}/referrals/{telegram_id}", timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (parrainage):", e)
        return None

# 1. Menu principal
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    username = update.effective_user.username or update.effective_user.first_name
    # Inscription ou mise à jour API
    user = inscrire_ou_mettre_a_jour_utilisateur(telegram_id, username)
    if user:
        print("Utilisateur inscrit/mis à jour:", user)
    else:
        print("Erreur lors de l'inscription")
    keyboard = [
        ["🔗 Créer une publicité", "💳 Choisir un forfait"],
        ["📊 Voir mes statistiques", "🤝 Parrainer un ami"],
        ["❓ Support"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    await update.message.reply_text(
        f"🎉 *Bienvenue {update.effective_user.first_name} !*\n\n"
        "Que souhaitez-vous faire ?\n"
        "Sélectionnez une option ci-dessous 👇",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )
    return MENU

# 2. Gestion du menu principal
async def menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if text == "🔗 Créer une publicité":
        keyboard = [
            ["Paris sportif", "Musique"],
            ["Crypto", "Entrepreneuriat"],
            ["Autre"]
        ]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        await update.message.reply_text(
            "📌 *Création de campagne*\n\n"
            "Choisis le type de business pour ta publicité 👇",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
        return CHOIX_BUSINESS
    elif text == "💳 Choisir un forfait":
        keyboard = [
            ["Basic", "Pro", "VIP"],
            ["🏠 Menu principal"]
        ]
        reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
        await update.message.reply_text(
            "💳 *Choisis ton forfait d'abonnement*\n\n"
            "Basic : accès limité\nPro : accès avancé\nVIP : tout illimité\n\n"
            "Sélectionne ci-dessous 👇",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
        return ABONNEMENT
    elif text == "📊 Voir mes statistiques":
        return await stats_handler(update, context)
    elif text == "🤝 Parrainer un ami":
        return await parrainage_handler(update, context)
    elif text == "❓ Support":
        return await support_handler(update, context)
    elif text == "🏠 Menu principal":
        return await start(update, context)
    elif text == "🌐 Mon espace web":
        return await dashboard_handler(update, context)
    else:
        await update.message.reply_text(
            "❗️ Merci de choisir une option via les boutons ci-dessous.",
            parse_mode="Markdown"
        )
        return MENU

# 3. Gestion du forfait (abonnement)
def initier_paiement_cinetpay(telegram_id, forfait):
    try:
        r = requests.post(
            f"{API_BASE}/payments/init",
            json={"telegram_id": telegram_id, "forfait": forfait},
            timeout=10
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print("Erreur API (paiement):", e)
        return None

async def abonnement_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    forfait = update.message.text
    if forfait == "🏠 Menu principal":
        return await start(update, context)
    if forfait not in ["Basic", "Pro", "VIP"]:
        await update.message.reply_text("❗️ Choisis un forfait valide via les boutons.")
        return ABONNEMENT
    telegram_id = update.effective_user.id
    if forfait == "Basic":
        result = mettre_a_jour_forfait(telegram_id, forfait)
        if result:
            await update.message.reply_text(
                f"✅ *Tu es maintenant abonné au forfait {forfait} !*",
                reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"], ["🔗 Créer une publicité"]], resize_keyboard=True),
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(
                "❗️ Une erreur est survenue lors de la mise à jour du forfait.",
                reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
                parse_mode="Markdown"
            )
        return MENU
    # Pour Pro ou VIP, initier le paiement
    paiement = initier_paiement_cinetpay(telegram_id, forfait)
    if paiement and paiement.get("url"):
        await update.message.reply_text(
            f"💳 *Paiement du forfait {forfait}*\n\n"
            f"Montant : {5000 if forfait == 'Pro' else 10000} FCFA\n"
            f"Merci de cliquer sur le lien ci-dessous pour payer via CinetPay :\n{paiement['url']}\n\n"
            "Après paiement, ton forfait sera activé automatiquement.",
            reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            "❗️ Impossible d'initier le paiement. Réessaie plus tard.",
            reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
    return MENU

# 4. Création de campagne : choix du business
async def choix_business(update: Update, context: ContextTypes.DEFAULT_TYPE):
    business = update.message.text
    if business not in ["Paris sportif", "Musique", "Crypto", "Entrepreneuriat", "Autre"]:
        await update.message.reply_text("❗️ Choisis un business valide via les boutons.")
        return CHOIX_BUSINESS
    context.user_data['business'] = business
    await update.message.reply_text(
        f"👍 *Business sélectionné :* {business}\n\n"
        "Envoie le nom de ta campagne (obligatoire, ex: Promo 1xBet Cameroun).",
        parse_mode="Markdown"
    )
    return CREER_CAMPAGNE

# 5. Création de campagne : nom
async def creer_campagne(update: Update, context: ContextTypes.DEFAULT_TYPE):
    nom = update.message.text.strip()
    if not nom:
        await update.message.reply_text("❗️ Le nom de la campagne est obligatoire.")
        return CREER_CAMPAGNE
    context.user_data['campagne_nom'] = nom
    await update.message.reply_text(
        "🔗 *Ajoute le(s) lien(s) affilié(s) ou code promo à promouvoir.*\n"
        "Envoie chaque lien un par un, puis clique sur 'Suivant' quand tu as terminé.",
        reply_markup=ReplyKeyboardMarkup([["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True),
        parse_mode="Markdown"
    )
    context.user_data['liens'] = []
    return AJOUT_LIENS

async def ajout_liens(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if text == "Suivant":
        if not context.user_data['liens']:
            await update.message.reply_text("❗️ Ajoute au moins un lien affilié avant de continuer.", reply_markup=ReplyKeyboardMarkup([["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True))
            return AJOUT_LIENS
        await update.message.reply_text(
            "🖼️ *Ajoute un média pour ta pub (texte, image, sticker).* \n"
            "Envoie le texte ou l'image, ou clique sur 'Suivant' pour continuer.",
            reply_markup=ReplyKeyboardMarkup([["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return AJOUT_MEDIA
    elif text == "🏠 Menu principal":
        return await start(update, context)
    elif not text.strip():
        await update.message.reply_text("❗️ Le lien ne peut pas être vide.", reply_markup=ReplyKeyboardMarkup([["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True))
        return AJOUT_LIENS
    elif text in context.user_data['liens']:
        await update.message.reply_text("⚠️ Ce lien a déjà été ajouté.", reply_markup=ReplyKeyboardMarkup([["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True))
        return AJOUT_LIENS
    else:
        context.user_data['liens'].append(text)
        await update.message.reply_text(
            "✅ Lien ajouté !\nAjoute-en un autre ou clique sur 'Suivant'.",
            reply_markup=ReplyKeyboardMarkup([["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return AJOUT_LIENS

async def ajout_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == "Suivant":
        await update.message.reply_text(
            "🧭 *Ciblage de la campagne*\n\n"
            "Choisis le type de public cible 👇",
            reply_markup=ReplyKeyboardMarkup([
                ["Paris sportif", "Musique"],
                ["Crypto", "Entrepreneuriat"],
                ["Autre"],
                ["🏠 Menu principal"]
            ], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return AJOUT_CIBLAGE
    elif update.message.text == "🏠 Menu principal":
        return await start(update, context)
    elif update.message.photo:
        context.user_data['media'] = update.message.photo[-1].file_id
    elif update.message.text:
        context.user_data['media'] = update.message.text
    else:
        context.user_data['media'] = None
    await update.message.reply_text(
        "🧭 *Ciblage de la campagne*\n\n"
        "Choisis le type de public cible 👇",
        reply_markup=ReplyKeyboardMarkup([
            ["Paris sportif", "Musique"],
            ["Crypto", "Entrepreneuriat"],
            ["Autre"],
            ["🏠 Menu principal"]
        ], resize_keyboard=True),
        parse_mode="Markdown"
    )
    return AJOUT_CIBLAGE

async def ajout_ciblage(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ciblage = update.message.text
    if ciblage == "🏠 Menu principal":
        return await start(update, context)
    if ciblage not in ["Paris sportif", "Musique", "Crypto", "Entrepreneuriat", "Autre"]:
        await update.message.reply_text("❗️ Choisis un ciblage valide via les boutons.")
        return AJOUT_CIBLAGE
    context.user_data['ciblage'] = ciblage
    keyboard = [
        ["Ajouter un groupe/canal"],
        ["Suivant"],
        ["🏠 Menu principal"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    await update.message.reply_text(
        "📢 *Ajout des groupes/canaux de diffusion*\n\n"
        "Clique sur 'Ajouter un groupe/canal' pour en ajouter, puis sur 'Suivant' quand tu as terminé.",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )
    context.user_data['groupes'] = []
    return AJOUT_GROUPE

async def ajout_groupe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if text == "Suivant":
        if not context.user_data['groupes']:
            await update.message.reply_text("❗️ Ajoute au moins un groupe/canal avant de continuer.", reply_markup=ReplyKeyboardMarkup([["Ajouter un groupe/canal"], ["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True))
            return AJOUT_GROUPE
        await update.message.reply_text(
            "💳 *Choisis ton forfait pour cette campagne*",
            reply_markup=ReplyKeyboardMarkup([["Basic", "Pro", "VIP"], ["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return CHOIX_FORFAIT
    elif text == "Ajouter un groupe/canal":
        await update.message.reply_text(
            "Envoie le nom ou le lien du groupe/canal à ajouter.",
            parse_mode="Markdown"
        )
        return AJOUT_GROUPE
    elif text == "🏠 Menu principal":
        return await start(update, context)
    elif not text.strip():
        await update.message.reply_text("❗️ Le nom du groupe/canal ne peut pas être vide.", reply_markup=ReplyKeyboardMarkup([["Ajouter un groupe/canal"], ["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True))
        return AJOUT_GROUPE
    elif text in context.user_data['groupes']:
        await update.message.reply_text("⚠️ Ce groupe/canal a déjà été ajouté.", reply_markup=ReplyKeyboardMarkup([["Ajouter un groupe/canal"], ["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True))
        return AJOUT_GROUPE
    else:
        context.user_data['groupes'].append(text)
        await update.message.reply_text(
            "✅ Groupe/canal ajouté !\nAjoute-en un autre ou clique sur 'Suivant'.",
            reply_markup=ReplyKeyboardMarkup([["Ajouter un groupe/canal"], ["Suivant"], ["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return AJOUT_GROUPE

async def choix_forfait(update: Update, context: ContextTypes.DEFAULT_TYPE):
    forfait = update.message.text
    if forfait == "🏠 Menu principal":
        return await start(update, context)
    if forfait not in ["Basic", "Pro", "VIP"]:
        await update.message.reply_text("❗️ Choisis un forfait valide via les boutons.")
        return CHOIX_FORFAIT
    context.user_data['forfait'] = forfait
    recap = (
        f"🎉 *Résumé de ta campagne*\n\n"
        f"• Nom : {context.user_data.get('campagne_nom')}\n"
        f"• Business : {context.user_data.get('business')}\n"
        f"• Liens : {', '.join(context.user_data.get('liens', []))}\n"
        f"• Média : {'Oui' if context.user_data.get('media') else 'Non'}\n"
        f"• Ciblage : {context.user_data.get('ciblage')}\n"
        f"• Groupes/canaux : {len(context.user_data.get('groupes', []))}\n"
        f"• Forfait : {context.user_data.get('forfait')}\n\n"
        "Valide pour lancer la campagne ou modifie si besoin."
    )
    await update.message.reply_text(recap, parse_mode="Markdown")
    await update.message.reply_text(
        "✅ *Clique sur 'Valider' pour lancer la campagne*",
        reply_markup=ReplyKeyboardMarkup([["Valider"], ["🏠 Menu principal"]], resize_keyboard=True),
        parse_mode="Markdown"
    )
    return CONFIRMATION

async def confirmation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text == "Valider":
        telegram_id = update.effective_user.id
        nom = context.user_data.get('campagne_nom')
        message = context.user_data.get('media')
        image_id = context.user_data.get('media') if isinstance(context.user_data.get('media'), str) else None
        frequency = 24
        status = "active"
        # Création de la campagne
        campagne = creer_campagne_api(
            user_id=telegram_id,
            nom=nom,
            message=message,
            image_id=image_id,
            frequency=frequency,
            status=status
        )
        if campagne:
            campaign_id = campagne["id"]
            # Ajout des liens affiliés
            link_ids = []
            for url in context.user_data.get('liens', []):
                link_id = ajouter_lien_affilie(telegram_id, url)
                if link_id:
                    link_ids.append(link_id)
            if link_ids:
                lier_liens_a_campagne(campaign_id, link_ids)
            # Ajout des groupes
            group_ids = []
            for group_name in context.user_data.get('groupes', []):
                group_id = ajouter_groupe(telegram_id, group_name)
                if group_id:
                    group_ids.append(group_id)
            if group_ids:
                lier_groupes_a_campagne(campaign_id, group_ids)
            await update.message.reply_text(
                "🚀 *Ta campagne est lancée !*\n\n"
                "Retrouve tes stats sur le dashboard web ou ici avec /stats.",
                reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(
                "❗️ Une erreur est survenue lors de la création de la campagne.",
                reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
                parse_mode="Markdown"
            )
        return MENU
    elif update.message.text == "🏠 Menu principal":
        return await start(update, context)
    else:
        await update.message.reply_text(
            "Merci de cliquer sur 'Valider' pour lancer la campagne.",
            reply_markup=ReplyKeyboardMarkup([["Valider"], ["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
        return CONFIRMATION

# Commande /help
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🆘 *Aide*\n\nConsulte notre site d’aide : https://ton-site-aide.com",
        parse_mode="Markdown"
    )

async def stats_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    stats = get_user_stats(telegram_id)
    if stats:
        await update.message.reply_text(
            f"📊 *Tes statistiques*\n\n"
            f"Nombre de clics sur tes liens : {stats.get('clicks', 0)}",
            reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            "❗️ Impossible de récupérer tes statistiques.",
            reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
            parse_mode="Markdown"
        )
    return MENU

# 6. Gestion du parrainage
async def parrainage_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    filleuls = get_parrainage(telegram_id)
    nb_filleuls = len(filleuls) if filleuls else 0
    await update.message.reply_text(
        f"🤝 *Parrainage*\n\n"
        f"Ton lien : https://t.me/PubliciteUniverselleBot?start={telegram_id}\n"
        f"Nombre de filleuls : {nb_filleuls}\n"
        "Gagne des avantages en invitant tes amis !",
        reply_markup=ReplyKeyboardMarkup([["🏠 Menu principal"]], resize_keyboard=True),
        parse_mode="Markdown"
    )
    return MENU

async def dashboard_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    dashboard_url = f"https://ton-domaine.com/dashboard/index.html?telegram_id={telegram_id}"
    await update.message.reply_text(
        f"🔗 Accède à ton espace web ici :\n{dashboard_url}"
    )

async def dashboard_partenaire_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    dashboard_url = f"https://ton-domaine.com/dashboard/partner.html?telegram_id={telegram_id}"
    await update.message.reply_text(
        f"🔗 Accède à ton espace partenaire ici :\n{dashboard_url}"
    )

# Récupérer les groupes propres
r = requests.get(f"{API_BASE}/groups/own/{user_id}")
groupes_propres = r.json() if r.ok else []

# Récupérer les groupes tiers (si rôle partenaire/pro/vip)
r = requests.get(f"{API_BASE}/groups/tiers")
groupes_tiers = r.json() if r.ok else []

# Appliquer les règles de quotas et de fréquence selon le forfait et le rôle

# ConversationHandler final
conv_handler = ConversationHandler(
    entry_points=[CommandHandler("start", start)],
    states={
        MENU: [MessageHandler(filters.TEXT & ~filters.COMMAND, menu_handler)],
        CHOIX_BUSINESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, choix_business)],
        CREER_CAMPAGNE: [MessageHandler(filters.TEXT & ~filters.COMMAND, creer_campagne)],
        AJOUT_LIENS: [MessageHandler(filters.TEXT & ~filters.COMMAND, ajout_liens)],
        AJOUT_MEDIA: [MessageHandler(filters.TEXT | filters.PHOTO, ajout_media)],
        AJOUT_CIBLAGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ajout_ciblage)],
        AJOUT_GROUPE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ajout_groupe)],
        CHOIX_FORFAIT: [MessageHandler(filters.TEXT & ~filters.COMMAND, choix_forfait)],
        CONFIRMATION: [MessageHandler(filters.TEXT & ~filters.COMMAND, confirmation)],
        ABONNEMENT: [MessageHandler(filters.TEXT & ~filters.COMMAND, abonnement_handler)],
    },
    fallbacks=[CommandHandler("cancel", lambda update, context: update.message.reply_text("Opération annulée."))]
)

if __name__ == "__main__":
    application = Application.builder().token(TOKEN).build()
    application.add_handler(conv_handler)
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("dashboard", dashboard_handler))
    application.add_handler(CommandHandler("dashboard_partenaire", dashboard_partenaire_handler))
    loop = asyncio.get_event_loop()
    loop.create_task(diffusion_automatique(application))
    application.run_polling()