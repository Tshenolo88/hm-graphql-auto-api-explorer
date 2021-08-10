import { knex } from '../database'
import GraphQlService from '../services/GraphQlService'

export default class VehiclesController {
  async index(req, res) {
    try {
      const vehicles = await knex('vehicles').select()

      res.json(vehicles)
    } catch (err) {
      console.log(err.stack)
      res.status(500).json({
        error: 'Failed to get vehicles',
      })
    }
  }

  async getData(req, res) {
    try {
      const { vehicleId } = req.params
      const { access_token } = await knex('access_tokens')
        .where('vehicle_id', vehicleId)
        .first()
      const config = await knex('config').first()
      const graphQl = new GraphQlService(
        config.graph_ql_api_config,
        access_token
      )

      const properties = await graphQl.fetchProperties(req.body.properties)

      res.json(properties)
    } catch (err) {
      console.log('Failed to fetch vehicle data', err)
    }
  }
}