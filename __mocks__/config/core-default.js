class CoreDefault {
    getInput(key) {
        switch (key) {
            case 'blocking-labels':
                return 'do not merge';

            case 'labels':
                return 'ready, merge';

            case 'method':
                return 'squash';

            case 'reviewers':
                return 'true';

            case 'test':
                return 'true';

            default:
                break;
        }
    }
}

module.exports = CoreDefault;
