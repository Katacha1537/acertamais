'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDocumentById } from '@/hooks/useDocumentById';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import InputMask from 'react-input-mask'; // Adicionando o InputMask para CPF
import { toast } from 'sonner';

export default function EmployeeFormEdit() {
  const params = useParams(); // Captura os parâmetros da URL
  const router = useRouter();

  // Garantir que o employeeId seja uma string
  const employeeId = Array.isArray(params.employeeId)
    ? params.employeeId[0]
    : params.employeeId;

  // Estados locais para os campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [idade, setIdade] = useState(18);
  const [genero, setGenero] = useState('male');
  const [empresaId, setEmpresaId] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);

  const { data, loading: dataLoading } = useDocumentById(
    'funcionarios',
    employeeId
  );
  const { updateDocument } = useFirestore({ collectionName: 'funcionarios' });

  // Carregar os dados do funcionário
  useEffect(() => {
    if (data) {
      setNome(data.nome || '');
      setEmail(data.email || '');
      setEndereco(data.endereco || '');
      setIdade(data.idade || 18);
      setGenero(data.genero || 'male');
      setEmpresaId(data.empresaId || '');
      setCpf(data.cpf || ''); // Preenche o campo CPF
    }
  }, [data]);

  // Buscar empresas disponíveis
  const {
    documents: empresas,
    loading: empresasLoading,
    error: empresasError
  } = useFetchDocuments('empresas');

  // Função para validar os dados do formulário
  const validateForm = () => {
    if (nome.length < 2) {
      toast.error('Nome do funcionário deve ter pelo menos 2 caracteres.');
      return false;
    }
    if (!email.includes('@')) {
      toast.error('Por favor, insira um endereço de email válido.');
      return false;
    }
    if (endereco.length < 5) {
      toast.error('Endereço deve ter pelo menos 5 caracteres.');
      return false;
    }
    if (idade < 18) {
      toast.error('A idade deve ser pelo menos 18 anos.');
      return false;
    }
    if (!empresaId) {
      toast.error(
        'Por favor, selecione a empresa onde o funcionário trabalha.'
      );
      return false;
    }
    // Validação do CPF (apenas formato, sem verificação extra)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(cpf)) {
      toast.error('CPF inválido.');
      return false;
    }
    return true;
  };

  // Função de envio do formulário
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateDocument(employeeId, {
        nome,
        email,
        endereco,
        idade,
        genero,
        empresaId,
        cpf
      }); // Atualiza o funcionário no Firestore
      toast.success('Funcionário atualizado com sucesso!');
      router.push('/dashboard/funcionarios');
    } catch (error) {
      toast.error('Erro ao atualizar o funcionário.');
    } finally {
      setLoading(false);
    }
  };

  if (empresasLoading || dataLoading) return <div>Carregando...</div>;
  if (empresasError) return <div>{empresasError}</div>;

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Funcionário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Nome do Funcionário */}
            <div className="form-item">
              <label htmlFor="nome">Nome do Funcionário</label>
              <Input
                id="nome"
                placeholder="Digite o nome do funcionário"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            {/* Email do Funcionário */}
            <div className="form-item">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="Digite o email do funcionário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* CPF do Funcionário */}
            <div className="form-item">
              <label htmlFor="cpf">CPF</label>
              <InputMask
                mask="999.999.999-99"
                placeholder="Digite o CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              >
                {(inputProps) => <Input {...inputProps} />}
              </InputMask>
            </div>

            {/* Endereço do Funcionário */}
            <div className="form-item">
              <label htmlFor="endereco">Endereço</label>
              <Input
                id="endereco"
                placeholder="Digite o endereço do funcionário"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>

            {/* Idade do Funcionário */}
            <div className="form-item">
              <label htmlFor="idade">Idade</label>
              <Input
                id="idade"
                type="number"
                placeholder="Digite a idade do funcionário"
                value={idade}
                onChange={(e) => setIdade(Number(e.target.value))}
              />
            </div>

            {/* Gênero do Funcionário */}
            <div className="form-item">
              <label>Gênero</label>
              <div className="flex space-x-4">
                <label>
                  <input
                    type="radio"
                    value="male"
                    checked={genero === 'male'}
                    onChange={() => setGenero('male')}
                  />
                  Masculino
                </label>
                <label>
                  <input
                    type="radio"
                    value="female"
                    checked={genero === 'female'}
                    onChange={() => setGenero('female')}
                  />
                  Feminino
                </label>
                <label>
                  <input
                    type="radio"
                    value="other"
                    checked={genero === 'other'}
                    onChange={() => setGenero('other')}
                  />
                  Outro
                </label>
              </div>
            </div>

            {/* Empresa onde o Funcionário Trabalha */}
            <div className="form-item">
              <label htmlFor="empresaId">Empresa</label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button disabled={loading} type="submit">
            {loading ? 'Atualizando Funcionário...' : 'Atualizar Funcionário'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
