# Security Specification for Tashkhees App

## 1. Data Invariants
- A user cannot access the diagnosis form without an active record in the `users` collection.
- Only an administrator can modify the `users` collection.
- An administrator is hardcoded by email and cannot be revoked by other users.
- The diagnosis form and protected operations must only be accessible to authorized and active users.

## 2. The "Dirty Dozen" Payloads
1. Unauthorized user attempts to read diagnosis results.
2. Unauthorized user attempts to write to `users` collection.
3. Ordinary user attempts to set `status` to 'active' on their own record.
4. Ordinary user attempts to set `isAdmin` to true.
5. Inactive user attempts to read diagnosis results.
6. Admin attempts to delete the primary administrator record.
7. Admin attempts to modify the primary administrator email.
8. Unauthorized user attempts to inject a large payload into a field.
9. Ordinary user attempts to read another user's record.
10. Ordinary user attempts to list all users.
11. Unauthorized user attempts to create a new diagnosis record without authorization.
12. Ordinary user attempts to delete a diagnosis record.

## 3. Test Runner
(Will implement firestore.rules.test.ts)
