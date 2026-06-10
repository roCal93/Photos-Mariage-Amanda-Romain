## 📋 Checklist d'installation

- [ ] Projet créé avec `create-hakuna-app`
- [ ] Dépendances installées (frontend & backend)
- [ ] Variables d'environnement configurées
- [ ] Strapi lancé et accessible en local
- [ ] Next.js lancé et accessible en local
- [ ] Git initialisé dans le dossier du projet
- [ ] Dépôt GitHub connecté (remote ajouté)
- [ ] Premier commit effectué et push sur GitHub
- [ ] Token API Strapi (full access) généré et copié dans `nextjs-base/.env.local`
- [ ] Pages et sections créées dans Strapi
- [ ] Langues FR/EN configurées dans Strapi (Settings > Internationalization)
- [ ] Images uploadées
- [ ] Tests fonctionnels réalisés (SEO, navigation, contenu)

# 🏗️ Hakuna Mataweb Starter

⚡️ Désormais, l'installation du starter se fait en une seule commande grâce à [create-hakuna-app](../create-hakuna-app) !

**Utilisez create-hakuna-app pour générer un nouveau projet basé sur ce starter, avec configuration automatique du frontend (Next.js) et du backend (Strapi).**

---

Starter officiel pour créer des sites multilingues performants avec Next.js App Router + Strapi v5.

## 🌟 Fonctionnalités

- **Frontend** : Next.js App Router avec TypeScript
- **Backend** : Strapi v5 headless CMS
- **SEO dynamique** : metadata, OpenGraph, Twitter Cards, robots.txt, sitemap.xml
- **i18n** : Support FR/EN avec routing `[locale]`
- **Preview mode** : Pour les drafts en développement
- **Sections modulaires** : Hero, Card, SectionGeneric, Header, Footer
- **Performance** : Images optimisées, headers HTTP, CSP
- **Sécurité** : Headers de sécurité, validation des inputs

## 📂 Structure

```
hakuna-mataweb-starter/
├── strapi-base/           # Backend Strapi v5
│   ├── api/               # APIs personnalisées
│   ├── config/            # Configuration Strapi
│   ├── database/          # Migrations
│   ├── public/            # Assets publics
│   ├── scripts/           # Scripts utilitaires
│   ├── src/               # Code source
│   └── types/             # Types TypeScript
├── nextjs-base/           # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── [slug]/page.tsx  # Pages dynamiques
│   │   │   │   ├── layout.tsx       # Layout principal
│   │   │   │   ├── not-found.tsx    # Page 404
│   │   │   │   └── loading.tsx      # Loading states
│   │   ├── components/     # Composants UI réutilisables
│   │   ├── lib/           # Helpers (fetchAPI, SEO, Strapi)
│   │   └── types/         # Types TypeScript générés
│   ├── public/            # Assets statiques
│   ├── next.config.ts     # Configuration Next.js
│   └── package.json       # Dépendances
├── .env.example           # Variables d'environnement
├── README.md              # Ce fichier
└── LICENSE                # Licence MIT
```


## 🚀 Démarrage rapide

### 1. Créez votre projet avec create-hakuna-app

```bash
npx create-hakuna-app@latest mon-nouveau-projet
```

Suivez les instructions interactives pour configurer automatiquement le frontend (Next.js) et le backend (Strapi).

### 2. (Optionnel) Initialisez git et connectez à GitHub

```bash
cd mon-nouveau-projet
git init
git remote add origin https://github.com/votre-utilisateur/votre-repo.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

Pour une installation manuelle ou des cas avancés, reportez-vous à la documentation ci-dessous.

## 📋 Checklist déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL sur Railway
- [ ] Strapi déployé et accessible
- [ ] Content types créés dans Strapi
- [ ] Pages et sections ajoutées
- [ ] Images uploadées
- [ ] SEO configuré (titres, descriptions, images)
- [ ] Langues FR/EN testées
- [ ] Build Next.js réussi
- [ ] Déploiement Vercel configuré
- [ ] Domaines pointés
- [ ] Tests fonctionnels passés

## 🔧 Configuration avancée

### Variables d'environnement

Voir `.env.example` pour toutes les variables nécessaires.

### Scripts disponibles

```bash
# Frontend
npm run dev          # Développement
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linting
npm run test         # Tests

# Backend
npm run develop      # Développement Strapi
npm run build        # Build Strapi
npm run start        # Serveur Strapi
```

### Personnalisation

- **Composants** : Ajouter dans `nextjs-base/src/components/`
- **APIs Strapi** : Modifier dans `strapi-base/src/api/`
- **Types** : Régénérer avec `pnpm generate-types` dans Strapi

## 📖 Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Strapi v5](https://docs.strapi.io/)
- [TypeScript](https://www.typescriptlang.org/)

## 🤝 Contribution

Issues et PRs bienvenues !

## 📄 Licence

MIT - Voir [LICENSE](LICENSE)