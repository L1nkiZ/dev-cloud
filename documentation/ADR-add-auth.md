Titre : Ajout d'un système d'authentification et de session avec JWToken

Statut : Accepté

Contexte : L'application ne possède pas de sécurité.

Décision : Nous voulons ajouter un système d'authentification simple pour protéger l'application d'attaques mal intentionnées.

Conséquences : Cette décision entraîne une protection en plus pour toutes les routes de notre API, ce qui signifie que nos tests actuels ne prenant pas en compte l'authentification vont échouer et ont besoin de plus de profondeur.