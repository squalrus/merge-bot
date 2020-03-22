const renderMessage = (action, config, pull) => {
    return `### merge bot test mode

#### overview

<table>
<tr><td>status</td><td>${pull.canMerge(config) ? '✅' : '❌'}</td></tr>
<tr><td>triggered by</td><td>${action}</td></tr>
</table>

#### integration requirements

<table>
<tr><td>required label(s)</td><td>${JSON.stringify(config.labels)}</td></tr>
<tr><td>blocking label(s)</td><td>${JSON.stringify(config.blocking_labels)}</td></tr>
<tr><td>reviewers required</td><td>${config.review_required}</td></tr>
<tr><td>merge method</td><td>${config.merge_method}</td></tr>
</table>

#### pull request details

<table>
<tr><td>labels</td><td>${JSON.stringify(pull.labels)}</td></tr>
<tr><td>requested reviewers</td><td>${JSON.stringify(pull.requested_reviewers)}</td></tr>
<tr><td>reviewers</td><td>${JSON.stringify(pull.reviews)}</td></tr>
<tr><td>checks</td><td>${JSON.stringify(pull.checks)}</td></tr>
</table>`;
}

module.exports = renderMessage;
