import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  roleSelectionChrome,
  roleSelectionContext,
} from './roleSelectionContext';

describe('roleSelectionContext (#53)', () => {
  it('login Google pertama kali tanpa profil menjadi onboarding', () => {
    assert.equal(roleSelectionContext(true), 'onboarding');
    assert.equal(roleSelectionContext(false), 'signup');
  });

  it('onboarding menawarkan ganti akun, bukan daftar atau kembali', () => {
    const chrome = roleSelectionChrome('onboarding');
    assert.equal(chrome.secondaryAction, 'switch_account');
    assert.equal(chrome.showBack, false);
    assert.match(chrome.intro, /menyelesaikan akun/);
  });

  it('alur autentikasi tetap menawarkan daftar dengan email', () => {
    const chrome = roleSelectionChrome('signup');
    assert.equal(chrome.secondaryAction, 'register');
    assert.equal(chrome.showBack, true);
  });
});
