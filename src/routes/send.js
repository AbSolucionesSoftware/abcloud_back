const {Router, json} = require('express');
const router = Router();
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

router.route('/notification').post((req,res) => {
    var notification = {
        'title': 'No mames si jalo',
        'text': 'Puto el que lo lea'
    }

    var fcm_token = [];

    var notification_body = {
        'notification': notification,
        'registration_ids': fcm_token
    }

    fetch('https://fcm.googleapis.com/fcm/send',{
        'method': 'POST',
        'header': {
            'Authorization': 'key='+'AAAAm1H8Z3w:APA91bGX86W4nQ3U474gfzo3tBBu2eaCsbfpRrCCc-UF9eatjVakpjGpuXOLffsQgJ8Atddk_2Wwbz4VIZqYdITPZaNf4jgIBe3DVKimeTRnGKKRmbVwmXKlTI3L9KuQoWEZ44SMWI1z',
            'Content-Type': 'application/json'
        },
        'body': JSON.stringify(notification_body)
    })
    .then(() => {
        res.status(200).send("awebo");
    })
    .catch(() => {
        res.status(500).send("no jalo raza");
    });
    

});

module.exports = router;