'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import { useDocumentById } from '@/hooks/useDocumentById';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import useUploadImage from '@/hooks/useUploadImage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Funções de Máscara
function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
}

function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{2})$/, '$1-$2')
    .substring(0, 18);
}

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{2})$/, '$1-$2')
    .substring(0, 14);
}

function maskCEI(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{5})(\d{2})$/, '$1/$2')
    .substring(0, 15);
}

function maskCAEPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{3})$/, '$1-$2')
    .substring(0, 14);
}

function maskTelefone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    .substring(0, 15);
}

// Funções de Validação
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.charAt(i - 1)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.charAt(i - 1)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

// Schema de Validação com Zod
const formSchema = z
  .object({
    tipoPessoa: z.enum(['PJ', 'PF'], {
      required_error: 'Selecione o tipo de pessoa.'
    }),
    razaoSocial: z
      .string()
      .min(2, { message: 'Razão Social deve ter pelo menos 2 caracteres.' })
      .optional(),
    nomeFantasia: z
      .string()
      .min(2, { message: 'Nome Fantasia deve ter pelo menos 2 caracteres.' }),
    emailAcess: z.string().email({ message: 'Email inválido.' }),
    cnpj: z
      .string()
      .optional()
      .refine((value) => !value || isValidCNPJ(value), {
        message: 'CNPJ inválido ou fictício.'
      }),
    cpf: z
      .string()
      .optional()
      .refine((value) => !value || isValidCPF(value), {
        message: 'CPF inválido ou fictício.'
      }),
    cei: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{2}\.\d{3}\.\d{5}\/\d{2}$/.test(value), {
        message: 'CEI deve ter o formato correto (XX.XXX.XXXXX/XX).'
      }),
    caepf: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{3}\.\d{3}\.\d{3}-\d{3}$/.test(value), {
        message: 'CAEPF deve ter o formato correto (XXX.XXX.XXX-XXX).'
      }),
    documentoTipo: z.enum(['CPF', 'CEI', 'CAEPF', '']).optional(),
    endereco: z
      .string()
      .min(5, { message: 'Endereço deve ter pelo menos 5 caracteres.' }),
    cep: z.string().regex(/^\d{5}-\d{3}$/, {
      message: 'CEP deve ter o formato correto (XXXXX-XXX).'
    }),
    telefone: z
      .string()
      .min(13, { message: 'Telefone deve ter pelo menos 10 caracteres.' }),
    contatoRH: z
      .object({
        nome: z.string().min(2, {
          message: 'Nome do contato deve ter pelo menos 2 caracteres.'
        }),
        email: z.string().email({ message: 'Email inválido.' }),
        telefone: z
          .string()
          .min(13, { message: 'Telefone deve ter pelo menos 13 caracteres.' })
      })
      .optional(),
    segmento: z.string().min(1, { message: 'Selecione um segmento.' }),
    imagem: z
      .instanceof(File)
      .refine((file) => file.type.startsWith('image/'), {
        message: 'Apenas imagens são permitidas.'
      })
      .optional(),
    accrediting_name: z.string().optional(),
    accrediting_Id: z.string().optional(),
    planos: z.string().min(1, { message: 'Selecione um plano.' })
  })
  .refine(
    (data) => {
      if (data.tipoPessoa === 'PJ') {
        return !!data.cnpj;
      } else if (data.tipoPessoa === 'PF') {
        return (data.cpf || data.cei || data.caepf) && !!data.documentoTipo;
      }
      return false;
    },
    {
      message: 'Preencha os dados corretamente conforme o tipo de pessoa.',
      path: ['documentoTipo']
    }
  );

