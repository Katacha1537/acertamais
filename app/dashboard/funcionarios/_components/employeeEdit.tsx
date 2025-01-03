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
import * as z from 'zod';

// Schema de validação semelhante ao do formulário de criação
const formSchema = z.object({
  nome: z
    .string()
    .min(2, {
      message: 'Nome do funcionário deve ter pelo menos 2 caracteres.'
    }),
  dataNascimento: z
    .string()
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      'Data de nascimento inválida. Use o formato DD/MM/AAAA.'
    ),
  endereco: z
    .string()
    .min(5, { message: 'Endereço deve ter pelo menos 5 caracteres.' }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido.'),
  email: z
    .string()
    .email({ message: 'Por favor, insira um endereço de email válido.' }),
  telefone: z
    .string()
    .regex(
      /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      'Telefone inválido. Use o formato (XX) XXXXX-XXXX.'
    ),
  pessoasNaCasa: z
    .string()
    .optional()
    .refine(
      (val) => (val ? !isNaN(Number(val)) : true),
      'O número de pessoas na casa deve ser um número.'
    ),
  empresaId: z.string().min(1, { message: 'Por favor, selecione a empresa.' })
});

export default function EmployeeFormEdit() {
  const params = useParams();
  const router = useRouter();
  const employeeId = Array.isArray(params.employeeId)
    ? params.employeeId[0]
    : params.employeeId;

  // Carregar os dados do funcionário
  const { data, loading: dataLoading } = useDocumentById(
    'funcionarios',
    employeeId
  );
  const { documents: empresas, loading: empresasLoading } =
    useFetchDocuments('empresas');
  const { updateDocument } = useFirestore({ collectionName: 'funcionarios' });

  const [loading, setLoading] = useState(false);

  // Definir os valores iniciais no formulário com base nos dados do funcionário
  const [formValues, setFormValues] = useState({
    nome: '',
    dataNascimento: '',
    endereco: '',
    cpf: '',
    email: '',
    telefone: '',
    pessoasNaCasa: '',
    empresaId: ''
  });

  useEffect(() => {
    if (data) {
      setFormValues({
        nome: data.nome || '',
        dataNascimento: data.dataNascimento || '',
        endereco: data.endereco || '',
        cpf: data.cpf || '',
        email: data.email || '',
        telefone: data.telefone || '',
        pessoasNaCasa: data.pessoasNaCasa || '',
        empresaId: data.empresaId || ''
      });
    }
  }, [data]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    try {
      formSchema.parse(formValues); // Utilizando Zod para validar os dados
      return true;
    } catch (error) {
      toast.error('error.errors[0].message'); // Exibe o erro de validação
      return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await updateDocument(employeeId, formValues);
      toast.success('Funcionário atualizado com sucesso!');
      router.push('/dashboard/funcionarios');
    } catch (error) {
      toast.error('Erro ao atualizar o funcionário.');
    } finally {
      setLoading(false);
    }
  };

  if (empresasLoading || dataLoading) return <div>Carregando...</div>;

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
            {/* Nome */}
            <div className="form-item">
              <label htmlFor="nome">Nome do Funcionário</label>
              <Input
                id="nome"
                name="nome"
                placeholder="Digite o nome do funcionário"
                value={formValues.nome}
                onChange={handleInputChange}
              />
            </div>

            {/* Data de Nascimento */}
            <div className="form-item">
              <label htmlFor="dataNascimento">Data de Nascimento</label>
              <InputMask
                mask="99/99/9999"
                placeholder="Digite a data de nascimento"
                value={formValues.dataNascimento}
                onChange={handleInputChange}
              >
                {(inputProps) => (
                  <Input {...inputProps} name="dataNascimento" />
                )}
              </InputMask>
            </div>

            {/* Endereço */}
            <div className="form-item">
              <label htmlFor="endereco">Endereço Completo</label>
              <Input
                id="endereco"
                name="endereco"
                placeholder="Digite o endereço completo"
                value={formValues.endereco}
                onChange={handleInputChange}
              />
            </div>

            {/* CPF */}
            <div className="form-item">
              <label htmlFor="cpf">CPF</label>
              <InputMask
                mask="999.999.999-99"
                placeholder="Digite o CPF"
                value={formValues.cpf}
                onChange={handleInputChange}
              >
                {(inputProps) => <Input {...inputProps} name="cpf" />}
              </InputMask>
            </div>

            {/* Email */}
            <div className="form-item">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Digite o email"
                value={formValues.email}
                onChange={handleInputChange}
              />
            </div>

            {/* Telefone */}
            <div className="form-item">
              <label htmlFor="telefone">Telefone</label>
              <InputMask
                mask="(99) 99999-9999"
                placeholder="Digite o telefone"
                value={formValues.telefone}
                onChange={handleInputChange}
              >
                {(inputProps) => <Input {...inputProps} name="telefone" />}
              </InputMask>
            </div>

            {/* Pessoas na Casa */}
            <div className="form-item">
              <label htmlFor="pessoasNaCasa">
                Quantas pessoas moram na casa?
              </label>
              <Input
                id="pessoasNaCasa"
                name="pessoasNaCasa"
                placeholder="Digite o número"
                value={formValues.pessoasNaCasa}
                onChange={handleInputChange}
              />
            </div>

            {/* Empresa */}
            <div className="form-item">
              <label htmlFor="empresaId">Empresa</label>
              <Select
                value={formValues.empresaId}
                onValueChange={(value) =>
                  setFormValues({ ...formValues, empresaId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nomeFantasia}
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
