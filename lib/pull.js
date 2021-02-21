class Pull {
    constructor(payload) {
        this.labels = payload.pull_request.labels.map(x => x.name);
        this.owner = payload.repository.owner.login;
        this.pull_number = payload.pull_request.number;
        this.reviews = [];
        this.branch_name = payload.pull_request.head.ref;
        this.ref = `heads/${payload.pull_request.head.ref}`;
        this.repo = payload.repository.name;
        this.requested_reviewers = payload.pull_request.requested_reviewers;
        this.checks = {};
    }

    /**
     * Determines if a review is complete
     * @param {boolean} required is a review required
     */
    isReviewComplete(required) {
        if (!required) {
            return true;
        }

        if (this.requested_reviewers.length > 0) {
            console.log('merge failed: requested_reviewers is greater than zero');
            return false;
        }

        if (Object.keys(this.reviews).length == 0) {
            console.log('merge failed: reviews is greater than zero');
            return false;
        }

        for (let [key, value] of Object.entries(this.reviews)) {
            if (value.state !== "APPROVED") {
                console.log('merge failed: not all reviews in state of APPROVED');
                return false;
            }
        }

        return true;
    }

    /**
     * Updates Pull with review data
     * @param {Object} reviews review data from pull request
     */
    compileReviews(reviews) {
        const data = reviews.data;
        let compiled = {};

        if (data && Object.keys(data).length > 0) {
            data.forEach(element => {
                const user = element.user.login;
                const date = element.submitted_at;
                const state = element.state;

                if (typeof (compiled[user]) !== 'undefined') {
                    if (date > compiled[user].date) {
                        compiled[user] = {
                            date: date,
                            state: state
                        }
                    }
                } else {
                    compiled[user] = {
                        date: date,
                        state: state
                    }
                }
            });
        }

        this.reviews = compiled;
    }

    /**
     * Determines if checks are complete
     * @param {boolean} checks_enabled is the checks_enabled config enabled
     */
    isChecksComplete(checks_enabled) {
        if (!checks_enabled) {
            return true;
        }

        if (this.checks.total === 0){
            console.log('merge failed: checks total is zero');
            return false;
        }

        return (this.checks.completed >= (this.checks.total - 1)) && (this.checks.success >= (this.checks.total - 1));
    }

    /**
     * Updates Pull with checks data
     * @param {Object} checks check data from pull request
     */
    compileChecks(checks) {
        if (!!checks && !!checks.data) {
            const data = checks.data.check_runs;
            let compiled = {
                total: checks.data.total_count,
                completed: 0,
                success: 0
            };

            if (data && Object.keys(data).length > 0) {
                data.forEach(element => {
                    if (element.status === "completed") {
                        compiled.completed++;
                    }

                    if (element.conclusion === "success") {
                        compiled.success++;
                    }
                });
            }

            this.checks = compiled;
        }
    }

    /**
     * Determines if the pull request can be merged
     * @param {Config} config configuration
     */
    canMerge(config) {
        return config.labels.every(x => this.labels.includes(x)) &&
            config.blocking_labels.every(x => !this.labels.includes(x)) &&
            this.isReviewComplete(config.review_required, this.requested_reviewers, this.reviews) &&
            this.isChecksComplete(config.checks_enabled);
    }
}

module.exports = Pull;
