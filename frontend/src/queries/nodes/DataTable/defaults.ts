import { DataNode, DataTableColumn, NodeKind } from '~/queries/schema'

export const defaultDataTableEventColumns: DataTableColumn[] = [
    'event',
    'person',
    'url',
    'properties.$lib',
    'timestamp',
]

export const defaultDataTablePersonColumns: DataTableColumn[] = [
    'person',
    'id',
    'created_at',
    'properties.$geoip_country_name',
    'properties.$browser',
]

export function defaultDataTableColumns(query: DataNode): DataTableColumn[] {
    return query.kind === NodeKind.PersonsNode ? defaultDataTablePersonColumns : defaultDataTableEventColumns
}
