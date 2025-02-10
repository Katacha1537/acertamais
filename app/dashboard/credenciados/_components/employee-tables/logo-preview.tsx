'use client';

// Tipagem correta para a prop `data`, que é um objeto com a chave `imagemUrl` do tipo string
export const LogoPreview = ({ data }: { data: { imagemUrl: string } }) => {
  return (
    <img
      src={data.imagemUrl}
      alt="Imagem"
      style={{
        width: '100px',
        height: '100px',
        borderRadius: '5%', // Bordas arredondadas5
      }}
    />
  );
};
