/** Message for a failed social sign-in/link — the API keys these errors by code. */
export const socialErrorMessage = (err, t) => {
  const code = err?.data?.errors?.token?.[0] ?? err?.data?.errors?.provider?.[0]
  const map = {
    account_exists_use_password: t('err_account_exists_use_password', 'An account with this email exists. Sign in with your password.', 'يوجد حساب بهذا البريد. سجّل الدخول بكلمة المرور.'),
    social_max_accounts_reached: t('err_social_max_accounts_reached', 'Maximum linked accounts reached.', 'تم بلوغ الحد الأقصى للحسابات المربوطة.'),
    social_provider_not_allowed: t('err_social_provider_not_allowed', 'This provider is not allowed.', 'هذا المزوّد غير مسموح.'),
    invalid_firebase_token: t('err_invalid_firebase_token', 'Invalid sign-in token. Try again.', 'رمز الدخول غير صالح. حاول مجددًا.'),
    firebase_email_required: t('err_firebase_email_required', 'No email returned from the provider.', 'لم يتم إرجاع بريد من المزوّد.'),
    social_auth_requires_email: t('err_social_auth_requires_email', 'Social sign-in requires an email-based account.', 'يتطلب تسجيل الدخول الاجتماعي حسابًا بريديًا.'),
    social_email_mismatch: t('err_social_email_mismatch', 'The provider email does not match your account.', 'بريد المزوّد لا يطابق حسابك.'),
    social_account_already_linked: t('err_social_account_already_linked', 'This account is already linked to another user.', 'هذا الحساب مربوط بمستخدم آخر.'),
    social_provider_already_linked: t('err_social_provider_already_linked', 'Provider already linked.', 'هذا المزوّد مربوط بالفعل.'),
    social_provider_not_linked: t('err_social_provider_not_linked', 'Provider is not currently linked.', 'هذا المزوّد غير مربوط حاليًا.'),
    cannot_unlink_last_social_account: t('err_cannot_unlink_last_social_account', 'Set a password before unlinking your last social provider.', 'عيّن كلمة مرور قبل فك ربط آخر مزوّد.'),
  }
  return map[code] ?? code ?? err?.data?.message ?? err?.message ?? String(err)
}
