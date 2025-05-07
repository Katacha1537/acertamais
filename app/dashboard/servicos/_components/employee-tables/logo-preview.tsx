'use client';

// Tipagem para a prop `data`, que contém a chave `imagemUrl` do tipo string
export const LogoPreview = ({
  imagemUrl
}: {
  imagemUrl: string | undefined;
}) => {
  return (
    <img
      src={imagemUrl}
      alt="Imagem"
      style={{
        maxWidth: '100px',
        maxHeight: '100px',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain', // Mantém a proporção da imagem sem distorção
        borderRadius: '5%', // Bordas arredondadas
        border: '1px solid #e5e7eb', // Borda sutil para destaque (opcional)
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' // Sombra leve para profundidade (opcional)
      }}
    />
  );
};
