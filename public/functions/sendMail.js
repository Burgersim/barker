const nodemailer = require("nodemailer");

module.exports = {
    sendMail: function sendMail(from, to, cc, message){
        return new Promise((resolve, reject) => {
            if(typeof message !== "object" || typeof from !== "object"){
                reject({status: 400, statusText: 'Message or fromMail is not json object'})
            } else if(!from.address) {
                reject({status: 400, statusText:'fromMail missing address'})
            } else if(!from.user){
                reject({status: 400, statusText: 'fromMail missing user'})
            } else if(!from.password){
                reject({status: 400, statusText: 'fromMail missing password'})
            } else if(!from.service){
                reject({status: 400, statusText: 'fromMail missing service'})
            } else if(!message.body){
                reject({status: 400, statusText: 'message missing body'})
            } else if(!message.subject){
                reject({status: 400, statusText: 'message missing subject'})
            } else if(to === "" || !to.includes("@")) {
                reject({status: 400, statusText: 'no valid toMail given'})
            } else {

                let cleanTo = to.split(",").map(element => {return element.trim()}).toString()
                let cleanCc = cc.split(",").map(element => {return element.trim()}).toString()

                const transportOptions = {
                    host : from.service,
                    auth : {
                        user : from.user,
                        pass : from.password
                    },
                    port: from.port || 587,
                    secure: from.secure || false,
                    tls: from.tls || {ciphers: 'SSLv3', rejectUnauthorized: false}
                }

                const transporter = nodemailer.createTransport(transportOptions)

                const options = {
                    from : from.address,
                    "to": cleanTo,
                    "cc": cleanCc,
                    subject: message.subject,
                    html: message.body,
                }

                    transporter.sendMail(options).then(r => {
                        //console.log("Log", r)
                        resolve(r)
                    }).catch(err => {
                        //console.error("Error", err)
                        reject(err)
                    })



            }
        }).catch(err => {throw err})
    }
}