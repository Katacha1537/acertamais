import { auth } from '@/service/firebase'; // Importa a instância do Firebase Authentication
import { NextRequest, NextResponse } from 'next/server'; // APIs do Next.js
import { sendPasswordResetEmail } from 'firebase/auth'; // Função para enviar email de reset

export async function POST(req: NextRequest) {
  try {
    // Obtendo o corpo da requisição
    const body = await req.json();
    const { email } = body;

    // Validando se o email foi fornecido
    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido.' },
        { status: 400 }
      );
    }

    // Enviando o email de redefinição de senha
    await sendPasswordResetEmail(auth, email);

    // Resposta de sucesso
    return NextResponse.json(
      { message: 'Email de redefinição de senha enviado com sucesso.' },
      { status: 200 }
    );
  } catch (error: any) {
    // Tratamento de erros específicos do Firebase
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    } else if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'Nenhum usuário encontrado com este email.' },
        { status: 404 }
      );
    } else {
      console.error('Erro ao enviar email de redefinição:', error);
      return NextResponse.json(
        { error: 'Erro ao processar a solicitação.' },
        { status: 500 }
      );
    }
  }
}
