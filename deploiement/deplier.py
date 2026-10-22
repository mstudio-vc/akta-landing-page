"""Déplie un fichier HTML autonome en dossier déployable.

    python3 deploiement/deplier.py ~/Downloads/akta-partners-site-standalone_v5.html

Le studio livre un fichier unique, toutes ressources embarquées en base64. C'est pratique à
envoyer par courriel, mauvais à servir : le base64 d'une image déjà compressée ne se
recompresse pas, et comme Cloudflare ne met pas le HTML en cache, le visiteur retélécharge
TOUTES les images à chaque visite. Mesuré sur la v5 : 910 Ko par visite, contre 3 Ko quand les
images sont des fichiers mis en cache un an.

Seules les ressources base64 sont extraites. Le CSS et le JS restent inlinés : les sortir
changerait l'ordre d'exécution, pour un gain marginal — ils pèsent peu et se compressent bien.

Les fichiers sont nommés par l'empreinte de leur contenu. Deux avantages : les doublons du
fichier d'origine fusionnent (la v5 inlinait deux fois la même image de 223 Ko et trois fois le
même logo), et le nom change quand le contenu change — ce qui rend honnête la règle
`immutable, max-age=31536000` du vhost.
"""
import hashlib, pathlib, re, sys

EXT = {
    "image/webp": ".webp", "image/png": ".png", "image/jpeg": ".jpg",
    "image/svg+xml": ".svg", "image/gif": ".gif", "image/avif": ".avif",
    "font/woff2": ".woff2", "font/woff": ".woff",
}
DOSSIER = {".svg": "assets/svg", ".woff2": "assets/fonts", ".woff": "assets/fonts"}

def main(source: str) -> int:
    racine = pathlib.Path(__file__).resolve().parent.parent
    html = pathlib.Path(source).read_text(encoding="utf-8", errors="strict")

    # Les fichiers déjà présents, par empreinte : on réutilise un nom existant plutôt que d'en
    # créer un second pour le même contenu — c'est ce qui garde `og:image` valide.
    connus = {}
    for f in (racine / "assets").rglob("*"):
        if f.is_file():
            connus[hashlib.sha256(f.read_bytes()).hexdigest()] = f.relative_to(racine).as_posix()

    extraits, reutilises, ecrits = {}, 0, 0

    def remplacer(m: re.Match) -> str:
        nonlocal reutilises, ecrits
        mime, charge = m.group(1).lower(), m.group(2)
        import base64
        octets = base64.b64decode(charge)
        empreinte = hashlib.sha256(octets).hexdigest()
        if empreinte in extraits:
            return extraits[empreinte]
        if empreinte in connus:
            extraits[empreinte] = connus[empreinte]
            reutilises += 1
            return connus[empreinte]
        ext = EXT.get(mime)
        if ext is None:
            print(f"  type non géré, laissé embarqué : {mime}")
            return m.group(0)
        chemin = f"{DOSSIER.get(ext, 'assets/img')}/{empreinte[:12]}{ext}"
        cible = racine / chemin
        cible.parent.mkdir(parents=True, exist_ok=True)
        cible.write_bytes(octets)
        extraits[empreinte] = chemin
        ecrits += 1
        return chemin

    nouveau, n = re.subn(r'data:([a-z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)', remplacer, html, flags=re.I)
    (racine / "index.html").write_text(nouveau, encoding="utf-8")

    print(f"  {n} références embarquées traitées — {ecrits} fichier(s) écrit(s), "
          f"{reutilises} réutilisé(s), {n - len(extraits)} doublon(s) fondu(s)")
    print(f"  index.html : {len(html):,} → {len(nouveau):,} caractères")
    return 0

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    sys.exit(main(sys.argv[1]))
