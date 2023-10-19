

module.exports = {
    checkAllCheckboxes: function checkCheckboxes(recordArray, fieldId){
        //console.log("checkbox all function called")
        for(let record in recordArray){
            module.exports.checkCheckbox(recordArray[record], fieldId)
        }
    },

    checkCheckbox: function checkCheckbox(record, fieldId){
        //console.log("checkbox single function called")
        //console.log(record.id + ": " + fieldId)
        record.updateFields({[fieldId]: true})
    }
}