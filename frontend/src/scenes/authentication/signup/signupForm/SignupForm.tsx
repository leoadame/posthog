import { useEffect, useState } from 'react'
import { Link } from 'lib/components/Link'
import { useActions, useValues } from 'kea'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { signupLogic } from './signupLogic'
import { userLogic } from '../../../userLogic'
import { SceneExport } from 'scenes/sceneTypes'
import { LemonButton } from '@posthog/lemon-ui'
import { AlertMessage } from 'lib/components/AlertMessage'
import { IconArrowLeft } from 'lib/components/icons'
import { SpinnerOverlay } from 'lib/components/Spinner/Spinner'
import { SignupPanel1 } from './panels/SignupPanel1'
import { SignupPanel2 } from './panels/SignupPanel2'

export const scene: SceneExport = {
    component: SignupForm,
    logic: signupLogic,
}

export function SignupForm(): JSX.Element | null {
    const { preflight } = useValues(preflightLogic)
    const { user } = useValues(userLogic)
    const { isSignupPanel2Submitting, signupPanel2ManualErrors, panel } = useValues(signupLogic)
    const { setPanel } = useActions(signupLogic)
    const [showSpinner, setShowSpinner] = useState(true)

    useEffect(() => {
        setShowSpinner(true)
        const t = setTimeout(() => {
            setShowSpinner(false)
        }, 500)
        return () => clearTimeout(t)
    }, [panel])

    return !user ? (
        <div className="space-y-2">
            <h2>
                {preflight?.demo
                    ? 'Explore PostHog yourself'
                    : panel === 0
                    ? 'Get started'
                    : 'Tell us a bit about yourself'}
            </h2>
            {!isSignupPanel2Submitting && signupPanel2ManualErrors?.generic && (
                <AlertMessage type="error">
                    {signupPanel2ManualErrors.generic?.detail || 'Could not complete your signup. Please try again.'}
                </AlertMessage>
            )}
            {panel === 0 ? (
                <>
                    <SignupPanel1 />
                    {!preflight?.demo && (preflight?.cloud || preflight?.initiated) && (
                        // If we're in the demo environment, login is unified with signup and it's passwordless
                        // For now, if you're not on Cloud, you wouldn't see this page,
                        // but future-proofing this (with `preflight.initiated`) in case this changes
                        <div className="text-center mt-4">
                            Already have an account?{' '}
                            <Link to="/login" data-attr="signup-login-link" className="font-bold">
                                Log in
                            </Link>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <SignupPanel2 />
                    <div className="flex justify-center">
                        <LemonButton
                            type="tertiary"
                            status="muted"
                            icon={<IconArrowLeft />}
                            onClick={() => setPanel(panel - 1)}
                            size="small"
                            center
                        >
                            or go back
                        </LemonButton>
                    </div>
                </>
            )}
            {showSpinner ? <SpinnerOverlay /> : null}
        </div>
    ) : null
}
