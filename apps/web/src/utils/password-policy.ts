export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 10 &&
    password.length <= 72 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
