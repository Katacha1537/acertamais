import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/service/firebase';
import Compressor from 'compressorjs';

interface UseUploadImageResponse {
  isUploading: boolean;
  progress: number;
  url: string | null;
  error: string | null;
  uploadImage: (file: File, path: string, name: string) => Promise<string | null>;
}

const useUploadImage = (): UseUploadImageResponse => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = (file: File, path: string, name: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      // Validações iniciais
      if (!file) {
        reject('Nenhum arquivo fornecido.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject('Apenas arquivos de imagem são permitidos.');
        return;
      }

      setIsUploading(true);
      setProgress(0);
      setUrl(null);
      setError(null);

      // Configurações de compressão
      new Compressor(file, {
        quality: 0.6,
        mimeType: 'image/webp',
        convertSize: 1000000,
        success: (compressedFile) => {
          // Cria o arquivo WebP
          const webpFileName = `${name}.webp`;
          const webpFile = new File([compressedFile], webpFileName, {
            type: 'image/webp',
          });

          // Configuração do Firebase
          const fileName = `${path}/${webpFileName}`;
          const storageRef = ref(storage, fileName);
          const uploadTask = uploadBytesResumable(storageRef, webpFile);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(prog);
            },
            (error) => {
              setError('Erro ao fazer upload da imagem.');
              setIsUploading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setUrl(downloadURL);
                setIsUploading(false);
                resolve(downloadURL);
              } catch (error) {
                setError('Erro ao obter o URL da imagem.');
                setIsUploading(false);
                reject(error);
              }
            }
          );
        },
        error: (error) => {
          setError('Falha ao processar a imagem.');
          setIsUploading(false);
          reject(error);
        },
      });
    });
  };

  return {
    isUploading,
    progress,
    url,
    error,
    uploadImage,
  };
};

export default useUploadImage;