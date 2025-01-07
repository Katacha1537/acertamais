import { verify } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tokenUid = searchParams.get('tokenUid'); // Obtendo o CPF ou outro identificador de token dos parâmetros de consulta

  // Se o tokenUid não estiver na URL, buscamos o token no cookie
  const token = tokenUid || req.cookies.get('authToken')?.value;
  console.log(token);
  if (!token) {
    return NextResponse.json(
      { error: 'Token não fornecido.' },
      { status: 400 }
    );
  }

  try {
    const jwtSecret = process.env.SECRET_JWT;

    // Verifica se a chave secreta JWT está definida
    if (!jwtSecret) {
      console.error('SECRET_JWT não está definida no ambiente.');
      throw new Error('A variável SECRET_JWT não está definida.');
    }

    // Descriptografando o token para obter os dados do payload
    let decodedPayload;
    try {
      decodedPayload = verify(token, jwtSecret); // Verifica e decodifica o token
    } catch (verifyError) {
      console.error('Erro ao verificar o token:', verifyError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado.' },
        { status: 401 }
      );
    }

    // Retornando o payload do token JWT
    return NextResponse.json({ payload: decodedPayload });
  } catch (error) {
    console.error('Erro ao processar o token:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o token JWT.' },
      { status: 500 }
    );
  }
}
