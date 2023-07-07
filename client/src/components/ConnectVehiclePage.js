import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  authFleetVehicle,
  AUTH_CALLBACK_URL,
  fetchAppConfig,
} from '../requests'
import routes, { PAGES } from '../routes'
import '../styles/ConnectVehiclePage.scss'
import GrayCircles from './GrayCircles'
import PrimaryButton from './PrimaryButton'
import { useLocation } from 'react-use'
import { APP_TYPES } from '../store/Config'
import ErrorMessage from './ErrorMessage'
import Spinner from './Spinner'
import TextInput from './TextInput'
import BrandSelect from './BrandSelect'
import { useMobx } from '../store/mobx'

function ConnectVehiclePage() {
  const [url, setUrl] = useState(null)
  const [appConfig, setAppConfig] = useState(null)
  const history = useHistory()
  const [error, setError] = useState(
    new URLSearchParams(useLocation().search).get('error')
  )
  const [vin, setVin] = useState('')
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(true)
  const { properties } = useMobx()

  useEffect(() => {
    const fetch = async () => {
      try {
        const config = await fetchAppConfig()
        setAppConfig(config)

        const oAuthUrl = new URL(config.auth_url)
        oAuthUrl.searchParams.set('client_id', config.client_id)
        oAuthUrl.searchParams.set('app_id', config.graph_ql_api_config.app_id)
        oAuthUrl.searchParams.set('redirect_uri', AUTH_CALLBACK_URL)
        setUrl(oAuthUrl)
        setLoading(false)
      } catch (e) {
        history.push(
          routes.find((route) => route.name === PAGES.INITIAL_CONFIG).path
        )
      }
    }

    fetch()
  }, [history])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!vin || !brand) {
      setError('You need to add a vin and a brand')
      return
    }

    try {
      setLoading(true)
      await authFleetVehicle(vin, brand)
      properties.resetValues()
      history.push(routes.find((route) => route.name === PAGES.DASHBOARD).path)
    } catch (e) {
      console.log('Failed to auth vehicle', { vin, e })
      setError(`Failed to authorize vehicle. ${e?.response?.data?.error || ''}`)
      setLoading(false)
    }
  }

  return (
    <div className="ConnectVehiclePage">
      {loading && <Spinner />}
      <ErrorMessage className="ConnectVehiclePageError" show={!!error}>
        {appConfig?.app_type === APP_TYPES.DRIVER && (
          <p>
            Could not connect vehicle. Make sure to open your emulator if using
            one
          </p>
        )}
        <p className="small">{error}</p>
      </ErrorMessage>
      <div className="ConnectVehiclePageContent">
        <h2 className="ConnectVehiclePageHeader">Connect your vehicle</h2>
        <GrayCircles />
        {appConfig?.app_type === APP_TYPES.FLEET ? (
          <form
            noValidate
            spellCheck="false"
            onSubmit={(e) => onSubmit(e)}
            className="ConnectVehiclePageForm"
          >
            <TextInput
              name="vin"
              placeholder="Vin"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />
            <BrandSelect value={brand} onSelect={(v) => setBrand(v)} />
            <PrimaryButton type="submit">Add vehicle</PrimaryButton>
          </form>
        ) : (
          <a href={url?.toString()}>
            <PrimaryButton>Add a vehicle</PrimaryButton>
          </a>
        )}
      </div>
    </div>
  )
}

export default observer(ConnectVehiclePage)
