export interface Pagination<T> {
  items: T[]; // los elementos de la página actual
  total: number; // total de registros en la base de datos
  page: number; // número de página actual
  limit: number; // cantidad de elementos por página
  totalPages: number; // cantidad total de páginas
}
