// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
<<<<<<< HEAD
import { getStorage } from 'firebase/storage';
=======
>>>>>>> 9710a3cf4acc44d9ba6645f45da70ca36d062e26
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDmAHnrOqrBwkRDXFI4ku0lVev0Q31V43E',
  authDomain: 'acertaplus-a6c30.firebaseapp.com',
  projectId: 'acertaplus-a6c30',
  storageBucket: 'acertaplus-a6c30.firebasestorage.app',
  messagingSenderId: '710076417188',
  appId: '1:710076417188:web:10ef664cb0910511df9231'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
<<<<<<< HEAD
export const storage = getStorage(app);
=======
>>>>>>> 9710a3cf4acc44d9ba6645f45da70ca36d062e26
