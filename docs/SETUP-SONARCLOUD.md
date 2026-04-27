# Setup SonarCloud

Ce fichier détaille les étapes **manuelles** à effectuer une seule fois pour activer l'analyse SonarCloud sur ce projet.

---

## 1. Créer l'organisation sur SonarCloud

1. Connecte-toi sur [sonarcloud.io](https://sonarcloud.io) avec ton compte GitHub.
2. Clique sur **"+"** > **"Create new organization"**.
3. Choisis **"Import from GitHub"** et sélectionne ton compte `Terapyy18`.
4. Nomme l'organisation **`terapyy18`** (doit correspondre exactement à `sonar.organization` dans `sonar-project.properties`).
5. Sélectionne le plan **Free**.

---

## 2. Importer le dépôt

1. Dans ton organisation `terapyy18`, clique sur **"Analyze new project"**.
2. Sélectionne le dépôt `leico` dans la liste.
3. Clique sur **"Set Up"** puis **"With GitHub Actions"**.
4. SonarCloud va afficher le `SONAR_TOKEN` à copier — garde-le pour l'étape suivante.

> La `projectKey` doit être `Terapyy18_leico` (vérifiable dans _Project Settings > General_).

---

## 3. Ajouter le SONAR_TOKEN dans GitHub

1. Ouvre le repo sur GitHub : `github.com/Terapyy18/leico`.
2. Va dans **Settings > Secrets and variables > Actions**.
3. Clique sur **"New repository secret"**.
4. Nom : `SONAR_TOKEN`
5. Valeur : le token généré à l'étape 2.
6. Clique **"Add secret"**.

Le secret `GITHUB_TOKEN` est automatiquement disponible dans les workflows — tu n'as rien à faire.

---

## 4. Déclencher la première analyse

Pousse un commit ou ouvre une PR sur `main`. Le workflow `.github/workflows/sonarcloud.yml` se déclenchera automatiquement et enverra le rapport de coverage à SonarCloud.

---

## 5. Vérifier le dashboard

Accède au dashboard : [sonarcloud.io/project/overview?id=Terapyy18_leico](https://sonarcloud.io/project/overview?id=Terapyy18_leico)

Tu y trouveras :

- **Quality Gate** : état global (passed/failed)
- **Coverage** : % de code couvert par les tests (alimenté par `coverage/lcov.info`)
- **Bugs / Vulnerabilities / Code Smells**

---

## Générer le coverage en local

```bash
npm run test:coverage
# Le rapport lcov est généré dans coverage/lcov.info
```

---

## Structure des fichiers CI/SonarCloud

```
.github/
  workflows/
    sonarcloud.yml        # Workflow GitHub Actions
sonar-project.properties  # Configuration du projet SonarCloud
```
