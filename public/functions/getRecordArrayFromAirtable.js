const Airtable = require("airtable");

module.exports = {
    getAirtableRecords: async function getRecordArray(baseId, table, view, filter){
        const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(baseId);

        let recordArray = []
        return new Promise((resolve, reject) => {
            base(table).select({
                view: view,
                returnFieldsByFieldId: true,
                filterByFormula: filter
            }).eachPage(function page(records, fetchNextPage) {
                // This function (`page`) will get called for each page of records.


                records.forEach(function(record) {
                    recordArray.push(record)
                });

                // To fetch the next page of records, call `fetchNextPage`.
                // If there are more records, `page` will get called again.
                // If there are no more records, `done` will get called.
                fetchNextPage();

            }, function done(err) {
                if (err) { reject(err); }
                resolve(recordArray)
            });
        })

    }
}