
module.exports = {
    cleanUpIds: function cleanUpIds(text, record) {

        let regex = new RegExp("\\${(.+?)\\}", "g")
        let cleanedMessage = text
        let variables = cleanedMessage.match(regex) || []

        variables.forEach(variable => {
            cleanedMessage = cleanedMessage.replace(variable, record.get(variable.replace("${", "").replace("}", "")))
        })

        return cleanedMessage
    }
}