import React from 'react'
import { NotebookNodeType } from '../Nodes/types'
import { useKeyHeld } from 'lib/hooks/useKeyHeld'
import './DraggableToNotebook.scss'
import { useActions } from 'kea'
import { notebookSidebarLogic } from '../Notebook/notebookSidebarLogic'
import clsx from 'clsx'
import { FlaggedFeature } from 'lib/components/FlaggedFeature'
import { FEATURE_FLAGS } from 'lib/constants'

export type DraggableToNotebookProps = {
    href?: string
    node?: NotebookNodeType
    properties?: Record<string, any>
    children: React.ReactNode
    alwaysDraggable?: boolean
    noOverflow?: boolean
    className?: string
}

export function DraggableToNotebook({
    children,
    node,
    properties,
    href,
    alwaysDraggable,
    noOverflow,
    className,
}: DraggableToNotebookProps): JSX.Element {
    const { setNotebookSideBarShown } = useActions(notebookSidebarLogic)
    const keyHeld = useKeyHeld('Alt')

    if (!node && !properties && !href) {
        return <>{children}</>
    }

    const draggable = alwaysDraggable || keyHeld

    return (
        <>
            <FlaggedFeature flag={FEATURE_FLAGS.NOTEBOOKS} match={false}>
                {children}
            </FlaggedFeature>
            <FlaggedFeature flag={FEATURE_FLAGS.NOTEBOOKS} match>
                <span
                    className={clsx('DraggableToNotebook', className, noOverflow && 'DraggableToNotebook--no-overflow')}
                    draggable={draggable}
                    onDragStart={
                        draggable
                            ? (e: any) => {
                                  if (href) {
                                      const url = window.location.origin + href
                                      e.dataTransfer.setData('text/uri-list', url)
                                      e.dataTransfer.setData('text/plain', url)
                                  }
                                  node && e.dataTransfer.setData('node', node)
                                  properties && e.dataTransfer.setData('properties', JSON.stringify(properties))
                                  setNotebookSideBarShown(true)
                              }
                            : undefined
                    }
                >
                    {keyHeld ? (
                        <div className="DraggableToNotebook__indicator">
                            <div className="DraggableToNotebook__indicator__text">Drag to notebook</div>
                        </div>
                    ) : null}
                    {children}
                </span>
            </FlaggedFeature>
        </>
    )
}
