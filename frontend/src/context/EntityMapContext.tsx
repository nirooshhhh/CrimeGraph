import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEntities } from '../api';
import type { Entity } from '../types';

interface EntityMapContextValue {
  entities: Entity[];
  entityMap: Map<string, Entity>;
  getEntityName: (id?: string | null) => string;
  getEntity: (id?: string | null) => Entity | undefined;
  isLoading: boolean;
  refetchEntities: () => Promise<any>;
}

const EntityMapContext = createContext<EntityMapContextValue | undefined>(undefined);

export const EntityMapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: entities = [], isLoading, refetch } = useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities,
    staleTime: 60 * 1000,
  });

  const entityMap = useMemo(() => {
    const map = new Map<string, Entity>();
    for (const e of entities) {
      map.set(e.id, e);
    }
    return map;
  }, [entities]);

  const getEntityName = (id?: string | null): string => {
    if (!id) return 'Unknown';
    const ent = entityMap.get(id);
    return ent?.canonical_name || id.slice(0, 8) + '...';
  };

  const getEntity = (id?: string | null): Entity | undefined => {
    if (!id) return undefined;
    return entityMap.get(id);
  };

  return (
    <EntityMapContext.Provider
      value={{
        entities,
        entityMap,
        getEntityName,
        getEntity,
        isLoading,
        refetchEntities: refetch,
      }}
    >
      {children}
    </EntityMapContext.Provider>
  );
};

export const useEntityMap = (): EntityMapContextValue => {
  const ctx = useContext(EntityMapContext);
  if (!ctx) {
    throw new Error('useEntityMap must be used within an EntityMapProvider');
  }
  return ctx;
};
