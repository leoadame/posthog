import { mergeAttributes, Node, NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Query } from '~/queries/Query/Query'
import { NodeKind, QuerySchema } from '~/queries/schema'
import { NodeWrapper } from 'scenes/notebooks/Nodes/NodeWrapper'
import { NotebookNodeType } from '~/types'
import { BindLogic, useValues } from 'kea'
import { insightLogic } from 'scenes/insights/insightLogic'
import { useJsonNodeState } from './utils'

const DEFAULT_QUERY: QuerySchema = {
    kind: NodeKind.DataTableNode,
    full: false,
    source: {
        kind: NodeKind.EventsQuery,
        select: ['*', 'event', 'person', 'timestamp'],
        orderBy: ['timestamp DESC'],
        after: '-24h',
        limit: 100,
    },
    expandable: false,
}

const HEIGHT = 500

const Component = (props: NodeViewProps): JSX.Element => {
    const [query, setQuery] = useJsonNodeState(props, 'query')
    const logic = insightLogic({ dashboardItemId: 'new' })
    const { insightProps } = useValues(logic)

    // We don't want to show the insights button for now
    query.showOpenEditorButton = false

    return (
        <NodeWrapper nodeType={NotebookNodeType.Query} title="Query" heightEstimate={HEIGHT} {...props}>
            <div style={{ height: HEIGHT }}>
                <BindLogic logic={insightLogic} props={insightProps}>
                    <Query query={query} setQuery={(t) => setQuery(t as any)} />
                </BindLogic>
            </div>
        </NodeWrapper>
    )
}

export const NotebookNodeQuery = Node.create({
    name: NotebookNodeType.Query,
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            query: {
                default: DEFAULT_QUERY,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: NotebookNodeType.Query,
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [NotebookNodeType.Query, mergeAttributes(HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(Component)
    },
})
