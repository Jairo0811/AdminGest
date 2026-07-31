# Checklist RC3.2

- [ ] `npm run db:generate`
- [ ] `npm run db:migrate`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Solicitud con correo existente devuelve mensaje genérico.
- [ ] Solicitud con correo inexistente devuelve el mismo mensaje.
- [ ] El enlace vence después de 30 minutos.
- [ ] Un enlace utilizado no puede reutilizarse.
- [ ] Una segunda solicitud invalida la anterior.
- [ ] La nueva contraseña permite iniciar sesión.
- [ ] Se registran eventos de auditoría de solicitud, éxito y fallo conocido.
- [ ] En producción, Resend y el remitente están configurados.
