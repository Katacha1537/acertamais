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

// Validação do formulário
const formSchema = z.object({
  email: z.string().email({ message: 'Endereço de e-mail inválido' }),
  password: z
    .string()
    .min(6, { message: 'Senha precisa ter pelo menos 6 caracteres.' })
});

const roleRoutes = {
  admin: '/dashboard/overview',
  business: '/dashboard/funcionarios',
  accredited: '/dashboard/servicos'
};

type UserFormValue = z.infer<typeof formSchema>;

interface UserDocument {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string | null;
  role: 'business' | 'employee' | 'accredited' | 'admin'; // Tipando o role
  [key: string]: any; // Ajuste conforme a estrutura do seu documento
}
export default function UserAuthForm() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser(); // Usando o hook useUser
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema)
  });
  const router = useRouter();

  // Função para buscar dados do usuário com base no email
  const fetchUserData = async (email: string): Promise<UserDocument | null> => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      // Mapeamento para preencher corretamente as propriedades
      const userDocs: UserDocument[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        displayName: doc.data().name,
        photoURL: doc.data().photoURL,
        role: doc.data().role,
        uid: doc.data().uid,
        ...doc.data()
      }));

      if (userDocs.length > 0) {
        return userDocs[0]; // Retorna o primeiro usuário encontrado
      } else {
        return null; // Se não encontrar o usuário, retorna null
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      toast.error('Erro ao buscar dados do usuário.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      const userInfo = await fetchUserData(data.email); // Aguarda o retorno da Promise

      // Verifique se userInfo foi carregado e se contém dados
      if (!userInfo) {
        toast.error('Usuário não encontrado.');
        return;
      }

      // Verifique o papel do usuário
      if (userInfo.role === 'employee') {
        toast.error(
          'Usuário não pode realizar o login. Funcionários não têm acesso ao painel admin.'
        );
        return;
      }

      // Realiza o login com Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      // Cria o payload do JWT
      const payload = {
        email: user.email,
        uid: user.uid,
        role: userInfo.role,
        displayName: user.displayName || userInfo.name || '',
        photoURL: user.photoURL || ''
      };

      setUser(payload);

      // Envia o token para a API
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payload }) // Envia o token no corpo da requisição
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar o token no servidor.');
      }

      // Exibe a mensagem de sucesso
      toast.success('Login realizado com sucesso!');
      const route = roleRoutes[userInfo.role];

      if (route) {
        router.push(route);
      } else {
        // Aqui você pode definir um comportamento padrão para quando o papel não corresponder a nenhum dos esperados
        toast.error('Permisão inválida ou não encontrado');
      }
    } catch (error: any) {
      // Tratamento de erros de autenticação
      if (error.code === 'auth/user-not-found') {
        toast.error(
          'Usuário não encontrado. Verifique seu e-mail e tente novamente.'
        );
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Senha inválida. Tente novamente.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Credenciais inválidas. Tente novamente.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error(
          'Muitas tentativas. Por favor, tente novamente mais tarde.'
        );
      } else {
        toast.error('Ocorreu um erro inesperado. Tente novamente.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
        {/* Campo de Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Escreva seu email..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo de Senha */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="**********"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botão de Enviar */}
        <Button
          disabled={loading}
          className="ml-auto w-full text-white hover:bg-[#244777]"
          type="submit"
        >
          Continue
        </Button>
      </form>
    </Form>
  );
}
