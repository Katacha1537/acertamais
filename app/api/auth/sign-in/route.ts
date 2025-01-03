import { sign } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Configuração do tempo de expiração do cookie (opcional)
const COOKIE_EXPIRATION = 60 * 60 * 24 * 30; // 30 dias em segundos

export async function POST(req: NextRequest) {
  try {
    const { payload } = await req.json();

    if (!payload) {
      return NextResponse.json(
        { error: 'payload é obrigatório.' },
        { status: 400 }
      );
    }

    const jwtSecret = process.env.SECRET_JWT;

    if (!jwtSecret) {
      console.log('SECRET_JWT:', jwtSecret); // Verifica o valor da variável
      throw new Error('A variável SECRET_JWT não está definida.');
    }

    const token = sign(payload, jwtSecret, { expiresIn: '30d' });
    // Define o cookie na resposta
    const response = NextResponse.json({
      message: 'Token salvo com sucesso!',
      token
    });
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_EXPIRATION,
      sameSite: 'strict'
    });

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Erro ao salvar o token.' },
      { status: 500 }
    );
  }
}
