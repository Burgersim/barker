const {cleanUpIds} = require("./cleanUpFieldIdVariables");
const {getAirtableRecords} = require("./getRecordArrayFromAirtable");
const {createGroupedTable, createTable, createHtml, createGroupedHtml, cleanUpFieldIds} = require("./htmlHelperFunctions");
const {postMessageToTeams} = require("./postMessageToTeams");
const {barkLog, barkError} = require("./barkerLog");
const {checkAllCheckboxes} = require("./airtableFunctions");

module.exports = {
    sendAggregatedTeamsMessage: async function sendAggregatedTeamsMessage(params) {
        const baseId = params.base
        const barkName = params.barkName
        const barkDescription = params.barkDescription
        const noRecNoBark = params.format.noRecNoBark
        const summarizeGroups = params.format.summarizeGroups
        const table = params.table
        const view = params.view
        const filter = params.filter || ""
        const message = params.message || ""
        const footerMessage = params.footerMessage || undefined
        const subject = params.subject
        const isGrouped = !!params.format.groupBy
        const groupBy = params.format.groupBy
        const checkboxSet = !!params.checkboxFieldId
        const checkboxFieldId = params.checkboxFieldId
        const tableHead = params.format.tableHeadTemplate || params.tableHeadArray
        const tableBody = params.format.tableBodyTemplate || params.tableBodyArray
        const bodyTemplate = params.format.bodyTemplate
        const webhook = params.webhook
        const tableStyle = {
            "headBackgroundColor": params.format.tableHeadBackgroundColor || "",
            "headTextColor": params.format.tableHeadTextColor || "",
            "backgroundColor": params.format.tableBackgroundColor || "",
            "textColor": params.format.tableTextColor || "",
            "border": params.format.tableBorder || "1px solid #000000",
            "cellPadding": params.format.tableCellPadding || "",
            "cellMargin": params.format.tableCellMargin || "",
            "width": params.format.tableWidth || "",
            "align": params.format.tableAlign || "left",
        }

        switch(tableStyle.align){
            case "left":
                tableStyle.align = "";
                break
            case "right":
                tableStyle.align = "margin-left:auto;margin-right:1em;"
                break
            case "center":
                tableStyle.align = "margin-left:auto;margin-right:auto;"
                break
            default:
                tableStyle.align = ""
                break
        }

        if((tableHead && tableBody) || bodyTemplate) {

            cleanUpFieldIds(tableHead)
            cleanUpFieldIds(tableBody)
            cleanUpFieldIds(bodyTemplate)


            let recordArray = await getAirtableRecords(baseId, table, view, filter) //.catch(err => { throw err })
            if (recordArray.length === 0 && noRecNoBark) {
                barkLog(barkName, "No records in view and noBarkNoRec set to true, therefore no Bark")
            } else {

                let html = ''

                if (isGrouped) {
                    if (tableHead && tableBody) {
                        html = createGroupedTable(recordArray, tableHead, tableBody, groupBy, tableStyle)
                    } else if (bodyTemplate) {
                        html = createGroupedHtml(recordArray, bodyTemplate, groupBy, summarizeGroups)
                    }
                }
                if (!isGrouped) {
                    if (tableHead && tableBody) {
                        html = createTable(recordArray, tableHead, tableBody, tableStyle)
                    } else if (bodyTemplate) {
                        html = createHtml(recordArray, bodyTemplate, tableStyle)
                    }
                }


                //send Message to Teams
                postMessageToTeams(subject, message, html, webhook.toString(), footerMessage).then(res => {
                    if (res.data === 1) {
                        console.log(barkName + " | message sent successfully")
                        //console.log("Response: \n", res)
                        if(checkboxSet)
                            checkAllCheckboxes(recordArray, checkboxFieldId)
                        barkLog(barkName, barkDescription + "\n\nResponse from Teams:\n " + "Status: " + res.status + "\nStatus Message: " + res.statusText)
                    } else {
                        barkError(barkName, "Message sending Problems. Status: " + res.data)
                    }
                })
            }

        } else {
                if (!tableHead && !tableBody && !bodyTemplate) throw Error('No template given for html content of message (needed are either tableBodyTemplate & tableHeadTemplate OR bodyTemplate.')
                else if (!tableHead && tableBody) throw Error('tableHeadTemplate not defined')
                else if (tableHead && !tableBody) throw Error('tableBodyTemplate not defined')
            }

    },
    sendSingleRecordTeamsMessage: async function sendSingleRecordTeamsMessage(params){
        const baseId = params.base
        const barkName = params.barkName
        const barkDescription = params.barkDescription
        const noRecNoBark = params.format.noRecNoBark
        const table = params.table
        const view = params.view
        const filter = params.filter || ""
        const message = params.message || ""
        const footerMessage = params.footerMessage || ""
        const subject = params.subject
        const checkboxSet = !!params.checkboxFieldId
        const checkboxFieldId = params.checkboxFieldId
        const webhookField = params.webhookFieldId
        const webhook = params.webhook

        let recordArray = await getAirtableRecords(baseId, table, view, filter)
        if (recordArray.length === 0 && noRecNoBark) {
            barkLog(barkName, "No records in view and noBarkNoRec set to true, therefore no Bark")
        } else {

            recordArray.forEach((record) => {
                let transformedMessage = cleanUpIds(message, record)
                let transformedSubject = cleanUpIds(subject, record)
                let transformedFooterMessage = ""
                if(footerMessage)
                    transformedFooterMessage = cleanUpIds(footerMessage, record)
                postMessageToTeams(transformedSubject, transformedMessage, "", webhook ? webhook : record.get(webhookField).toString(), transformedFooterMessage).then(res => {
                    if (res.data === 1) {
                        console.log(barkName + " | message sent successfully")
                        if(checkboxSet)
                            checkAllCheckboxes(recordArray, checkboxFieldId)
                        barkLog(barkName, barkDescription + "\n\nResponse from Teams:\n " + "Status: " + res.status + "\nStatus Message: " + res.statusText)
                        //check Boxes in Records

                    } else {
                        barkError(barkName, "Message sending Problems. Status: " + res.data)
                    }
                })
            })
        }

    },
    sendTeamsMessage: async function sendTeamsMessage(params){
        const barkName = params.barkName
        const barkDescription = params.barkDescription
        const message = params.message || ""
        const footerMessage = params.footerMessage || ""
        const subject = params.subject
        const webhook = params.webhook

                postMessageToTeams(subject, message, "", webhook, footerMessage).then(res => {
                    if (res.data === 1) {
                        console.log(barkName + " | message sent successfully")

                        barkLog(barkName, barkDescription + "\n\nResponse from Teams:\n " + "Status: " + res.status + "\nStatus Message: " + res.statusText)
                        //check Boxes in Records

                    } else {
                        barkError(barkName, "Message sending Problems. Status: " + res.data)
                    }
                })

    }
}