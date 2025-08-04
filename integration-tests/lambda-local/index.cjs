const { Agent } = require('@openai/agents');

exports.handler = async () => {
  // Instantiate the agent to ensure the import succeeds.
  new Agent({ name: 'Test Agent', instructions: 'Say hello.' });
  return {
    statusCode: 200,
    body: 'ok',
  };
};
