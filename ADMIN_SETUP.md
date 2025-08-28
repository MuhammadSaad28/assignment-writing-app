# 🔧 Admin Setup Guide

This guide will help you set up and use the admin panel for the Assignment Writing App.

## 📋 Table of Contents

1. [Firebase Setup](#firebase-setup)
2. [Create Admin User](#create-admin-user)
3. [Admin Dashboard Features](#admin-dashboard-features)
4. [Managing Assignments](#managing-assignments)
5. [User Management](#user-management)
6. [Submission Review](#submission-review)
7. [Withdrawal Processing](#withdrawal-processing)

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `assignment-writing-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Services

1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Click "Save"

2. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users

3. **Storage**:
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users

### Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Register app with name: `Assignment Writing App`
5. Copy the configuration object

### Step 4: Update Configuration

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 👤 Create Admin User

### Option 1: Using the Admin Creation Page

1. Start your development server: `npm run dev`
2. Open: `http://localhost:5173/create-admin.html`
3. Fill in the admin details:
   - **Email**: `admin@assignmentpro.com`
   - **Password**: `admin123456`
   - **Full Name**: `Admin User`
   - **Phone**: `1234567890`
4. Click "Create Admin User"

### Option 2: Using Firebase Console

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. Go to Firestore Database → Start collection
5. Collection ID: `profiles`
6. Document ID: (use the user's UID from Authentication)
7. Add this data:

```json
{
  "full_name": "Admin User",
  "email": "admin@assignmentpro.com",
  "phone": "1234567890",
  "role": "admin",
  "is_approved": true,
  "total_earnings": 0,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## 🎛️ Admin Dashboard Features

### Main Dashboard (`/admin`)

The main admin dashboard provides:

- **Overview Statistics**: Total users, assignments, submissions, withdrawals
- **Quick Actions**: Access to all admin functions
- **Real-time Updates**: Live data synchronization

### Navigation Tabs

1. **Dashboard**: Overview and statistics
2. **Assignments**: Create and manage assignments
3. **Users**: Approve/reject user registrations
4. **Submissions**: Review worker submissions
5. **Withdrawals**: Process withdrawal requests

## 📝 Managing Assignments

### Creating Assignments

1. Go to `/admin/assignments` or click "Assignments" tab
2. Click "Add Assignment" button
3. Fill in the form:
   - **Title**: Clear, descriptive title
   - **Description**: Detailed instructions
   - **Payment Amount**: Amount in USD
   - **Status**: Active (visible to workers) or Inactive (hidden)
   - **File**: Upload assignment file (PDF, DOC, DOCX, TXT)
4. Click "Create Assignment"

### Assignment Management Features

- **Edit Assignments**: Click "Edit" to modify existing assignments
- **Toggle Status**: Activate/deactivate assignments
- **Download Files**: Access original assignment files
- **Delete Assignments**: Remove assignments (with confirmation)
- **Real-time Updates**: Changes appear instantly for workers

### Assignment Status

- **Active**: Visible to approved workers
- **Inactive**: Hidden from workers (can be reactivated)

## 👥 User Management

### User Approval Process

1. Go to "Users" tab in admin dashboard
2. View pending users (status: "Pending")
3. For each user:
   - **Approve**: Click "Approve" to allow access
   - **Reject**: Click "Reject" to deny access

### User Information

- **Full Name**: User's complete name
- **Email**: Login email address
- **Phone**: Contact number
- **Role**: Worker or Admin
- **Status**: Approved or Pending
- **Earnings**: Total earnings from completed work

### User Roles

- **Worker**: Can view assignments, submit work, request withdrawals
- **Admin**: Full access to all admin functions

## 📋 Submission Review

### Reviewing Submissions

1. Go to "Submissions" tab
2. View all worker submissions with status:
   - **Pending**: Awaiting review
   - **Approved**: Payment will be processed
   - **Rejected**: Work not accepted

### Submission Actions

- **Download**: View submitted work
- **Approve**: Accept work and process payment
- **Reject**: Decline work (worker can resubmit)

### Submission Information

- **Worker**: Name and email of submitter
- **Assignment**: Title and payment amount
- **Status**: Current review status
- **Submitted**: Date and time of submission

## 💰 Withdrawal Processing

### Processing Withdrawals

1. Go to "Withdrawals" tab
2. View pending withdrawal requests
3. For each request:
   - **Approve**: Process payment to worker
   - **Reject**: Decline withdrawal request

### Withdrawal Information

- **Worker**: Name and email
- **Amount**: Requested withdrawal amount
- **Method**: Payment method (EasyPaisa, JazzCash, Bank)
- **Details**: Account information
- **Status**: Pending, Approved, or Rejected

## 🔒 Security Rules

### Firestore Security Rules

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

### Storage Security Rules

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
    match /assignments/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Best Practices

### Assignment Creation

1. **Clear Titles**: Use descriptive, specific titles
2. **Detailed Descriptions**: Provide comprehensive instructions
3. **Fair Pricing**: Set appropriate payment amounts
4. **File Quality**: Upload clear, readable files
5. **Status Management**: Use inactive status for maintenance

### User Management

1. **Quick Approval**: Review and approve users promptly
2. **Communication**: Contact users if additional information is needed
3. **Fair Treatment**: Apply consistent approval criteria

### Submission Review

1. **Timely Review**: Review submissions within 24-48 hours
2. **Quality Standards**: Maintain consistent quality requirements
3. **Constructive Feedback**: Provide feedback for rejected submissions

### Withdrawal Processing

1. **Prompt Processing**: Process withdrawals within 1-2 business days
2. **Verification**: Verify payment details before approval
3. **Communication**: Notify workers of processed payments

## 🔧 Troubleshooting

### Common Issues

1. **Admin Access Denied**:
   - Verify user role is set to "admin" in Firestore
   - Check if user is approved (is_approved: true)

2. **File Upload Issues**:
   - Check Storage security rules
   - Verify file size limits
   - Ensure proper file formats

3. **Real-time Updates Not Working**:
   - Check Firestore security rules
   - Verify Firebase configuration
   - Check browser console for errors

### Support

For technical support or questions:
- Check the browser console for error messages
- Verify Firebase configuration
- Ensure all services are properly enabled
- Contact the development team

## 📊 Analytics & Monitoring

### Key Metrics to Monitor

- **User Registrations**: New user signups
- **Assignment Completion Rate**: Submissions vs. approvals
- **Payment Processing**: Withdrawal request volume
- **Platform Activity**: Daily active users

### Performance Optimization

- **File Optimization**: Compress large files before upload
- **Database Indexing**: Add indexes for frequently queried fields
- **Caching**: Implement client-side caching for better performance

---

**🎉 Congratulations!** Your admin panel is now fully functional and ready to manage your assignment writing platform.
