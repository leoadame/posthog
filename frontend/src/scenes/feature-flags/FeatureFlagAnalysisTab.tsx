import { BindLogic, useActions, useValues } from 'kea'
import { DashboardTemplateChooser, NewDashboardModal } from 'scenes/dashboard/NewDashboardModal'
import { DashboardsTable } from 'scenes/dashboard/dashboards/DashboardsTable'
import { dashboardsLogic } from 'scenes/dashboard/dashboards/dashboardsLogic'
import { dashboardsModel } from '~/models/dashboardsModel'
import { FeatureFlagType } from '~/types'
import { featureFlagLogic } from './featureFlagLogic'
import { LemonButton } from '@posthog/lemon-ui'
import { newDashboardLogic } from 'scenes/dashboard/newDashboardLogic'

export function AnalysisTab({ featureFlag }: { id: string; featureFlag: FeatureFlagType }): JSX.Element {
    return (
        <div className="NewDashboardModal">
            <BindLogic logic={newDashboardLogic} props={{ featureFlagId: featureFlag.id as number }}>
                {featureFlag.dashboards && featureFlag.dashboards.length > 0 ? (
                    <FeatureFlagDashboardsTableContainer />
                ) : (
                    featureFlag.id && (
                        <>
                            <DashboardTemplateChooser scope="feature_flag" />
                            <NewDashboardModal />
                        </>
                    )
                )}
            </BindLogic>
        </div>
    )
}

function FeatureFlagDashboardsTableContainer(): JSX.Element {
    const { filteredDashboards } = useValues(featureFlagLogic)
    const { showNewDashboardModal } = useActions(newDashboardLogic)

    const { dashboardsLoading } = useValues(dashboardsModel)
    const { filters } = useValues(dashboardsLogic)

    return (
        <>
            <DashboardsTable
                extraActions={
                    <div className="flex items-center gap-2">
                        <LemonButton
                            type="primary"
                            onClick={() => {
                                showNewDashboardModal()
                            }}
                        >
                            New Dashboard
                        </LemonButton>
                    </div>
                }
                hideActions={true}
                dashboards={filteredDashboards}
                dashboardsLoading={dashboardsLoading}
                filters={filters}
            />
            <NewDashboardModal />
        </>
    )
}
