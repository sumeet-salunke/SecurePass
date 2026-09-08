const accountDeletedTemplate = (name) => {
  return `
    <div style="font-family:sans-serif">

      <h2>Hello ${name},</h2>

      <p>Your SecurePass account has been permanently deleted.</p>

      <p>
        If you did not perform this action, please contact support immediately.
      </p>

      <p>Thank you for using SecurePass.</p>

    </div>
  `;
};

export default accountDeletedTemplate;