export default function CredenciadoFormEdit() {
  const params = useParams();
  const router = useRouter();
  const credenciadoId = Array.isArray(params.credenciadoId)
    ? params.credenciadoId[0]
    : params.credenciadoId;

  const { data, loading: dataLoading } = useDocumentById(
    'credenciados',
    credenciadoId
  );
  const { user } = useUser();
  const { updateDocument, loading } = useFirestore({
    collectionName: 'credenciados',
    onSuccess: () => {
      toast.success('Credenciado atualizado com sucesso!');
      router.push('/dashboard/credenciados');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o credenciado.');
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipoPessoa: 'PJ',
      razaoSocial: '',
      nomeFantasia: '',
      emailAcess: '',
      cnpj: '',
      cpf: '',
      cei: '',
      caepf: '',
      documentoTipo: '',
      endereco: '',
      cep: '',
      telefone: '',
      contatoRH: { nome: '', email: '', telefone: '' },
      segmento: '',
      imagem: undefined,
      accrediting_name: '',
      accrediting_Id: '',
      planos: ''
    }
  });

  const tipoPessoa = form.watch('tipoPessoa');
  const documentoTipo = form.watch('documentoTipo');
  const errors = form.formState.errors;

  const { isUploading, progress, uploadImage } = useUploadImage();
  const { documents: accreditors, loading: accreditorsLoading } =
    useFetchDocuments('credenciadoras');
  const { documents: planos, loading: plansLoading } =
    useFetchDocuments('planos');
  const { documents: segmentos } = useFetchDocuments('segmentos');

  const [filteredPlans, setFilteredPlans] = useState(planos);
  const [selectedAccreditor, setSelectedAccreditor] = useState<string | null>(
    null
  );
  const [isAccreditorActive, setIsAccreditorActive] = useState<boolean>(true);

  useEffect(() => {
    if (data) {
      form.reset({
        tipoPessoa: data.tipoPessoa || 'PJ',
        razaoSocial: data.razaoSocial || '',
        nomeFantasia: data.nomeFantasia || '',
        emailAcess: data.emailAcess || '',
        cnpj: data.cnpj || '',
        cpf: data.cpf || '',
        cei: data.cei || '',
        caepf: data.caepf || '',
        documentoTipo: data.documentoTipo || '',
        endereco: data.endereco || '',
        cep: data.cep || '',
        telefone: data.telefone || '',
        contatoRH: data.contatoRH || { nome: '', email: '', telefone: '' },
        segmento: data.segmento || '',
        imagem: undefined,
        accrediting_name: data.accrediting_name || '',
        accrediting_Id: data.accrediting_Id || '',
        planos: data.planos || ''
      });
      setSelectedAccreditor(data.accrediting_Id || null);
      form.trigger(); // Trigger validation after reset
    }
  }, [data, form]);

  useEffect(() => {
    if (user?.role === 'accrediting') {
      const filtered = planos?.filter(
        (plan) => plan.accrediting_Id === user?.uid
      );
      setFilteredPlans(filtered || []);
      setIsAccreditorActive(false);
    } else if (selectedAccreditor) {
      const filtered = planos?.filter(
        (plan) => plan.accrediting_Id === selectedAccreditor
      );
      setFilteredPlans(filtered || []);
      setIsAccreditorActive(false);
      if (filtered.length === 0) setIsAccreditorActive(true);
    } else {
      setFilteredPlans([]);
      setIsAccreditorActive(true);
    }
  }, [selectedAccreditor, planos, user?.role, user?.uid]);

  const isFormValid = useMemo(() => {
    return form.formState.isValid;
  }, [form.formState.isValid]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isFormValid) {
      toast.error('Por favor, corrija os erros no formulário.');
      return;
    }

    console.log(values);

    try {
      let imageUrl = data?.imagemUrl || null;

      if (values.imagem) {
        const docId =
          values.tipoPessoa === 'PJ'
            ? values.cnpj
            : values.cpf || values.cei || values.caepf;
        imageUrl = await uploadImage(
          values.imagem,
          'credenciados',
          docId!.replace(/\D/g, '')
        );
        if (!imageUrl) {
          toast.error('Erro ao fazer upload da imagem');
          return;
        }
      }

      const updatedData = {
        ...values,
        imagemUrl: imageUrl,
        accrediting_Id:
          user?.role === 'accrediting'
            ? user?.uid
            : user?.role === 'adminAccrediting'
            ? user?.donoId
            : values.accrediting_Id,
        accrediting_name:
          user?.role === 'accrediting'
            ? user?.displayName || null
            : values.accrediting_name,
        updatedAt: new Date().toISOString()
      };

      delete updatedData.imagem;

      await updateDocument(credenciadoId, updatedData);
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      toast.error('Ocorreu um erro inesperado');
    }
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Credenciado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tipoPessoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pessoa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                        <SelectItem value="PF">
                          Pessoa Física/Autônomo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Empresa</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          field.onChange(
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    {data?.imagemUrl && !field.value && (
                      <div className="mt-2">
                        <img
                          src={data.imagemUrl}
                          alt="Logo atual"
                          className="h-32 w-32 object-cover"
                        />
                      </div>
                    )}
                    {field.value && field.value instanceof File && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(field.value)}
                          alt="Nova imagem selecionada"
                          className="h-32 w-32 object-cover"
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {tipoPessoa === 'PJ' && (
                <>
                  <FormField
                    control={form.control}
                    name="razaoSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite a razão social"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o CNPJ"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(maskCNPJ(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {tipoPessoa === 'PF' && (
                <>
                  <FormField
                    control={form.control}
                    name="documentoTipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CEI">CEI</SelectItem>
                            <SelectItem value="CAEPF">CAEPF</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {documentoTipo === 'CPF' && (
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o CPF"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(maskCPF(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {documentoTipo === 'CEI' && (
                    <FormField
                      control={form.control}
                      name="cei"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEI</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o CEI"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(maskCEI(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {documentoTipo === 'CAEPF' && (
                    <FormField
                      control={form.control}
                      name="caepf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAEPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o CAEPF"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(maskCAEPF(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tipoPessoa === 'PJ' ? 'Nome Fantasia' : 'Nome'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          tipoPessoa === 'PJ'
                            ? 'Digite o nome fantasia'
                            : 'Digite seu nome'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailAcess"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Acesso</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o email de acesso"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o endereço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o CEP"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskCEP(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o telefone"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskTelefone(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipoPessoa === 'PJ' && (
                <>
                  <FormField
                    control={form.control}
                    name="contatoRH.nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato RH</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome do contato"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contatoRH.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Contato RH</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o email do contato"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contatoRH.telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Contato RH</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o telefone do contato"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(maskTelefone(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="segmento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o segmento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {segmentos.map((segmento) => (
                          <SelectItem key={segmento.id} value={segmento.id}>
                            {segmento.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {user?.role === 'accrediting' ? (
                <FormField
                  control={form.control}
                  name="accrediting_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nome do Credenciadora - {user?.displayName || ''}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          defaultValue={user?.displayName || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="accrediting_Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Credenciadora</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedAccreditor(value);
                            const selectedAccreditorData = accreditors.find(
                              (acc) => acc.id === value
                            );
                            form.setValue(
                              'accrediting_name',
                              selectedAccreditorData?.nomeFantasia || ''
                            );
                          }}
                          value={field.value}
                          disabled={accreditorsLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma credenciadora" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {accreditors?.map((accreditor) => (
                                <SelectItem
                                  key={accreditor.id}
                                  value={accreditor.id}
                                >
                                  {accreditor.nomeFantasia}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="planos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planos</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isAccreditorActive || plansLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredPlans?.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.nome} - {doc.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isUploading && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enviando imagem...
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {Object.keys(errors).length > 0 && (
              <div className="mt-4 text-sm text-red-600">
                <p className="font-semibold">Erros no formulário:</p>
                <ul className="list-disc pl-5">
                  {Object.entries(errors).map(([key, error]) => (
                    <li key={key}>
                      {key}: {error?.message || 'Campo inválido'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              disabled={dataLoading || loading || isUploading || !isFormValid}
              type="submit"
            >
              {loading
                ? `Atualizando credenciado - ${progress}%`
                : 'Atualizar Credenciado'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
