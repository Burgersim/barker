const json2html = require('node-json2html');
const _ = require('lodash')
const {isArray} = require("lodash");

module.exports = {
    createGroupedTable: function createGroupedTable(json, headerTemplate, bodyTemplate, groupedBy, style) {

        //if Array is used (Definitions in Airtable) they need to be converted to the template format
        if(isArray(headerTemplate) && isArray(bodyTemplate)) {
            let newTemplates = convertArraysToTableTemplate(headerTemplate, bodyTemplate, style)
            headerTemplate = newTemplates.head
            bodyTemplate = newTemplates.body
        }


        headerTemplate["<>"] += ` style='background-color: ${style.headBackgroundColor}; color: ${style.headTextColor}'`
        bodyTemplate["<>"] += ` style='background-color: ${style.backgroundColor}; color: ${style.textColor}'`

            let table = ''

            let groupedArray = _.groupBy(json, `fields.${groupedBy}`)

            const ordered = Object.keys(groupedArray).sort().reduce(
                (obj, key) => {
                    obj[key] = groupedArray[key];
                    return obj;
                },
                {}
            );

            for (let locale in ordered) {
                table += "<h2>" + locale + `</h2><br><table style='border: ${style.border}; border-spacing: 0; width: ${style.width}; ${style.align}'>` + json2html.render(json[0], headerTemplate) + json2html.render(ordered[locale], bodyTemplate) + "</table><br>"
            }

            table = removeEndTagStylesFromHtml(table)

            return table + '</table>'

    },createSimplifiedGroupedTable: function createSimplifiedGroupedTable(json, headerTemplate, bodyTemplate, groupedBy, style) {

        //if Array is used (Definitions in Airtable) they need to be converted to the template format
        if(isArray(headerTemplate) && isArray(bodyTemplate)) {
            let newTemplates = convertArraysToSimplifiedTableTemplate(headerTemplate, bodyTemplate, style)
            headerTemplate = newTemplates.head
            bodyTemplate = newTemplates.body
        }


        //headerTemplate["<>"] += ` style='background-color: ${style.headBackgroundColor}; color: ${style.headTextColor}'`
        //bodyTemplate["<>"] += ` style='background-color: ${style.backgroundColor}; color: ${style.textColor}'`

        let table = ''

        let groupedArray = _.groupBy(json, `fields.${groupedBy}`)

        const ordered = Object.keys(groupedArray).sort().reduce(
            (obj, key) => {
                obj[key] = groupedArray[key];
                return obj;
            },
            {}
        );

        for (let locale in ordered) {
            table += "<h2>" + locale + `</h2><br><table>` + json2html.render(json[0], headerTemplate) + json2html.render(ordered[locale], bodyTemplate) + "</table><br>"
        }

        table = removeEndTagStylesFromHtml(table)

        console.log("Table: \n", table)

        return table + '</table>'

    },
    createTable: function createTable(json, headerTemplate, bodyTemplate, style) {
        //if Array is used (Definitions in Airtable) they need to be converted to the template format
        if(isArray(headerTemplate) && isArray(bodyTemplate)) {
            let newTemplates = convertArraysToTableTemplate(headerTemplate, bodyTemplate, style)
            headerTemplate = newTemplates.head
            bodyTemplate = newTemplates.body
        }

        headerTemplate["<>"] += ` style='background-color: ${style.headBackgroundColor}; color: ${style.headTextColor}'`
        bodyTemplate["<>"] += ` style='background-color: ${style.backgroundColor}; color: ${style.textColor}'`

        return `<table style='border: ${style.border}; border-spacing: 0; width: ${style.width}; ${style.align}'>` + json2html.render(json[0], headerTemplate) + json2html.render(json, bodyTemplate) + '</table>'
    },
    createSimplifiedTable: function createSimplifiedTable(json, headerTemplate, bodyTemplate, style) {
        //if Array is used (Definitions in Airtable) they need to be converted to the template format
        if(isArray(headerTemplate) && isArray(bodyTemplate)) {
            let newTemplates = convertArraysToSimplifiedTableTemplate(headerTemplate, bodyTemplate, style)
            headerTemplate = newTemplates.head
            bodyTemplate = newTemplates.body
        }

        //headerTemplate["<>"] += ` style='background-color: ${style.headBackgroundColor}; color: ${style.headTextColor}'`
        //bodyTemplate["<>"] += ` style='background-color: ${style.backgroundColor}; color: ${style.textColor}'`

        console.log("Table: \n", `<table>` + json2html.render(json[0], headerTemplate) + json2html.render(json, bodyTemplate) + '</table>')

        return `<table>` + json2html.render(json[0], headerTemplate) + json2html.render(json, bodyTemplate) + '</table>'
    },
    createGroupedHtml: function createGroupedHtml(json, bodyTemplate, groupedBy, summarizeGroups) {
        let html = ''

        let groupedArray = _.groupBy(json, `fields.${groupedBy}`)

        const ordered = Object.keys(groupedArray).sort().reduce(
            (obj, key) => {
                obj[key] = groupedArray[key];
                return obj;
            },
            {}
        );

        if(summarizeGroups){
            for(let groupItem in ordered){
                ordered[groupItem][0].recordCount = ordered[groupItem].length
                html += json2html.render(ordered[groupItem][0], bodyTemplate)
            }
        } else {
            for(let groupItem in ordered){
                html += "<h2>" + groupItem + "</h2><br>" + json2html.render(ordered[groupItem], bodyTemplate)
            }
        }

        if(html.startsWith("<li>"))
            html = "<ul>" + html + "</ul>"

        console.log(html)

        return html

    },
    createHtml: function createHtml(json, bodyTemplate){
        return json2html.render(json, bodyTemplate)
    },
    cleanUpFieldIds: function getAllVals(obj) {
        for (let k in obj) {
            if (typeof obj[k] === "object") {
                getAllVals(obj[k])
            } else {
                // base case, stop recurring
                obj[k] = obj[k].replace('${fld', '${fields.fld')
            }
        }
    },
    closeOpenHtmlTags: function closeOpenHtmlTags(html){
        let regex = new RegExp("\<(.+?)\>", "g")
        let variables = html.match(regex)
        let tagRegex = new RegExp(" (.+?)\>", "g")

        variables.forEach((tag, index) => {
            variables[index] = tag.replace(tagRegex, ">")
        })

        for(let i = 0; i < variables.length; i++){
            //ignore Singleton Tags
            if(variables[i].includes("img") || variables[i].includes("br") || variables[i].includes("area") || variables[i].includes("base") || variables[i].includes("col") || variables[i].includes("command") || variables[i].includes("embed") || variables[i].includes("hr") || variables[i].includes("input") || variables[i].includes("keygen") || variables[i].includes("link") || variables[i].includes("meta") || variables[i].includes("param") || variables[i].includes("source") || variables[i].includes("track") || variables[i].includes("wbr")) {
                variables.splice(i, 1)
                i -= 1
            }
            for (let j = 0; j < variables.length; j++) {
                let checkValue = variables[j]
                if (variables[j].includes("</")) {
                    if (variables[i] === checkValue.replace("</", "<")) {
                        variables.splice(j, 1)
                        variables.splice(i, 1)
                        i -= 1
                        break
                    }
                }


            }

        }

        variables.reverse().forEach(tag => {
            html += tag.replace("<", "</")
        })

        return html
    }
}

