// Quick script to decode the guest token from your logs
const guestToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6IisxNTE0OTEyNzU0NSIsInByb2ZpbGVJZCI6bnVsbCwiaXNHdWVzdCI6dHJ1ZSwidmVyaWZpZWQiOnRydWUsImd1ZXN0SWQiOiI3MGIzZGUzYS1iY2FjLTQyYmItODM3Mi00N2IwNzdlNjExZjYiLCJpYXQiOjE3NTQ1NDA4NDQsImV4cCI6MTc1NzEzMjg0NH0.XJcucw1KYl5vlQgl3trhLDuSxQtEzyCk3L9X5v9Xu5c";

try {
  const payload = JSON.parse(Buffer.from(guestToken.split('.')[1], 'base64').toString());
  console.log('Guest token payload:', JSON.stringify(payload, null, 2));
} catch (error) {
  console.error('Error decoding token:', error);
}
