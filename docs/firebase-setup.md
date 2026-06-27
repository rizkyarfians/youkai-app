# Firebase Setup

The backend is Firestore-only. Local SQLite is no longer used by the app.

## Firestore Collections

The app reads/writes these collections:

- `roles`: documents `admin` and `user`
- `users`: profile documents with a `role` field, usually matching Firebase Auth `uid`
- `jobs`: job master data
- `members`: roster data imported from `YOUKAI.xlsx`
- `eventTypes`: event type data
- `events`: event records
- `eventAttendances`: attendance records with `event_id` and `member_id`
- `lineupSlots`: one document per party slot, IDs like `team-1-slot-1`

## Frontend Web Config

The Firebase web config belongs in `frontend/.env.local` as Vite variables:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY="AIzaSyC6t7-o0MSe0PjfvaS3a82oUetd_GJhOzY"
VITE_FIREBASE_AUTH_DOMAIN="youkai-management-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="youkai-management-app"
VITE_FIREBASE_STORAGE_BUCKET="youkai-management-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="1075005176871"
VITE_FIREBASE_APP_ID="1:1075005176871:web:88822989555572b30a2202"
VITE_FIREBASE_MEASUREMENT_ID="G-042Y5JEMHF"
```

This config lets the React app sign in Firebase Auth users. It does not replace backend Admin SDK credentials.

## Backend Environment

Set `backend/.env`:

```env
DATA_PROVIDER=firebase
FIREBASE_PROJECT_ID="youkai-management-app"
FIREBASE_CLIENT_EMAIL="your-service-account@youkai-management-app.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

You can also use `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_BASE64` instead of the individual fields.

## Import Members From Excel

The import source is `YOUKAI.xlsx`, using the `Members` sheet columns:

- `NAME`
- `JOB`
- `POSITION`
- `REMARK`
- `TOAL Active`
- attendance date columns

Extract the workbook into JSON:

```bash
cd backend
python scripts/extractYoukaiMembers.py "C:\Users\USER\Downloads\YOUKAI.xlsx" data/youkai-members.json
```

Write the extracted members to Firestore:

```bash
cd backend
node scripts/importMembersToFirestore.js data/youkai-members.json
```

The importer replaces the `members` collection with the Excel roster and leaves lineup slots intact. To clear lineup assignments during import:

```bash
RESET_LINEUPS=true node scripts/importMembersToFirestore.js data/youkai-members.json
```

## Seed Master Data

After credentials are configured:

```bash
cd backend
node scripts/seedFirebase.js
```

This writes roles, users, jobs, event types, and the extracted Excel members to Firestore.

## Login And Admin/User Roles

1. In Firebase Console, open **Authentication > Sign-in method** and enable **Email/Password**.
2. Create users in **Authentication > Users**.
3. Add backend Admin SDK credentials in `backend/.env`.
4. Give a Firebase Auth user a role:

```bash
cd backend
node scripts/setFirebaseUserRole.js --email your-admin@email.com --role admin
node scripts/setFirebaseUserRole.js --email normal-user@email.com --role user
```

You can also use UID instead of email:

```bash
node scripts/setFirebaseUserRole.js --uid firebase-auth-uid --role admin
```

The script writes both:

- Firebase custom claims: `role` and `admin`
- Firestore profile: `users/{uid}.role`

After changing a role, the user should sign out and sign in again so Firebase refreshes the ID token.

## Member Status And Lineups

Member documents can include:

```json
{
  "status": "active"
}
```

Supported statuses are `active`, `inactive`, `toon`, `observation`, `bye-bye`, and `poor-attendance`.

Lineup documents are stored in `lineupSlots`:

```json
{
  "team_number": 1,
  "slot_number": 1,
  "member_id": "1"
}
```
