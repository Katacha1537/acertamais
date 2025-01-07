import { auth } from '@/service/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';

export const createLogin = async (email: string) => {
  const password = '123456789'; // Senha padrão gerada para o funcionário
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;
    return uid; // Retorna o UID do usuário criado
  } catch (error) {
    console.error('Erro ao criar o login:', error);
    toast.error('Erro ao criar o login do funcionário.');
    throw error; // Lança o erro para ser tratado onde a função for chamada
  }
};
