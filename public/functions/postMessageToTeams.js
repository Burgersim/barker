const axios = require("axios");

module.exports = {
    postMessageToTeams: async function postMessageToTeams(title, message, html, webhook, footer) {
        const card = {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            'themeColor': "0072C6", // light blue
            'markdown': false,
            summary: 'Summary description',
            sections: [
                {
                    activityTitle: title,
                    text: message,
                },
                {
                    text: html || "",
                }
            ],
        };

        if(footer !== undefined)
            card.sections.push(
                {
                    text: footer,
                })

        //console.log("Card: " + card.sections.toString());

        try {
            return await axios.post(webhook, card, {
                headers: {
                    'content-type': 'application/vnd.microsoft.teams.card.o365connector',
                    'content-length': `${card.toString().length}`,
                },
            });
        } catch (err) {
            return err;
        }
    }
}