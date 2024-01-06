const ctrlFuncticon = {};

ctrlFuncticon.generateCode = (length) => {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

ctrlFuncticon.generateNumCertifictate = (length) => {
  var result = "";
  for (var i = 0; i < length; i++) {
    result += Math.floor(Math.random() * Math.floor(length))
  }
  return result;
}

  module.exports = ctrlFuncticon;