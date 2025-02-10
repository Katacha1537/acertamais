import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Cria uma resposta para "remover" o cookie
    const response = NextResponse.json({
      message: 'Logout realizado com sucesso!'
    });

    // Define o cookie 'authToken' com uma data de expiração no passado
    response.cookies.set('authToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0), // A data de expiração é o passado, o que elimina o cookie
      sameSite: 'strict'
    });

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Erro ao realizar o logout.' },
      { status: 500 }
    );
  }
}
