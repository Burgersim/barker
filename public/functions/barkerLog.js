const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appnBwpSZgZ7EZQsA');

module.exports = {
    barkLog: function (name, description) {
        base('tblfOaBNAUGSnbctN').create([
            {
                "fields": {
                    "fldqSJZAhYM4XwC59": name,
                    "fldjP03wfZ9wWtNcy": "Log",
                    "fldRDk7jylkmrQSfG": description || ""
                }
            }
        ], function(err) {
            if (err) {
                console.error(err);

            }
        });
    },
    barkError: function (name, errorDescription) {
        base('tblfOaBNAUGSnbctN').create([
            {
                "fields": {
                    "fldqSJZAhYM4XwC59": name,
                    "fldjP03wfZ9wWtNcy": "Error",
                    "fldRDk7jylkmrQSfG": errorDescription || ""
                }
            }
        ], function(err) {
            if (err) {
                console.error(err);

            }
        });

    }
}