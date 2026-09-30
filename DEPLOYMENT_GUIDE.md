# Vercel & GitHub Deployment Guide for Multi-Vendor E-Commerce

## 1. Firebase Configuration (Tayyar Config)
Yeh app Firebase Firestore aur Auth ke sath connect ho chuki hai.
Firebase Project: `gen-lang-client-0535239688`

---

## 2. GitHub Par Kaise Daalein (Push to GitHub)
1. Apne computer ya terminal par repository init karein:
   ```bash
   git add .
   git commit -m "Connected Firebase and ready for Vercel deployment"
   ```
2. GitHub par new repository banayein aur code push karein:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Vercel Par Kaise Deploy Karein (Step-by-Step)
1. **[vercel.com](https://vercel.com)** par login karein (GitHub ke sath).
2. **"Add New Project"** par click karein aur apni GitHub repository select karein.
3. **Framework Preset**: Auto-detect ho jayega (`Vite`).
4. **Environment Variables** section kholein aur yeh values add karein:

| Variable Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBHY8qo4z0-rwf2jYvJUq6EgpSAaI5jJuo` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `gen-lang-client-0535239688.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `gen-lang-client-0535239688` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `gen-lang-client-0535239688.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `350522966361` |
| `VITE_FIREBASE_APP_ID` | `1:350522966361:web:539f0777479bed51848c48` |
| `VITE_FIREBASE_DATABASE_ID` | `ai-studio-admincontrollede-9014874c-723b-48f9-96e2-7fb66fafe1aa` |

5. **Deploy** button par click karein.
6. 1 minute mein aapki website live ho jayegi with free `.vercel.app` domain!

---

## 4. SPA Routing on Vercel
Agar kisi page reload par 404 aaye to project mein `vercel.json` already shamil hai jo automatic handling karta hai.
