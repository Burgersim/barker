const cron = require('node-cron');
const PORT = process.env.PORT || 5000;
const express = require('express');
const app = express();
const Airtable = require('airtable');
const axios = require('axios')
const {isItTimeYet} = require("./public/functions/isItTimeYet");
const TimeMatcher = require("node-cron/src/time-matcher");
const {sendAggregatedEmail, sendSingleRecordEmail, sendEmail} = require("./public/functions/barkEmail");
const {sendSingleRecordTeamsMessage, sendAggregatedTeamsMessage, sendTeamsMessage} = require("./public/functions/barkTeams");
const {barkError} = require("./public/functions/barkerLog");
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appnBwpSZgZ7EZQsA');

// Static Middleware
//app.use(express.static(path.join(__dirname, 'public')))
//app.set('view engine', 'pug');

//cron syntax info
// ┌────────────── second (optional)
// │ ┌──────────── minute
// │ │ ┌────────── hour
// │ │ │ ┌──────── day of month
// │ │ │ │ ┌────── month
// │ │ │ │ │ ┌──── day of week
// │ │ │ │ │ │
// │ │ │ │ │ │
// * * * * * *


app.listen(PORT, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});

//query Airtable every minute
cron.schedule('* * * * *', () => {

    base('tblZcRZ2VKGTKR0QU').select({
        view: "viwYmg5PHMyqMro4G",
        returnFieldsByFieldId: true
    }).eachPage(async function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

            for (const record of records) {

                //Minute, Hour, Day of Month, Month, Weekday | concatenating the cron scheduling String
                let minute = record.get('fldP6a2KTBMp9OzuW').replace(/\s/g, "")
                let hour = record.get('fldFHMDP8FwSqjnDW').replace(/\s/g, "")
                let day = record.get('fldbKc5UCQtfLM5da').replace(/\s/g, "")
                let month = record.get('fldGwmixehKvHDx7A').toString().replace(/\s/g, "")
                let weekday = record.get('fldepG5S7wqdrtHcI').toString().replace(/\s/g, "")
                //let cronParameters = record.get('fldP6a2KTBMp9OzuW').replace(/\s/g, "") + " " + record.get('fldFHMDP8FwSqjnDW').replace(/\s/g, "") + " " + record.get('fldbKc5UCQtfLM5da').replace(/\s/g, "") + " " + record.get('fldGwmixehKvHDx7A').toString().replace(/\s/g, "") + " " + record.get('fldepG5S7wqdrtHcI').toString().replace(/\s/g, "")
                let cronParameters = minute + " " + hour + " " + day + " " + month + " " + weekday
                //console.log('Retrieved', record.get('fldvOrPUJz4fm420C'));
                let cronTimeMatcher = new TimeMatcher(cronParameters, 'UTC')

                //console.log(cronParameters)
                //console.log(isItTimeYet(cronTimeMatcher))

                if (isItTimeYet(cronTimeMatcher)) {
                    //reading format JSON attachment
                    let format = {}
                    if (record.get('fldf1MjnhgXCtwnhb') !== undefined) {
                        format = (await axios.get(record.get('fldf1MjnhgXCtwnhb')[0].url)).data
                        //console.log(format)
                    }

                    //get parameters for Bark
                    let airtableMetaData = {
                        barkName: record.get('fldNuElhwgGiVsWbJ'),
                        barkDescription: record.get('fld97k69HEc7LWwa3'),
                        base: record.get('fldMBgLmkQHMahGjW'),
                        table: record.get('fldEnT3IZh5iVD3l7'),
                        view: record.get('fld0JogaXR0dZnxiJ'),
                        filter: record.get('fldexAcL307GEjKXv'),
                        barkType: record.get('fldMGuBXyhWPZqbhJ'),
                        message: record.get('fldikxHFGIqKfrDds'),
                        footerMessage: record.get('fldemZZErjZd6kvec'),
                        noRecMessage: record.get('fldxNuYSeK0bTATPO'),
                        format: format,
                        subject: record.get('fld9w40t4KXbXv11r'),
                        webhook: record.get('fldIbr4F4XUiMEVUk'),
                        webhookFieldId: record.get('fldLEgfsF24yX1t7N'),
                        checkboxFieldId: record.get('fldgiK2yq2bhYuWRc'),
                        toEmail: record.get('fldyEBmHXHInd308v'),
                        ccEmails: record.get('fldOn3dH9l1GIeTO7') ? record.get('fldOn3dH9l1GIeTO7').replaceAll(" ", "") : "",
                        fromEMail: record.get('fldlbETYIClB5JflY') && record.get('fldjcuBEZoKGvGYhy') && record.get('fldFeCxbKA1i4iY8J') && record.get('fldXNMjM6DQAnWggX') ? {'user': record.get('fldlbETYIClB5JflY')[0], 'password': record.get('fldjcuBEZoKGvGYhy')[0], 'address': record.get('fldFeCxbKA1i4iY8J')[0], "service": record.get('fldXNMjM6DQAnWggX')[0]} : "",
                        tableHeadArray: record.get('fldpqU6Yaw7hGOziX') ? record.get('fldpqU6Yaw7hGOziX').split(",").map(element => {return element.trim()}) : "",
                        tableBodyArray: record.get('fld4ObmTNxFL2AC1Z') ?record.get('fld4ObmTNxFL2AC1Z').split(",").map(element => {return element.trim()}) : "",
                    }

                    switch (airtableMetaData.barkType) {
                        case 'Email (Single Record)':
                            console.log(airtableMetaData.barkName + ' | Single Email Bark started')
                            sendSingleRecordEmail(airtableMetaData).catch((err) => { console.log(err); barkError(airtableMetaData.barkName, err) })
                            break
                        case 'Email (Aggregated Records)':
                            console.log(airtableMetaData.barkName + ' | Aggregated Email Bark started')
                            sendAggregatedEmail(airtableMetaData).catch((err) => { console.log(err); barkError(airtableMetaData.barkName, err) })
                            break
                        case 'Teams Message (Single Record)':
                            console.log(airtableMetaData.barkName + ' | Single Teams Message Bark started')
                            sendSingleRecordTeamsMessage(airtableMetaData).catch((err) => { console.log(err); barkError(airtableMetaData.barkName, err) })
                            break
                        case 'Teams Message (Aggregated Records)':
                            console.log(airtableMetaData.barkName + ' | Aggregated Teams Message Bark started')
                            sendAggregatedTeamsMessage(airtableMetaData).catch((err) => { console.log(err); barkError(airtableMetaData.barkName, err) })
                            break
                        case 'Teams Message (only Message)':
                            console.log(airtableMetaData.barkName + ' | Teams Message Bark started')
                            sendTeamsMessage(airtableMetaData).catch((err) => { console.log(err); barkError(airtableMetaData.barkName, err) })
                            break
                        case 'Email (only Message)':
                            console.log(airtableMetaData.barkName + ' | Email Bark started')
                            sendEmail(airtableMetaData).catch((err) => { console.log(err); barkError(airtableMetaData.barkName, err) })
                            break
                        case 'Test':
                            console.log(airtableMetaData.barkName + ' | Test Bark started')
                            break
                        case '':
                            console.error(airtableMetaData.barkName + ' | Bark Type not defined')
                            break
                    }

                }
            }

            // To fetch the next page of records, call `fetchNextPage`.
            // If there are more records, `page` will get called again.
            // If there are no more records, `done` will get called.
            fetchNextPage();

    }, function done(err) {
        if (err) { /*console.error(err);*/ }
    });
});



