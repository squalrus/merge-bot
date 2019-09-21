async function run() {
    const core = require('@actions/core');
    const github = require('@actions/github');

    try {
        const nameToGreet = core.getInput('who-to-greet');
        console.log(`Hello ${nameToGreet}!`);

        const time = (new Date()).toDateString();
        core.setOutput('time', time);

        const payload = JSON.stringify(github.context.payload, undefined, 2);
        // console.log(`The event payload: ${payload}`);

        const token = core.getInput('token');
        const octokit = new github.GitHub(token);

        const { data: comment } = await octokit.issues.createComment({
            owner: 'squalrus',
            repo: github.context.payload.repository.name,
            issue_number: github.context.payload.number,
            body: `howdy: ${github.context.payload.label.name}`
        });
        console.log(comment);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
