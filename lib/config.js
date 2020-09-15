class Config {
    constructor(core) {
        this.blocking_labels = core.getInput('blocking_labels').split(',').map(x => x.trim());
        this.labels = core.getInput('labels').split(',').map(x => x.trim());
        this.merge_method = core.getInput('method');
        this.review_required = core.getInput('reviewers') === 'true';
        this.checks_enabled = core.getInput('checks_enabled') === 'true';
        this.test_mode = core.getInput('test') === 'true';
        this.delete_source_branch = core.getInput('delete_source_branch') === 'true';
    }
}

module.exports = Config;
