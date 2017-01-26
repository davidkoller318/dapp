import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';

import './forgotPassword.html';
import '../../../widgets/warning/warning.js';

Template.forgotPassword.rendered = function rendered() {
  Session.set('emailSent', false);
  Session.set('error1', false);
  Session.set('error2', false);
};

Template.forgotPassword.helpers({
  emailSent: function () {
    return Session.get('emailSent');
  },
  error1: function () {
    return Session.get('error1');
  },
  error2: function () {
    return Session.get('error2');
  },
});

Template.forgotPassword.events({
  "click #recovery-button": function (event) {

    // Get recovery email
    const email = document.getElementById('recovery-email').value;

    // Reset helpers in case #recovery-button is clicked multiple times
    Session.set('emailSent', false);
    Session.set('error1', false);
    Session.set('error2', false);

    // Validate non-empty email & invoke Passwords API
    if (email !== '') {
      Accounts.forgotPassword({ email: email }, function (err) {
        if (err) {
          if (err.message === 'User not found [403]') {
            Session.set('error1', true);
          } else {
            Session.set('error2', true);
          }
        } else {
          Session.set('emailSent', true);
        }
      });
    }
  },
});
