function isValidPattern(pattern){
    let splitPattern = pattern.split(' ')
    let cleanedPattern = splitPattern.filter(function (value) {
        return value !== ''
    })
    return cleanedPattern.length === 5
}

module.exports = {
    isValidPattern: isValidPattern
}