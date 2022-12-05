import { DataTableNode, NodeKind } from '~/queries/schema'
import { PropertyFilterType, PropertyOperator } from '~/types'
import { defaultDataTablePersonColumns } from '~/queries/nodes/DataTable/defaults'

const AllDefaults: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: { kind: NodeKind.EventsNode },
}

const Minimalist: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: { kind: NodeKind.EventsNode },
    showActions: false,
    expandable: false,
}

const ManyColumns: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: { kind: NodeKind.EventsNode },
    columns: [
        'id',
        'event',
        'timestamp',
        'url',
        'person',
        'properties.$current_url',
        'properties.$browser',
        'properties.$browser_version',
        'properties.$lib',
        'person.properties.email',
    ],
}

const ShowFilters: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: {
        kind: NodeKind.EventsNode,
        properties: [
            {
                key: '$browser',
                value: ['Chrome'],
                operator: PropertyOperator.Exact,
                type: PropertyFilterType.Event,
            },
        ],
        event: '',
        limit: 100,
    },
    columns: ['event', 'person', 'properties.$lib', 'person.properties.email'],
    showSearch: true,
    showPropertyFilter: true,
}

const ShowTools: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: { kind: NodeKind.EventsNode },
    columns: ['event', 'person', 'properties.$lib', 'person.properties.email'],
    showExport: true,
    showReload: true,
    showColumnConfigurator: true,
}

const ShowAllTheThings: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: {
        kind: NodeKind.EventsNode,
        properties: [
            {
                key: '$browser',
                value: ['Chrome'],
                operator: PropertyOperator.Exact,
                type: PropertyFilterType.Event,
            },
        ],
        event: '',
        limit: 100,
    },
    columns: ['event', 'person', 'properties.$lib', 'person.properties.email'],
    showExport: true,
    showReload: true,
    showColumnConfigurator: true,
    showSearch: true,
    showPropertyFilter: true,
    showEventsBufferWarning: true,
}

const Persons: DataTableNode = {
    kind: NodeKind.DataTableNode,
    source: { kind: NodeKind.PersonsNode },
    columns: defaultDataTablePersonColumns,
    showSearch: true,
    showPropertyFilter: true,
    showExport: true,
    showReload: true,
}

export const examples = { AllDefaults, Minimalist, ManyColumns, ShowFilters, ShowTools, ShowAllTheThings, Persons }
