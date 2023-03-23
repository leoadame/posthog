import './Seekbar.scss'
import { useEffect, useRef, useState } from 'react'
import { useActions, useValues } from 'kea'
import clsx from 'clsx'
import { seekbarLogic } from 'scenes/session-recordings/player/seekbarLogic'
import { RecordingSegment } from '~/types'
import { sessionRecordingDataLogic } from './core/sessionRecordingDataLogic'
import { SessionRecordingPlayerLogicProps } from './core/sessionRecordingPlayerLogic'
import { Timestamp } from './PlayerControllerTime'
import { colonDelimitedDuration } from 'lib/utils'

function PlayerSeekbarInspector({ minMs, maxMs }: { minMs: number; maxMs: number }): JSX.Element {
    const [percentage, setPercentage] = useState<number>(0)
    const ref = useRef<HTMLDivElement>(null)
    const fixedUnits = maxMs / 1000 > 3600 ? 3 : 2
    const content = colonDelimitedDuration(minMs / 1000 + ((maxMs - minMs) / 1000) * percentage, fixedUnits)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent): void => {
            const rect = ref.current?.getBoundingClientRect()

            if (!rect) {
                return
            }
            const relativeX = e.clientX - rect.x
            const newPercentage = Math.max(Math.min(relativeX / rect.width, 1), 0)

            if (newPercentage !== percentage) {
                setPercentage(newPercentage)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div className="PlayerSeekBarInspector" ref={ref}>
            <div
                className="PlayerSeekBarInspector__tooltip"
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                    transform: `translateX(${percentage * 100}%)`,
                }}
            >
                <div className="PlayerSeekBarInspector__tooltip__content">{content}</div>
            </div>
        </div>
    )
}

export function Seekbar(props: SessionRecordingPlayerLogicProps): JSX.Element {
    const sliderRef = useRef<HTMLDivElement | null>(null)
    const thumbRef = useRef<HTMLDivElement | null>(null)
    const { handleDown, setSlider, setThumb } = useActions(seekbarLogic(props))
    const { sessionPlayerData } = useValues(sessionRecordingDataLogic(props))
    const { thumbLeftPos, bufferPercent, isScrubbing } = useValues(seekbarLogic(props))

    // Workaround: Something with component and logic mount timing that causes slider and thumb
    // reducers to be undefined.
    useEffect(() => {
        if (sliderRef.current && thumbRef.current) {
            setSlider(sliderRef)
            setThumb(thumbRef)
        }
    }, [sliderRef.current, thumbRef.current, props.sessionRecordingId])

    return (
        <div className="flex items-center h-8" data-attr="rrweb-controller">
            <Timestamp {...props} />
            <div className={clsx('PlayerSeekbar', { 'PlayerSeekbar--scrubbing': isScrubbing })}>
                <div
                    className="PlayerSeekbar__slider"
                    ref={sliderRef}
                    onMouseDown={handleDown}
                    onTouchStart={handleDown}
                >
                    <div className="PlayerSeekbar__segments">
                        {sessionPlayerData?.segments?.map((segment: RecordingSegment) => (
                            <div
                                key={`${segment.windowId}-${segment.startTimeEpochMs}`}
                                className={clsx(
                                    'PlayerSeekbar__segments__item',
                                    segment.isActive && 'PlayerSeekbar__segments__item--active'
                                )}
                                title={!segment.isActive ? 'Inactive period' : 'Active period'}
                                // eslint-disable-next-line react/forbid-dom-props
                                style={{
                                    width: `${
                                        sessionPlayerData.recordingDurationMs
                                            ? (100 * segment.durationMs) / sessionPlayerData.recordingDurationMs
                                            : '100'
                                    }%`,
                                }}
                            />
                        ))}
                    </div>

                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div className="PlayerSeekbar__currentbar" style={{ width: `${Math.max(thumbLeftPos, 0)}px` }} />
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div className="PlayerSeekbar__bufferbar" style={{ width: `${bufferPercent}%` }} />
                    <div
                        className="PlayerSeekbar__thumb"
                        ref={thumbRef}
                        // eslint-disable-next-line react/forbid-dom-props
                        style={{ transform: `translateX(${thumbLeftPos}px)` }}
                    />

                    <PlayerSeekbarInspector minMs={0} maxMs={sessionPlayerData.recordingDurationMs ?? 0} />
                </div>
            </div>
        </div>
    )
}
