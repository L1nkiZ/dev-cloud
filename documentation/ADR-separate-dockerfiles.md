Titre : Séparation du Dockerfile front + back en deux Dockerfiles différents

Statut : Accepté

Contexte : L’application est composée de plusieurs services distincts, notamment un client (frontend) et une API (backend).
Ces services utilisent des dépendances, des processus de build et des configurations différentes.

Décision : Nous voulons séparer les deux faces de l'application pour qu'elles aient le minimum de couplage possible. Le but est de pouvoir démarrer le front et le back séparément si besoin, pour ne pas charger des données inutilement lors de futurs tests par exemple.

Conséquences : Cette décision permet une meilleure séparation des responsabilités entre les services, facilite la maintenance et rend les builds plus rapides et plus compréhensibles. Chaque service peut évoluer indépendamment avec ses propres dépendances et configurations.