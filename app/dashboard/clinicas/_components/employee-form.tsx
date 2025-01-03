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
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Definição do schema do formulário
const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome da clínica deve ter pelo menos 2 caracteres.'
  }),
  endereco: z.string().min(2, {
    message: 'Endereço é obrigatório.'
  }),
  telefone: z.string().min(10, {
    message: 'Telefone deve ter pelo menos 10 caracteres.'
  }),
  desconto: z.number().min(0, {
    message: 'Desconto não pode ser negativo.'
  }),
  planos: z.array(z.string()).min(1, {
    message: 'Pelo menos um plano precisa ser selecionado.'
  })
});

export default function ClinicForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      endereco: '',
      telefone: '',
      desconto: 0,
      planos: []
    }
  });

  const [planos, setPlanos] = React.useState([
    { id: 'plano1', nome: 'Plano Básico' },
    { id: 'plano2', nome: 'Plano Avançado' },
    { id: 'plano3', nome: 'Plano Premium' }
  ]); // Lista de planos, pode ser carregada do Firebase

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Aqui você poderia salvar as informações no Firebase
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Cadastro de Clínica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Clínica</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome da clínica"
                        {...field}
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
                      <Input
                        placeholder="Digite o endereço da clínica"
                        {...field}
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
                        placeholder="Digite o telefone da clínica"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Digite o desconto aplicado"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Cadastrar Clínica</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
