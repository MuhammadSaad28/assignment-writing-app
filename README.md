# Assignment Writing App

A React-based web application for managing assignment writing services with real-time Firebase integration.

## Features

- 🔐 **User Authentication** - Firebase Auth for secure login/signup
- 📝 **Assignment Management** - Upload, download, and submit assignments
- 💰 **Payment System** - Track earnings and request withdrawals
- 👥 **Admin Dashboard** - Manage users, assignments, and payments
- 📱 **Real-time Updates** - Live data synchronization with Firebase
- 📁 **File Upload** - Secure file storage with Firebase Storage
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**

### 3. Firebase Configuration

1. In your Firebase project, go to Project Settings
2. Add a web app to your project
3. Copy the Firebase configuration object
4. Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles collection
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Assignments collection
    match /assignments/{assignmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      allow read, write: if request.auth != null;
    }
    
    // Withdrawals collection
    match /withdrawals/{withdrawalId} {
      allow read, write: if request.auth != null;
    }
    
    // Registrations collection
    match /registrations/{registrationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Storage Security Rules

Update your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /payments/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /submissions/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── lib/               # Firebase configuration
├── pages/             # Application pages
│   ├── admin/         # Admin-specific pages
│   └── ...            # User pages
└── main.tsx           # Application entry point
```

## Database Collections

### Profiles
- User profiles with role-based access
- Fields: full_name, email, phone, role, is_approved, total_earnings, etc.

### Assignments
- Available assignments for workers
- Fields: title, description, file_url, payment_amount, status, created_at

### Submissions
- Worker submissions for assignments
- Fields: assignment_id, worker_id, file_url, status, submitted_at

### Withdrawals
- Withdrawal requests from workers
- Fields: worker_id, amount, payment_method, payment_details, status

### Registrations
- New user registrations for admin review
- Fields: name, email, whatsapp, city, qualification, job, screenshot, status

## User Roles

### Worker
- View available assignments
- Submit completed work
- Track earnings and request withdrawals
- View submission status

### Admin
- Approve/reject user registrations
- Upload new assignments
- Review and approve submissions
- Process withdrawal requests
- View platform statistics

## Features in Detail

### Real-time Updates
- All data is synchronized in real-time using Firebase Firestore listeners
- Changes are reflected immediately across all connected clients

### File Management
- Secure file uploads to Firebase Storage
- Payment screenshots and assignment submissions
- Automatic file organization by type and date

### Authentication
- Email/password authentication
- Automatic profile creation on signup
- Role-based access control

### Admin Functions
- User approval system
- Assignment management
- Submission review workflow
- Withdrawal processing

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

4. Deploy:
```bash
firebase deploy
```

## Environment Variables

Create a `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
