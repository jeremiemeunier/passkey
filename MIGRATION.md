# Migration Guide - Fix User ID Resolution

## Problème Résolu

Le système avait un problème où les identifiants utilisateurs n'étaient pas correctement récupérés lors de l'authentification. Cela causait des erreurs "User not found" ou des incohérences d'ID.

## Changements Effectués

### 1. Interface de Stockage (`storage.ts`)

Ajout d'une nouvelle méthode pour récupérer les challenges par leur valeur :

```typescript
getAndDeleteChallengeByValue(challengeValue: string): Promise<Challenge | null>;
```

### 2. Stockage en Mémoire (`memory-storage.ts`)

- Ajout d'un double index pour les challenges (par username ET par valeur du challenge)
- Implémentation de la nouvelle méthode `getAndDeleteChallengeByValue`
- Amélioration du nettoyage des challenges expirés pour gérer les deux index

### 3. Service Passkey (`passkey-service.ts`)

#### Enregistrement

- Garantie que le `userId` du challenge est utilisé de manière cohérente
- Si l'utilisateur existe déjà, on réutilise son `userId` existant

#### Authentification

- Récupération de l'utilisateur via `getUserByCredentialId` en premier
- Utilisation du username réel de l'utilisateur trouvé pour récupérer le challenge
- Support amélioré pour l'authentification découvrable (sans username)

## Migration pour les Implémentations Personnalisées

Si vous avez implémenté l'interface `PasskeyStorage` avec votre propre base de données, vous devez :

### 1. Ajouter la nouvelle méthode

```typescript
async getAndDeleteChallengeByValue(challengeValue: string): Promise<Challenge | null> {
  // Récupérer le challenge par sa valeur
  const challenge = await db.challenge.findUnique({
    where: { challenge: challengeValue }
  });

  if (challenge) {
    // Supprimer le challenge (usage unique)
    await db.challenge.delete({
      where: { challenge: challengeValue }
    });
  }

  return challenge;
}
```

### 2. Optimiser le stockage des challenges

Il est recommandé de pouvoir récupérer un challenge soit par :

- Le username de l'utilisateur (pour les authentifications standard)
- La valeur du challenge (pour les authentifications découvrables)

**Exemple avec Prisma :**

```prisma
model Challenge {
  id          String   @id @default(cuid())
  challenge   String   @unique
  userId      String
  username    String
  createdAt   DateTime
  expiresAt   DateTime

  @@index([username])
  @@index([challenge])
}
```

### 3. Garantir la cohérence des userId

Assurez-vous que :

- Le `userId` généré lors de l'enregistrement est unique et persistant
- Le même `userId` est toujours retourné pour le même utilisateur
- L'index `credentialId -> userId` permet de retrouver rapidement l'utilisateur

## Tests Recommandés

Après migration, testez les scénarios suivants :

1. **Enregistrement d'un nouvel utilisateur**

   - Vérifiez que le `userId` est généré et sauvegardé
   - Vérifiez que le credential est correctement indexé

2. **Authentification avec username**

   - Vérifiez que le challenge est trouvé
   - Vérifiez que l'utilisateur est correctement identifié
   - Vérifiez que le `userId` retourné correspond à celui de l'enregistrement

3. **Authentification découvrable (sans username)**

   - Vérifiez que l'utilisateur est trouvé via le credentialId
   - Vérifiez que le challenge est récupéré
   - Vérifiez que le `userId` est cohérent

4. **Ajout d'une seconde passkey**
   - Vérifiez que l'utilisateur existant est mis à jour
   - Vérifiez que le `userId` reste le même
   - Vérifiez que les deux credentials sont indexés

## Support

Si vous rencontrez des problèmes lors de la migration, vérifiez :

- Que votre implémentation de `PasskeyStorage` inclut toutes les méthodes requises
- Que les index de base de données sont correctement configurés
- Que les challenges expirés sont régulièrement nettoyés
