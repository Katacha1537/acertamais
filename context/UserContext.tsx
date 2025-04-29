import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react';

interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string | null;
  role:
    | 'business'
    | 'employee'
    | 'accredited'
    | 'admin'
    | 'accrediting'
    | 'user'; // Tipando o role
  credenciado_Id?: string;
}

// Estrutura da resposta da API, com o campo 'payload' que contém os dados do usuário
interface UserResponse {
  payload: User;
}

interface UserContextProps {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: Dispatch<SetStateAction<User | null>>; // Adicionando setUser aqui
}

const UserContext = createContext<UserContextProps>({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: () => {} // Função vazia por padrão
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/data-user');

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do usuário');
        }

        // Converter a resposta para JSON
        const data: UserResponse = await response.json();

        // Acessando o payload corretamente
        if (!data.payload) {
          throw new Error('Falha ao salvar o token no servidor.');
        }
        setUser(data.payload);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
