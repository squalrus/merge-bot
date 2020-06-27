class CoreDefault {
    getInput(key) {
        switch (key) {
            case 'blocking_labels':
                return 'do not merge';

            case 'labels':
                return 'ready, merge';

            case 'method':
                return 'merge';

            case 'reviewers':
                return 'true';

            case 'checks_enabled':
                return 'false';

            case 'test':
                return 'false';

            default:
                break;
        }
    }
}

module.exports = CoreDefault;
