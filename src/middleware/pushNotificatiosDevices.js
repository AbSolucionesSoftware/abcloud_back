const pushNotificationCtrl = {};
const fetch = require('node-fetch');

pushNotificationCtrl.sendNotification = async (expoPushTokens,title_push,body_push,data) => {
    try {
        expoPushTokens.map(async (moviles) => {
            const message = {
                to: `${moviles.expoPushToken}`,
                sound: 'default',
                title: `${title_push}`,
                body: `${body_push}`,
                data: data ? data : {},
              };
              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
              }).catch((err) => console.log(err));
        })
    } catch (error) {
        console.log(error);
        return error;
    }
}

module.exports = pushNotificationCtrl;