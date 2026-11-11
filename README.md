# AKTA Partners

Dossier statique à déployer tel quel : fichier d'entrée `index.html`.

    sh deploiement/deployer.sh               # essai à blanc, lire la liste
    sh deploiement/deployer.sh --envoyer

Le studio livre tantôt un dossier (le cas courant), tantôt un **fichier HTML autonome**
avec tout embarqué en base64. Ce second format ne se déploie pas tel quel : le base64 d'une
image déjà compressée ne se recompresse pas, et Cloudflare ne met pas le HTML en cache, donc
chaque visite retéléchargerait tout. Mesuré sur la v5 : 910 Ko par visite contre 8,4 Ko une
fois déplié.

    python3 deploiement/deplier.py ~/Downloads/<le fichier autonome>.html

Le vhost `deploiement/akta-partners.com.conf` remplace `_headers`, qui est au format
Cloudflare Pages et qu'Apache ignore. `hero-2.webp` et `hero-3.webp` ne sont plus référencés
depuis novembre 2026 ; ils sont conservés parce que `og:image` a longtemps pointé sur
`hero-3`, et que les aperçus de liens déjà partagés le demandent encore.
