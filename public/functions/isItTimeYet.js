// ┌────────────── second (optional)
// │ ┌──────────── minute
// │ │ ┌────────── hour
// │ │ │ ┌──────── day of month
// │ │ │ │ ┌────── month
// │ │ │ │ │ ┌──── day of week
// │ │ │ │ │ │
// │ │ │ │ │ │
// * * * * * *

//seconds are not checked, since we don't use them in Barker Scheduling (yet)


function matchPattern(pattern, value){
        if( pattern.indexOf(',') !== -1 ){
            const patterns = pattern.split(',');
            return patterns.indexOf(value.toString()) !== -1;
        }
        return pattern === value.toString();
    }


    function isItTimeYet(scheduled) {
        const now = new Date(new Date().toUTCString())
        let minutes = scheduled.expressions[1]
        let hours = scheduled.expressions[2]
        let days = scheduled.expressions[3]
        let months = scheduled.expressions[4]
        let weekdays = scheduled.expressions[5]

        const runOnMinute = matchPattern(minutes, now.getUTCMinutes())
        const runOnHour = matchPattern(hours, now.getUTCHours())
        const runOnDay = matchPattern(days, now.getUTCDate())
        const runOnMonth = matchPattern(months, now.getUTCMonth() + 1)
        const runOnWeekday = matchPattern(weekdays, now.getUTCDay())

        return runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekday
    }

    module.exports = {
    isItTimeYet: isItTimeYet
    }