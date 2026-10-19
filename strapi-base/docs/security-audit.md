# Audit des dependances Strapi

Commande utilisee en local et en CI :

```sh
pnpm audit --prod --audit-level=high
```

## Exception braces : CVE-2026-93687

- Avis : https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- Evaluation : 2026-10-19. Reevaluation au plus tard le 2026-11-19,
  ainsi qu'a chaque mise a jour de Strapi ou changement de dependances.
- Versions concernees : braces <=3.0.3. Aucun correctif officiel disponible
  lors de l'evaluation, y compris via les dernieres versions de micromatch
  et preferred-pm.
- Chemin signale : Strapi -> @strapi/utils -> preferred-pm ->
  find-yarn-workspace-root2 -> micromatch -> braces.
- La faille provoque un debordement de pile avec des motifs d'accolades
  profondement imbriques. Dans ce chemin, les motifs viennent du champ
  workspaces des manifestes locaux, et non des requetes HTTP. preferred-pm
  retourne des la detection du lockfile pnpm, avant la detection Yarn.
- Aucun usage direct de braces ou micromatch trouve dans src, config ou scripts.

L'exception pnpm.auditConfig.ignoreCves est limitee a cette CVE et au projet
Strapi. Elle ne corrige pas braces : le paquet vulnerable reste installe.
Elle masque cet avis pour tous les chemins transitifs du projet, pas seulement
celui signale. Les autres avis high et critical restent bloquants.

Ne pas transmettre de motifs fournis par des utilisateurs a ces bibliotheques.
Reevaluer l'exception si un nouveau chemin expose braces a des donnees non
fiables. Des qu'un correctif officiel est disponible, mettre a jour la chaine
transitive, supprimer l'exception et relancer l'audit.

## Handlebars

L'override >=4.7.10 <5 exclut les versions concernees par
GHSA-8r5x-fm3f-whwj et GHSA-p8wg-vrv2-v86f. Le lockfile resout actuellement
Handlebars 4.7.10.