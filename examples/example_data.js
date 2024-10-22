const logger = require('../lib/index')

logger.setOutput(logger.outputs.pretty)
logger.setNamespaces('namespace:*')
logger.setLevel('info')

const log = logger.createLogger('namespace:subNamespace')

log.warn('User data is incomplete', { userId: 12345, missingFields: ['email', 'phoneNumber'] })
