module.exports = {
    "type": process.env.FCM_type,
    "project_id": process.env.FCM_project_id,
    "private_key_id": process.env.FCM_key_id,
    "private_key": process.env.FCM_private_key.replace(/\\n/g, '\n'),
    "client_email": process.env.FCM_client_email,
    "client_id": process.env.FCM_client_id,
    "auth_uri": process.env.FCM_auth_uri,
    "token_uri": process.env.FCM_token_uri,
    "auth_provider_x509_cert_url": process.env.FCM_auth_provider_x509_cert_url,
    "client_x509_cert_url": process.env.FCM_client_x509_cert_url
  }
