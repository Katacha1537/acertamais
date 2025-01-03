import { auth, db } from '@/service/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const registerUser = async (email: string, password: string, cpf: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Salvar CPF no Firestore
    await setDoc(doc(db, 'funcionarios', user.uid), { cpf });

    console.log('User registered:', user);
  } catch (error) {
    console.error('Error registering user:', error);
  }
};
