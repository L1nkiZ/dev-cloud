Titre : Séparation de la liste des todos en fonction de l'utilisateur

Statut : Accepté

Contexte : L'application affichait pour chaque utilisateur la même liste de todo.

Décision : Nous voulons séparer la liste pour chaque utilisateur afin que chacun puisse la personnaliser comme bon lui semble.

Conséquences : On rajoute alors un user_id dans la table des todos, cela va demander aussi pour chaque prochaine amélioration de l'application de prendre en compte l'utilsateur connecté.