'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/UserContext';
import { auth, db } from '@/service/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email({ message: 'Endereço de e-mail inválido' }),
  password: z
    .string()
    .min(6, { message: 'Senha precisa ter pelo menos 6 caracteres.' })
});

const resetSchema = z.object({
  emailResetPassword: z
    .string()
    .email({ message: 'Endereço de e-mail inválido' }) // Campo renomeado
});

const roleRoutes = {
  admin: '/dashboard/overview',
  business: '/dashboard/funcionarios',
  accredited: '/dashboard/servicos',
  accrediting: '/dashboard/planos'
};

type LoginFormValue = z.infer<typeof loginSchema>;
type ResetFormValue = z.infer<typeof resetSchema>;

interface UserDocument {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string | null;
  role: 'business' | 'employee' | 'accredited' | 'admin';
  [key: string]: any;
}

export default function UserAuthForm() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { setUser } = useUser();
  const router = useRouter();

  // Formulário de login
  const loginForm = useForm<LoginFormValue>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange'
  });

  // Formulário de recuperação com campo separado
  const resetForm = useForm<ResetFormValue>({
    resolver: zodResolver(resetSchema),
    defaultValues: { emailResetPassword: '' }, // Valor inicial ajustado
    mode: 'onChange'
  });

  // Função para buscar dados do usuário
  const fetchUserData = async (email: string): Promise<UserDocument | null> => {
    setLoginLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      const userDocs: UserDocument[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        displayName: doc.data().name,
        photoURL: doc.data().photoURL,
        role: doc.data().role,
        uid: doc.data().uid,
        ...doc.data()
      }));
      return userDocs.length > 0 ? userDocs[0] : null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      toast.error('Erro ao buscar dados do usuário.');
      return null;
    } finally {
      setLoginLoading(false);
    }
  };

  // Função de login (mantida igual)
  const onLoginSubmit = async (data: LoginFormValue) => {
    setLoginLoading(true);
    try {
      const userInfo = await fetchUserData(data.email);
      if (!userInfo) {
        toast.error('Usuário não encontrado.');
        return;
      }
      if (userInfo.role === 'employee') {
        toast.error('Funcionários não têm acesso ao painel admin.');
        return;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      const payload = {
        email: user.email,
        uid: user.uid,
        role: userInfo.role,
        displayName: user.displayName || userInfo.name || '',
        photoURL: user.photoURL || ''
      };

      setUser(payload);

      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar o token no servidor.');
      }

      toast.success('Login realizado com sucesso!');
      router.push(roleRoutes[userInfo.role]);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        toast.error('Usuário não encontrado.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Senha inválida.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Credenciais inválidas.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        toast.error('Erro inesperado. Tente novamente.');
        console.error(error);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Função de recuperação de senha ajustada
  const onResetSubmit = async (data: ResetFormValue) => {
    setResetLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: data.emailResetPassword }) // Envio do campo correto
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      toast.success(
        'Email de recuperação enviado! Verifique sua caixa de entrada.'
      );
      setIsResetMode(false);
      resetForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação.');
      console.error(error);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {isResetMode ? (
        <Form {...resetForm}>
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="space-y-4"
          >
            <FormField
              control={resetForm.control}
              name="emailResetPassword" // Campo renomeado
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email para recuperação</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Digite seu email..."
                      disabled={resetLoading}
                      {...field} // Spread correto do field
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                disabled={resetLoading}
                onClick={() => setIsResetMode(false)}
              >
                Voltar para o login
              </button>
            </div>
            <Button
              disabled={resetLoading}
              className="w-full text-white hover:bg-[#244777]"
              type="submit"
            >
              {resetLoading ? 'Enviando...' : 'Enviar email de recuperação'}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            className="space-y-4"
          >
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Escreva seu email..."
                      disabled={loginLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="**********"
                      disabled={loginLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                disabled={loginLoading}
                onClick={() => setIsResetMode(true)}
              >
                Esqueceu sua senha?
              </button>
            </div>
            <Button
              disabled={loginLoading}
              className="w-full text-white hover:bg-[#244777]"
              type="submit"
            >
              {loginLoading ? 'Carregando...' : 'Continue'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
