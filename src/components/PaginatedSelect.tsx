import React from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { apiFetch } from '../services/api';

const loadOptions = async (inputValue: string, _loaded: any, additional: any) => {
  const page = additional.page || 1;
  const res = await apiFetch(`/api/items?page=${page}&pageSize=10&search=${encodeURIComponent(inputValue)}`);
  const data = res.data;
  return {
    options: data.items.map((i: any) => ({ value: i.id, label: i.name })),
    hasMore: page * 10 < data.totalCount,
    additional: { page: page + 1 }
  };
};

const PaginatedSelect: React.FC = () => (
  <AsyncPaginate loadOptions={loadOptions} additional={{ page: 1 }} />
);

export default PaginatedSelect;
