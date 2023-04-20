const core = require('@actions/core');
const { createAppAuth } = require("@octokit/auth-app");

async function getToken() {
  const token = core.getInput('GITHUB_TOKEN');
  if(token.length) return token;

  const auth = createAppAuth({
    appId: core.getInput('GITHUB_APP_ID'),
    privateKey: core.getInput('GITHUB_APP_PRIVATE_KEY'),
    clientId: core.getInput('GITHUB_APP_CLIENT_ID'),
    clientSecret: core.getInput('GITHUB_APP_CLIENT_SECRET'),
  });
  
  // Retrieve JSON Web Token (JWT) to authenticate as app
  const appAuthentication = await auth({ type: "app" });
  return appAuthentication.token;
}


module.exports = getToken;