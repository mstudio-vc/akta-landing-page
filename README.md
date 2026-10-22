# AKTA Partners — v5

Dossier statique à déployer tel quel : fichier d'entrée `index.html`.

Le studio livre un **fichier HTML autonome**, toutes ressources embarquées en base64.
Il ne se déploie pas tel quel : le base64 d'une image déjà compressée ne se recompresse
pas, et Cloudflare ne met pas le HTML en cache — chaque visite retéléchargerait tout.
Mesuré sur la v5 : 910 Ko par visite contre 8,4 Ko une fois déplié.

    python3 deploiement/deplier.py ~/Downloads/akta-partners-site-standalone_v5.html
    sh deploiement/deployer.sh               # essai à blanc
    sh deploiement/deployer.sh --envoyer

Le style et le script restent inlinés dans `index.html` : les extraire changerait l'ordre
d'exécution pour un gain marginal. Seules les images et les polices sont sorties, vers
`assets/`, où le vhost les met en cache un an.
