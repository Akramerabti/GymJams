import admin from 'firebase-admin';

// You'll need to download the service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = {
  "type": "service_account",
  "project_id": "gymtonic-87803",
  "private_key_id": "eea082b311f02cf01b1214577b47c9a147e443af",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCWC5eq4w+PYrvi\na03xe3KAvgnYHkutBBd1W3tIoAIKfOs9BqSzQ8I1NKrkJvGQPVyk5QJJABHY4jCm\nuzINnvhD519dHvCfzicPkpYGO0MGEVs5dKb+9qw157rZi4SmH2t1AAN5Edu7aasG\nfrsnB8NhZWqJbF0r4Yy4iEHqP6UFaK5gQ2sHFBIzRlTJZ06LAnnlIrFFgYbb2FHg\n8wrG9ukLR4hjF+5yhwL3SNv74pfbgAt0oBDlZ7VgeNMMe8QbfPW8Ane04Js/DFbv\nl0VtbSABtWZeHDJ9fhr8/2zUjcaD5OerTM+2wKhdVTEiI25b+96yGJFeStJpeMA7\nJnSJXTKPAgMBAAECggEAA6F3LjroAFEOzn1IjwyCKkxZl6GwChk8ahS9yHWavF87\nyqe+VNonDmYzsRP3f2/aAzbJazPLEBj1EsEahnWEzhErX75PwJuFRXKyGlIqc9tN\nU6LCJw7tVDFDIQrSZGSukyUIxdAL+vPPysyb7GdbL8r7nM9YTSdcN4Y7NhcL1V7N\na8GIEV65zkMkz43oQPZpabhiwUIkvzZK8TTLMJeO+FP8bTqoOJM8rsQVSu72uoh8\ntd3BNKXwHDdHjwVi0sDnInJhERFw1+EWTYZV5cgXSKRmTutagJyDUR+pPhntAJn3\nPr93vZeGeSVQhFCmsAYeAkPGIM7ETcNV9RRMGazJtQKBgQDRmSNAbKuJa7SP0DrR\nIzQEX4jGHnmOzSfjhzoCen5NLUQjCaBmn21SGJO1MtEjICMLKT27YBapePQrhl4b\n9vFBW8rb8h6EelvqNzxQkqxyuB4WYsrq7kmny416faO0UO9MRuCHiJF5ZkSCZREV\nzUjc91MFzW2qUuo2r+RqRpjQ8wKBgQC3Q1OHhYlbVtG15soaTxTBNf7J+30O5WI/\nWQn6pkQ3C8kbDqhl3CyQO9z8+PimgaT1lUVD4wewYEIZ5t/vaw3H5/og6+vi859d\nT/7taOt/ug0AnVbqUA5/ro5vAFWKFTUuXbdZM5pjkD320p9M2jnSZWI6yMMmAvly\n2Zc+6wxe9QKBgQCbqhE9SrgHYp+CY5MbOfrq+IzbH00GWqWyXP8fUhw1c1X0c7TW\nIreNTkV9QJWEcdy08Fcxr0aFbRhirvN772X0NZkuyt4RY9KZ25YG/TfoJ4fo9kxg\nOMMpRIr5mxAW3jkrPESLRElOkT52XVtYBtODkIfvekdlRRk/rliE+ZOLMwKBgQCP\nMcQquGTDQetKvrJcLD6DWbVkDWWCJinGZcQuXYwfls3knmdmb8tCSAQ8hi2DrPlA\nCwq8KMDxR8Veh8+iO3vhH5mJ782437M+Lit7Ref9PVq7iDVJkJRDoBkbEp/D7R5I\nxGFnCbMw6JwCKEDgxAM6Ko2+cPBK2zgeTXaoavCXoQKBgDg7YbRnQthbpmYU5zDX\niPmOPuRxqqX5njYEZjvxaWHoeQjtvrfd6Qi/lR1mvQ7DRJ5g9nuYeSwrqmvSDRF/\na4Lse2UnvCcn1D9/V2DkYqRQIDAB8pR0AaeMp24lBYR1Vxb4yG3TPgynn1W3imJx\nV8JXsfNE7IJD4Hqb1CbWrQcj\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@gymtonic-87803.iam.gserviceaccount.com",
  "client_id": "116009363318062855452",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gymtonic-87803.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gymtonic-87803'
  });
}

export default admin;