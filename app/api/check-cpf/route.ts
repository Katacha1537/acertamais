import { db } from '@/service/firebase'; // A instância do Firestore
import { NextRequest, NextResponse } from 'next/server'; // Usando as novas APIs do Next.js
import { collection, query, where, getDocs } from 'firebase/firestore'; // Funções necessárias para consultas

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cpf = searchParams.get('cpf'); // Obtendo o CPF dos parâmetros de consulta

  if (!cpf) {
    return NextResponse.json({ error: 'CPF não fornecido.' }, { status: 400 });
  }

  try {
    // Criando a referência para a coleção 'funcionarios'
    const q = query(collection(db, 'funcionarios'), where('cpf', '==', cpf));

    // Executando a consulta
    const snapshot = await getDocs(q);

    // Verificando se o CPF foi encontrado
    return NextResponse.json({ exists: !snapshot.empty });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao acessar o Firestore.' },
      { status: 500 }
    );
  }
}
