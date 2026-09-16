const baseEmailTemplate = (content) => {
  return `
    <div style="margin:0;padding:40px 20px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:520px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <div style="padding:30px 25px;text-align:center;background:linear-gradient(135deg,#2563eb,#7c3aed);">
          <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:700;letter-spacing:-0.5px;">
            HireMe<span style="color:#facc15;">.ai</span>
          </h1>

          <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">
            Practice smarter. Interview better.
          </p>
        </div>

        <!-- Content -->
        <div style="padding:35px 30px;text-align:center;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="padding:22px 25px;text-align:center;background:#f8fafc;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 7px;color:#64748b;font-size:13px;">
            Your AI-powered interview practice partner
          </p>

          <p style="margin:0;color:#94a3b8;font-size:12px;">
            © 2026 HireMe.ai. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;
};

// Signup OTP Email
export const signupOtpEmailTemplate = (otp) => {
  return baseEmailTemplate(`
    <div style="margin-bottom:22px;">
      <div style="display:inline-block;background:#eff6ff;border-radius:50%;padding:13px;">
        <span style="font-size:25px;">🔐</span>
      </div>
    </div>

    <h2 style="margin:0 0 14px;color:#111827;font-size:24px;">
      Verify your email
    </h2>

    <p style="margin:0 0 25px;color:#64748b;font-size:15px;line-height:1.7;">
      Welcome to HireMe.ai! Use the verification code below to complete your account registration.
    </p>

    <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 32px;margin-bottom:25px;">
      <span style="font-size:34px;font-weight:700;letter-spacing:9px;color:#2563eb;">
        ${otp}
      </span>
    </div>

    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
      This verification code will expire in
      <strong style="color:#111827;">5 minutes</strong>.
    </p>

    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
      If you did not request this code, you can safely ignore this email.
    </p>
  `);
};

// Reset Password OTP Email
export const resetOtpEmailTemplate = (otp) => {
  return baseEmailTemplate(`
    <div style="margin-bottom:22px;">
      <div style="display:inline-block;background:#f5f3ff;border-radius:50%;padding:13px;">
        <span style="font-size:25px;">🔑</span>
      </div>
    </div>

    <h2 style="margin:0 0 14px;color:#111827;font-size:24px;">
      Reset your password
    </h2>

    <p style="margin:0 0 25px;color:#64748b;font-size:15px;line-height:1.7;">
      We received a request to reset your HireMe.ai password. Use the code below to continue.
    </p>

    <div style="display:inline-block;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:18px 32px;margin-bottom:25px;">
      <span style="font-size:34px;font-weight:700;letter-spacing:9px;color:#7c3aed;">
        ${otp}
      </span>
    </div>

    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
      This verification code will expire in
      <strong style="color:#111827;">5 minutes</strong>.
    </p>

    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
      If you did not request a password reset, please ignore this email.
    </p>
  `);
};

// Welcome Email
export const welcomeEmailTemplate = (name) => {
  return baseEmailTemplate(`
    <div style="margin-bottom:22px;">
      <div style="display:inline-block;background:#ecfdf5;border-radius:50%;padding:13px;">
        <span style="font-size:25px;">🎉</span>
      </div>
    </div>

    <h2 style="margin:0 0 14px;color:#111827;font-size:24px;">
      Welcome, ${name}!
    </h2>

    <p style="margin:0 0 22px;color:#64748b;font-size:15px;line-height:1.7;">
      Your HireMe.ai account has been created successfully.
      You're now ready to practice interviews, improve your answers, and build confidence.
    </p>

    <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="margin:0;color:#1d4ed8;font-size:14px;font-weight:600;">
        Your interview preparation journey starts now.
      </p>
    </div>
  `);
};

// Interview Completed Email
export const interviewCompletedEmailTemplate = (name) => {
  return baseEmailTemplate(`
    <div style="margin-bottom:22px;">
      <div style="display:inline-block;background:#ecfdf5;border-radius:50%;padding:13px;">
        <span style="font-size:25px;">✅</span>
      </div>
    </div>

    <h2 style="margin:0 0 14px;color:#111827;font-size:24px;">
      Interview completed
    </h2>

    <p style="margin:0 0 22px;color:#64748b;font-size:15px;line-height:1.7;">
      Hi ${name || "there"}, your AI mock interview has been completed successfully.
      Your performance report is now ready to review.
    </p>

    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">
        Review your answers, identify improvement areas, and keep practicing to become interview-ready.
      </p>
    </div>
  `);
};
