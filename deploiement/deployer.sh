#!/bin/sh
# Envoie le site sur le serveur.
#
#   sh deploiement/deployer.sh            # montre ce qui serait fait, n'envoie rien
#   sh deploiement/deployer.sh --envoyer  # pour de vrai
#
# L'essai à blanc d'abord, toujours : `--delete` efface sur le serveur ce qui n'existe plus
# ici, et l'on veut avoir lu la liste avant qu'elle s'applique.
set -eu

HOTE="${HOTE:-ivoire}"                       # alias défini dans ~/.ssh/config
CIBLE="${CIBLE:-/var/www/akta-partners.com}"
RACINE=$(cd "$(dirname "$0")/.." && pwd)

# `.well-known` est EXCLU de la suppression : c'est là que certbot dépose ses validations.
# Sans cette exclusion, un déploiement pendant un renouvellement le ferait échouer.
EXCLUSIONS="--exclude=.git --exclude=.gitignore --exclude=deploiement --exclude=README.md
            --exclude=.DS_Store --exclude=.well-known --exclude=_headers"

MODE="--dry-run"
[ "${1:-}" = "--envoyer" ] && MODE=""

# shellcheck disable=SC2086
# Pas de `-p` : sans cela rsync recopie les permissions du poste, et le répertoire est
# arrivé en 700 au premier envoi — Apache, qui tourne en www-data, répondait 403 sur un
# dossier pourtant rempli.
#
# Et pas de `--chmod` non plus : macOS livre openrsync, qui ne le connaît pas. Les modes
# sont donc imposés sur le serveur, après coup — ce qui marche quelle que soit la version
# de rsync du poste depuis lequel on déploie.
rsync -rltz --delete $MODE $EXCLUSIONS --itemize-changes \
  "$RACINE"/ "$HOTE:$CIBLE/"

if [ -n "$MODE" ]; then
  echo
  echo "Essai à blanc. Relancer avec --envoyer pour appliquer."
else
  ssh "$HOTE" "chown -R root:www-data '$CIBLE' \
    && find '$CIBLE' -type d -exec chmod 755 {} + \
    && find '$CIBLE' -type f -exec chmod 644 {} +"
  echo
  echo "Envoyé, permissions normalisées."
  echo "Vérifier : curl -sI https://akta-partners.com | head -1"
fi
