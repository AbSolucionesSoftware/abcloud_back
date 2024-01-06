const FCMNotificationCtrl = {};
const admin = require("firebase-admin");

function initFirebase() {
    const serviceAccount = require("../keys/FCM");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    })
}

initFirebase();

FCMNotificationCtrl.sendFCMNotification = async (tokens, data) => {
  const message = {
    data: {
      title: data.title,
      description: data.description,
      image: data.image,
      url: data.url,
      id_course: data.id_course,
      id_teacher: data.id_teacher,
      teacher_name: data.teacher_name,
      key_image: data.key_image,
      sended: data.sended.toString(),
      admin: data.admin.toString(),
      general: data.general.toString(),
      isModal: data.isModal.toString(),
      date_send: data.date_send,
    },
    notification: {
      title: data.title,
      body: data.description,
    },
    tokens,
  };

  await admin
    .messaging()
    .sendMulticast(message)
    .then((response) => {
      console.log(response.successCount + " messages were sent successfully");
    }).catch(err => {
      console.log(err);
    });
};

module.exports = FCMNotificationCtrl;
