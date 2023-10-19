const {getAirtableRecords} = require("./public/functions/getRecordArrayFromAirtable");
const {checkAllCheckboxes} = require("./public/functions/airtableFunctions");
const {postMessageToTeams} = require("./public/functions/postMessageToTeams");
const Airtable = require("airtable");
const axios = require("axios");
const {sendSingleRecordEmail, sendAggregatedEmail} = require("./public/functions/barkEmail");
const {barkError} = require("./public/functions/barkerLog");
const {sendSingleRecordTeamsMessage, sendAggregatedTeamsMessage} = require("./public/functions/barkTeams");
const {cleanUpIds} = require("./public/functions/cleanUpFieldIdVariables");
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appnBwpSZgZ7EZQsA');

async function main() {

    let record = {get: function(id) {
        return id;
        }}

    let subject = "any message"
    let subjectWithId = "a message with an ${id}"

    let cleanedUp1 = cleanUpIds(subject, record)
    let cleanedUp2 = cleanUpIds(subjectWithId, record)

    console.log(cleanedUp1)
    console.log(cleanedUp2)

}

main()







