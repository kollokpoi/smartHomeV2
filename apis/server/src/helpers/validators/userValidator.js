// helpers/validators/userValidator.js
class UserValidator {
  validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.email !== undefined) {
      if (!data.email) {
        errors.push({ field: "email", message: "Email обязателен" });
      } else if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(data.email)) {
        errors.push({ field: "email", message: "Некорректный email" });
      }
    }

    if (!isUpdate || data.password !== undefined) {
      if (!data.password && !isUpdate) {
        errors.push({ field: "password", message: "Пароль обязателен" });
      } else if (data.password && data.password.length < 6) {
        errors.push({
          field: "password",
          message: "Пароль должен быть не менее 6 символов",
        });
      }
    }

    if (data.name !== undefined && data.name.length > 100) {
      errors.push({
        field: "name",
        message: "Имя не может быть длиннее 100 символов",
      });
    }

    if (
      data.role !== undefined &&
      !["root", "admin", "moderator", "user", "bot"].includes(data.role)
    ) {
      errors.push({ field: "role", message: "Некорректная роль" });
    }

    return errors;
  }
}

module.exports = new UserValidator();
