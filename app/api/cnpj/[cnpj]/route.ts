// app/api/cnpj/[cnpj].ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cnpj: string } }
) {
  const { cnpj } = params;

  try {
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cnpj}`
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao consultar CNPJ' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar CNPJ' },
      { status: 500 }
    );
  }
}
