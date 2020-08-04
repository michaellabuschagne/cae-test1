/**
 * Handles queries
 */
exports.handler = async (awsEvent) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: 'So you like to ask questions eh!'
  }
}
