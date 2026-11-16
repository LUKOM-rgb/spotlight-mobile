export type UserRole = 'utilizador' | 'artista' | 'admin';

export interface Seguidor {
  id_utilizador: number;
  id_artista?: number;
  data_inicio?: string;
}

export interface Artista {
  id_artista: number;
  numero_licenca: string;
  validade_licenca: string;
  categoria_id: number;
  Seguidors?: Seguidor[];
}

export interface Utilizador {
  id_utilizador: number;
  email: string;
  tipo: UserRole;
  data_registo: string;
  nome_utilizador: string;
  numero_telemovel?: string | null;
  id_artista?: number | null;
  Artistum?: Artista | null;
  Artista?: Artista | null;
}

export interface TopArtist {
  name: string;
  followers: number;
}

export interface Categoria {
  categoria_id: number;
  nome_categoria: string;
}

export interface Spot {
  id_spot: number;
  localizacao: string;
  longitude: number;
  latitude: number;
  abertura: string;
  fecho: string;
}

export interface Reserva {
  id_reserva: number;
  id_spot: number;
  id_artista: number;
  data_emissao?: string;
  data_evento: string;
  hora_inicio: string;
  hora_fim: string;
  spot_local?: string;
}

export type OcorrenciaEstado = 'pendente' | 'em progresso' | 'resolvida';

export interface Ocorrencia {
  id_ocorrencia: number;
  data_ocorrencia: string;
  data_envio?: string;
  hora_ocorrencia: string;
  local_ocorrencia: string;
  descricao_ocorrencia: string | null;
  estado_ocorrencia: OcorrenciaEstado;
  id_utilizador: number;
  id_spot: number;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: string | Record<string, string[] | string>;
}

export function getArtistProfile(user: Utilizador): Artista | null {
  return user.Artistum ?? user.Artista ?? null;
}

export function getArtistIdFromUser(user: Utilizador): number | null {
  return user.id_artista ?? getArtistProfile(user)?.id_artista ?? null;
}
