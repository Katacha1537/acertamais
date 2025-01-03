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
    .min(8, { message: 'Senha precisa ter pelo menos 8 caracteres.' })
});

type UserFormValue = z.infer<typeof formSchema>;

interface UserDocument {
  id: string;
  email: string;
  role: string;
  [key: string]: any; // Ajuste conforme a estrutura do seu documento
}

export default function UserAuthForm() {
  const [userData, setUserData] = useState<UserDocument | null>(null); // Armazenar os dados do usuário
  const [loading, setLoading] = useState(false);
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema)
  });
  const router = useRouter();

  // Função para buscar dados do usuário com base no email
  const fetchUserData = async (email: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'funcionarios'),
        where('email', '==', email)
      ); // Corrigido para 'email' como string
      const querySnapshot = await getDocs(q);

      // Mapeamento para preencher corretamente as propriedades
      const userDocs: UserDocument[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email, // Garantir que o campo 'email' exista
        role: doc.data().role, // Garantir que o campo 'role' exista
        ...doc.data() // Incluir outras propriedades do documento
      }));

      if (userDocs.length > 0) {
        setUserData(userDocs[0]);
      } else {
        setUserData(null); // Se não encontrar o usuário, limpa o estado
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      toast.error('Erro ao buscar dados do usuário.');
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Lógica para verificar quando o campo de email perde o foco (onBlur)
  const handleEmailBlur = () => {
    const email = form.watch('email');
    if (email) {
      fetchUserData(email); // Busca os dados do usuário assim que o email perde o foco
    }
  };

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      // Verifique se userData foi carregado e se contém dados
      if (!userData) {
        toast.error('Usuário não encontrado.');
        return;
      }

      // Verifique o papel do usuário
      if (userData.role === 'user') {
        toast.error(
          'Usuário não pode realizar o login. Você tem um papel de usuário.'
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
        displayName: user.displayName || '',
        photoURL: user.photoURL || ''
      };

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

      // Redireciona para a página de dashboard
      router.push('/dashboard/overview');
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
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
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
                    onBlur={handleEmailBlur} // Adiciona a lógica de busca ao sair do foco
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
    </>
  );
}