function convertArraysToTableTemplate(headArray, bodyArray, style){
    let headerTemplateNew = {"<>": "tr", "html": []}
    let bodyTemplateNew = {"<>": "tr", "html": []}
    headArray.forEach(entry => {
        headerTemplateNew.html.push({"<>": `th style='border: ${style.border}; padding: ${style.cellPadding}; margin: ${style.cellMargin}'`, "html": entry})
    })

    bodyArray.forEach(entry => {
        let regex = RegExp("fld..............", "g") //seems like field Ids start with "fld" and have 14 characters after that
        let fieldIds = [...entry.match(regex)]
        fieldIds.forEach(fieldId => {
            entry = entry.replace(fieldId, "${fields." + fieldId + "}")
        })
        bodyTemplateNew.html.push({"<>": `td style='border: ${style.border}; padding: ${style.cellPadding}; margin: ${style.cellMargin}'`, "html": entry})
    })

    //console.log(headerTemplateNew)
    //console.log(bodyTemplateNew)

    return {body: bodyTemplateNew, head: headerTemplateNew}
}

function convertArraysToSimplifiedTableTemplate(headArray, bodyArray, style){
    let headerTemplateNew = {"<>": "tr", "html": []}
    let bodyTemplateNew = {"<>": "tr", "html": []}
    headArray.forEach(entry => {
        headerTemplateNew.html.push({"<>": `th`, "html": entry})
    })

    bodyArray.forEach(entry => {
        let regex = RegExp("fld..............", "g") //seems like field Ids start with "fld" and have 14 characters after that
        let fieldIds = [...entry.match(regex)]
        fieldIds.forEach(fieldId => {
            entry = entry.replace(fieldId, "${fields." + fieldId + "}")
        })
        bodyTemplateNew.html.push({"<>": `td`, "html": entry})
    })

    //console.log(headerTemplateNew)
    //console.log(bodyTemplateNew)

    return {body: bodyTemplateNew, head: headerTemplateNew}
}

function removeEndTagStylesFromHtml(htmlString){
    let regex = RegExp('<\/.*?>', 'g')
    let tagRegex = RegExp(' style.*?>', 'g')
    let matches = htmlString.matchAll(regex)
    let returnHtml = []
    let i = 1;

    for (const match of matches){
        //console.log("i: " + i)
        returnHtml.push(htmlString.substring(i - 1, match.index))
        //console.log("betweenString: " + htmlString.substring(i - 1, match.index))
        let replacedMatch = match[0]
        //console.log("matched String: " + match[0])
        //console.log("matchLength: " + match[0].length)
        //console.log("matchIndex: " + match.index)
        //console.log("matchLength + matchIndex: " + (match.index + match[0].length))
        //console.log("Hopefully the match: " + htmlString.substring(match.index, match.index + match[0].length))
        if(match[0].includes('style')){
            replacedMatch = match[0].replace(tagRegex, ">")
            //console.log("After replace: " + replacedMatch)
        }
        returnHtml.push(replacedMatch)
        i = match.index + match[0].length + 1
    }

    //console.log(returnHtml)

    //console.log(returnHtml.join(""))

    return returnHtml.join("")
}