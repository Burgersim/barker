const {getAirtableRecords} = require("./getRecordArrayFromAirtable");
const {createGroupedTable, createTable, createGroupedHtml, createHtml, closeOpenHtmlTags, cleanUpFieldIds} = require("./htmlHelperFunctions");
const {barkLog, barkError} = require("./barkerLog");
const {cleanUpIds} = require("./cleanUpFieldIdVariables");
const {sendMail} = require("./sendMail");
const {checkAllCheckboxes} = require("./airtableFunctions");
const showdown = require('showdown')

let markdownConverter = new showdown.Converter()

module.exports = {
    sendAggregatedEmail: async function sendAggregatedEmail(params) {
        const baseId = params.base
        const barkName = params.barkName
        const barkDescription = params.barkDescription
        const noRecNoBark = params.format.noRecNoBark
        const noRecMessage = params.noRecMessage
        const summarizeGroups = params.format.summarizeGroups
        const table = params.table
        const view = params.view
        const filter = params.filter || ""
        const stylesheet = params.format.stylesheet
        const message = markdownConverter.makeHtml(params.message) || ""
        const footerMessage = markdownConverter.makeHtml(params.footerMessage) || ""
        const subject = params.subject
        const isGrouped = !!params.format.groupBy
        const groupBy = params.format.groupBy
        const checkboxSet = !!params.checkboxFieldId
        const checkboxFieldId = params.checkboxFieldId
        const tableHead = params.format.tableHeadTemplate || params.tableHeadArray
        const tableBody = params.format.tableBodyTemplate || params.tableBodyArray
        const bodyTemplate = params.format.bodyTemplate
        const backgroundColor = params.format.backgroundColor || '#D3D3D3'
        const containerColor = params.format.containerColor || '#FFFFFF'
        const textColor = params.format.textColor || '#000000'
        const textAlign = params.format.textAlign || 'left'
        const logo = params.format.logoUrl || "#"
        const logoHeight = params.format.logoHeight || "100px"
        const logoAlign = params.format.logoAlign || "center"
        const pageTitle = params.pageTitle || ""
        const fullPageTemplate = params.format.fullPageTemplate
        const toMail = params.toEmail
        const ccMail = params.ccEmails
        const fromMail = params.fromEMail
        const tableStyle = {
                "headBackgroundColor": params.format.tableHeadBackgroundColor || "",
                "headTextColor": params.format.tableHeadTextColor || "",
                "backgroundColor": params.format.tableBackgroundColor || "",
                "textColor": params.format.tableTextColor || "",
                "border": params.format.tableBorder || "1px solid #000000",
                "cellPadding": params.format.tableCellPadding || "",
                "cellMargin": params.format.tableCellMargin || "",
                "width": params.format.tableWidth || "",
                "align": params.format.tableAlign || "center",
            }

            console.log("Message: " + message)

        switch(tableStyle.align){
            case "left":
                tableStyle.align = "margin-left:1em;margin-right:auto;"
                break
            case "right":
                tableStyle.align = "margin-left:auto;margin-right:1em;"
                break
            case "center":
                tableStyle.align = "margin-left:auto;margin-right:auto;"
                break
        }

        if((tableHead && tableBody) || bodyTemplate) {

            cleanUpFieldIds(tableHead)
            cleanUpFieldIds(tableBody)
            cleanUpFieldIds(bodyTemplate)
        }

        let recordArray = await getAirtableRecords(baseId, table, view, filter)

        if (recordArray.length === 0 && noRecNoBark) {
            barkLog(barkName, "No records in view and noBarkNoRec set to true, therefore no Bark")
        } else {

            let html

            if (fullPageTemplate) {
                html = fullPageTemplate
            } if(stylesheet) {
                html =
                    `<body>` +
                    `<head>` +
                    `<title>${pageTitle}</title>` +
                    `<style>` +
                    `${stylesheet}` +
                    `</style>` +
                    `</head>` +
                    `<div class="centered">` +
                    `<div class="logo"><img src="${logo}" style="height: ${logoHeight};" alt=""></div>` +
                    `<h1>${subject}</h1>` +
                    `<p>${message}</p>`
            } else {
                html =
                    `<body>` +
                    `<head>` +
                    `<title>${pageTitle}</title>` +
                    `<style>` +
                    `body {background-color: ${backgroundColor}; color: ${textColor}}` +
                    `div.centered {text-align: ${textAlign}; margin: 25px auto 25px auto; background-color: ${containerColor}; width: 90%; border-radius: 15px; padding: 5px 10px 10px 10px;}` +
                    `div.logo {margin: 5px auto 5px auto; width: fit-content; height: fit-content; text-align: ${logoAlign};}` +
                    `</style>` +
                    `</head>` +
                    `<div class="centered">` +
                    `<div class="logo"><img src="${logo}" style="height: ${logoHeight};" alt=""></div>` +
                    `<h1>${subject}</h1>` +
                    `<p>${message}</p>`
            }

            if(recordArray.length !== 0) {
            if (isGrouped) {
                if (tableHead && tableBody) {
                    html += createGroupedTable(recordArray, tableHead, tableBody, groupBy, tableStyle)
                } else if (bodyTemplate) {
                    html += createGroupedHtml(recordArray, bodyTemplate, groupBy, summarizeGroups)
                }
            }
            if (!isGrouped) {
                if (tableHead && tableBody) {
                    html += createTable(recordArray, tableHead, tableBody, tableStyle)
                } else if (bodyTemplate) {
                    html += createHtml(recordArray, bodyTemplate, tableBody)
                }
            }
            } else {
                html += `<p>${noRecMessage}</p>`
            }

            html += footerMessage
            html = closeOpenHtmlTags(html)

            //send Mail
            await sendMail(fromMail, toMail, ccMail, {'subject': subject, 'body': html}).then(res => {
                if (parseInt(res.response.split(" ")[0]) === 200 || parseInt(res.response.split(" ")[0]) === 250) {
                    barkLog(barkName, barkDescription + "\n\nResponse from Mail Server:\n " + "Accepted By: " + res.accepted + "\nResponse: " + res.response)

                    console.log("Accepted: " + res.accepted)
                    console.log("Response: " + res.response)
                    console.log(barkName + " | Email sent successfully")
                    if(checkboxSet)
                        checkAllCheckboxes(recordArray, checkboxFieldId)

                } else {
                    barkError(barkName, "Email sending Problems. Status: " + res.status + " | " + res.statusText)
                }
            }).catch(err => {
                console.log("error after sending mail");
                throw err
            })
        }


    },
    sendSingleRecordEmail: async function sendSingleRecordEmail(params) {
        const baseId = params.base
        const barkName = params.barkName
        const barkDescription = params.barkDescription
        const noRecNoBark = params.format.noRecNoBark
        const table = params.table
        const view = params.view
        const filter = params.filter || ""
        const message = markdownConverter.makeHtml(params.message) || ""
        const footerMessage = markdownConverter.makeHtml(params.footerMessage) || ""
        const subject = params.subject
        const checkboxSet = !!params.checkboxFieldId
        const checkboxFieldId = params.checkboxFieldId
        const backgroundColor = params.format.backgroundColor || '#D3D3D3'
        const containerColor = params.format.containerColor || '#FFFFFF'
        const textColor = params.format.textColor || '#000000'
        const textAlign = params.format.textAlign || 'left'
        const logo = params.format.logoUrl || "#"
        const logoHeight = params.format.logoHeight || "100px"
        const logoAlign = params.format.logoAlign || "center"
        const pageTitle = params.pageTitle || ""
        const toMail = params.toEmail
        const ccMail = params.ccEmails
        const fromMail = params.fromEMail

        let recordArray = await getAirtableRecords(baseId, table, view, filter)
        if (recordArray.length === 0 && noRecNoBark) {
            barkLog(barkName, "No records in view and noBarkNoRec set to true, therefore no Bark")
        } else {

            let html = ''

            for (const record of recordArray) {
                let transformedMessage = cleanUpIds(message, record)
                let transformedSubject = cleanUpIds(subject, record)

                html =
                    `<body>` +
                    `<head>` +
                    `<title>${pageTitle}</title>` +
                    `<style>` +
                    `body {background-color: ${backgroundColor}; color: ${textColor}}` +
                    `div.centered {text-align: ${textAlign}; margin: 25px auto 25px auto; background-color: ${containerColor}; width: 90%; border-radius: 15px; padding: 5px 10px 10px 10px;}` +
                    `div.logo {margin: 5px auto 5px auto; width: fit-content; height: fit-content; text-align: ${logoAlign};}` +
                    `</style>` +
                    `</head>` +
                    `<div class="centered">` +
                    `<div class="logo"><img src="${logo}" style="height: ${logoHeight};" alt=""></div>` +
                    `<h1>${transformedSubject}</h1>` +
                    `<div><p>${transformedMessage}</p><p>${footerMessage}</p></div>` +
                    `</div></body>`

                await sendMail(fromMail, toMail, ccMail, {subject: transformedSubject, body: html}).then(res => {
                    if (parseInt(res.response.split(" ")[0]) === 200 || parseInt(res.response.split(" ")[0]) === 250) {
                        barkLog(barkName, barkDescription + "\n\nResponse from Mail Server:\n " + "Accepted By: " + res.accepted + "\nResponse: " + res.response)

                        console.log("Accepted: " + res.accepted)
                        console.log("Response: " + res.response)
                        console.log(barkName + " | Email sent successfully")
                        if(checkboxSet)
                            checkAllCheckboxes(recordArray, checkboxFieldId)

                    } else {
                        barkError(barkName, "Email sending Problems. Status: " + res.status + " | " + res.statusText)
                    }
                }).catch(err => {
                    console.log("error after sending mail");
                    throw err
                })
            }

        }

    },
    sendEmail: async function sendEmail(params) {
        const barkName = params.barkName
        const barkDescription = params.barkDescription
        const message = markdownConverter.makeHtml(params.message) || ""
        const footerMessage = markdownConverter.makeHtml(params.footerMessage) || ""
        const subject = params.subject
        const backgroundColor = params.format.backgroundColor || '#D3D3D3'
        const containerColor = params.format.containerColor || '#FFFFFF'
        const textColor = params.format.textColor || '#000000'
        const textAlign = params.format.textAlign || 'left'
        const logo = params.format.logoUrl || "#"
        const logoHeight = params.format.logoHeight || "100px"
        const logoAlign = params.format.logoAlign || "center"
        const pageTitle = params.pageTitle || ""
        const toMail = params.toEmail
        const ccMail = params.ccEmails
        const fromMail = params.fromEMail

                let html =
                    `<body>` +
                    `<head>` +
                    `<title>${pageTitle}</title>` +
                    `<style>` +
                    `body {background-color: ${backgroundColor}; color: ${textColor}}` +
                    `div.centered {text-align: ${textAlign}; margin: 25px auto 25px auto; background-color: ${containerColor}; width: 90%; border-radius: 15px; padding: 5px 10px 10px 10px;}` +
                    `div.logo {margin: 5px auto 5px auto; width: fit-content; height: fit-content; text-align: ${logoAlign};}` +
                    `</style>` +
                    `</head>` +
                    `<div class="centered">` +
                    `<div class="logo"><img src="${logo}" style="height: ${logoHeight};" alt=""></div>` +
                    `<h1>${subject}</h1>` +
                    `<div><p>${message}</p><p>${footerMessage}</p></div>` +
                    `</div></body>`

                await sendMail(fromMail, toMail, ccMail, {subject: subject, body: html}).then(res => {
                    if (parseInt(res.response.split(" ")[0]) === 200 || parseInt(res.response.split(" ")[0]) === 250) {
                        barkLog(barkName, barkDescription + "\n\nResponse from Mail Server:\n " + "Accepted By: " + res.accepted + "\nResponse: " + res.response)

                        console.log("Accepted: " + res.accepted)
                        console.log("Response: " + res.response)
                        console.log(barkName + " | Email sent successfully")

                    } else {
                        barkError(barkName, "Email sending Problems. Status: " + res.status + " | " + res.statusText)
                    }
                }).catch(err => {
                    console.log("error after sending mail");
                    throw err
                })
            }
}

