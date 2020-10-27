class CoreDefault {
    getInput(key) {
        switch (key) {
            case 'blocking_labels':
                return '';

            case 'labels':
                return '';

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
