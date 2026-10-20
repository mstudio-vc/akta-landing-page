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
rsync -rlptz --delete $MODE $EXCLUSIONS --itemize-changes \
  "$RACINE"/ "$HOTE:$CIBLE/"

if [ -n "$MODE" ]; then
  echo
  echo "Essai à blanc. Relancer avec --envoyer pour appliquer."
else
  echo
  echo "Envoyé. Vérifier : curl -sI https://akta-partners.com | head -1"
fi
