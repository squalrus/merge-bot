const renderMessage = (action, config, pull) => {
    return `### merge bot test mode
> triggered by: ${action}

#### integration requirements
required label(s): ${JSON.stringify(config.labels)}
blocking label(s): ${JSON.stringify(config.blocking_labels)}
reviewers required: ${config.review_required}
merge method: ${config.merge_method}

#### pull request stats
labels: ${JSON.stringify(pull.labels)}
requested reviewers: ${JSON.stringify(pull.requested_reviewers)}
reviewers: ${JSON.stringify(pull.reviews)}

#### result
eligible for merge: ${pull.canMerge(config)}`;
}

module.exports = renderMessage;
