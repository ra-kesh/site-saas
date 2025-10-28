import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="info">
        <h4>Finish onboarding in Sites of Puri</h4>
      </Banner>
      <p>
        We now reserve the admin tools for customers with an active subscription. Head back to the
        onboarding dashboard to choose a template and start your plan before editing content here.
      </p>
      <p>
        <a href="/dashboard" className={`${baseClass}__link`}>
          Open the onboarding dashboard
        </a>
      </p>
      <p>
        Need a quick change before you upgrade? Our team can proxy updates for you—just reach out
        through the contact form.
      </p>
    </div>
  )
}

export default BeforeDashboard
