class Pull {
    constructor(payload) {
        this.labels = payload.pull_request.labels.map(x => x.name);
        this.owner = payload.repository.owner.login;
        this.pull_number = payload.pull_request.number;
        this.reviews = [];
        this.ref = `heads/${payload.pull_request.head.ref}`;
        this.repo = payload.repository.name;
        this.requested_reviewers = payload.pull_request.requested_reviewers;
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
            return false;
        }

        if (Object.keys(this.reviews).length == 0) {
            return false;
        }

        for (let [key, value] of Object.entries(this.reviews)) {
            if (value.state !== "APPROVED") {
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
     * Determines if the pull request can be merged
     * @param {Config} config configuration
     */
    canMerge(config) {
        return config.labels.every(x => this.labels.includes(x)) &&
            config.blocking_labels.every(x => !this.labels.includes(x)) &&
            this.isReviewComplete(config.review_required, this.requested_reviewers, this.reviews);
    }

    getCompletedReviewers() {
        let reviewers = [];

        Object.keys(this.reviews).forEach((login) => {
            reviewers.push(login)
        })

        return reviewers;
    }
}

module.exports = Pull;
