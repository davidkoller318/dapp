import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

import { Contracts } from '/imports/api/contracts/Contracts';
import { setVote, getTickValue, candidateBallot, getRightToVote, getBallot, setBallot, getTotalVoters, getTally } from '/imports/ui/modules/ballot';
import { Vote } from '/imports/ui/modules/Vote';

import './fork.html';

/**
* @summary determines whether this decision can display results or notice
* @return {boolean} yes or no
*/
const _displayResults = (contract) => {
  if (getTotalVoters(contract) > 0) {
    return ((contract.stage === 'FINISH') || (contract.permanentElection && contract.stage !== 'DRAFT'));
  }
  return false;
};

/**
* @summary color to render the checkbox
* @param {string} mode current mode of the checkbox
*/
const _checkboxStyle = (mode) => {
  switch (mode) {
    case 'AUTHORIZE':
      return 'vote-authorize nondraggable';
    case 'REJECT':
      return 'vote-authorize unauthorized nondraggable';
    case 'FORK':
    default:
      return 'vote vote-alternative';
  }
};

Template.fork.onCreated(() => {
  Template.instance().contract = new ReactiveVar(Template.currentData().contract);
  Template.instance().rightToVote = new ReactiveVar(getRightToVote(Template.instance().contract.get()));
  Template.instance().candidateBallot = new ReactiveVar(getBallot(Template.instance().contract.get()._id));
});

Template.fork.helpers({
  length() {
    if (this.label !== undefined) {
      if (this.label.length > 51) {
        return 'option-link option-long option-longest';
      } else if (this.label.length > 37) {
        return 'option-link option-long';
      }
    }
    return '';
  },
  dragMode() {
    if (Template.instance().contract.get().stage === 'DRAFT' || this.mini === true) {
      return '';
    }
    return 'vote-nondrag';
  },
  tickStyle() {
    if (this.mode === 'REJECT') {
      return 'unauthorized';
    }
    return '';
  },
  checkbox(mode) {
    return _checkboxStyle(mode);
  },
  action() {
    if (this.authorized === false) {
      return 'undefined';
    }
    return '';
  },
  option(mode) {
    if (Template.instance().contract.get().stage === 'DRAFT' || (Template.instance().rightToVote.get() === false && Template.instance().contract.get().stage !== 'DRAFT')) {
      return 'disabled';
    }
    switch (mode) {
      case 'AUTHORIZE':
        return '';
      case 'REJECT':
        if (this.mini) {
          return 'unauthorized';
        }
        return 'option-link unauthorized';
      default:
        return '';
    }
  },
  decision(mode) {
    switch (mode) {
      case 'REJECT':
        return 'option-link unauthorized';
      default:
        return '';
    }
  },
  caption(mode) {
    if (mode !== 'FORK') {
      return TAPi18n.__(mode);
    }
    return this.label;
  },
  tick() {
    if (Template.instance().contract.get().stage === 'DRAFT') {
      return 'disabled';
    }
    return '';
  },
  tickStatus() {
    this.tick = getTickValue(Template.instance().contract.get()._id, this, Template.instance().contract.get());
    if (Template.instance().candidateBallot.get() || (this.tick)) {
      if (this.tick) {
        if (this.mode === 'REJECT') {
          return 'tick-active-unauthorized';
        }
        return 'tick-active';
      }
    // already voted
    } else if (Template.instance().rightToVote.get() === false && Template.instance().contract.get().stage !== 'DRAFT') {
      if (this.tick) {
        return 'tick-disabled';
      }
    }
    return '';
  },
  style(className) {
    let final = className;
    if (this.mini === true) {
      final += ` ${final}-mini`;
    }
    return final;
  },
  isReject() {
    return (this.mode === 'REJECT');
  },
  displayResult() {
    return _displayResults(Template.instance().contract.get());
  },
});

Template.result.helpers({
  checkbox(mode) {
    if (mode === 'REJECT') {
      return 'result-unauthorized unauthorized nondraggable';
    }
    return _checkboxStyle(mode);
  },
  total() {
    const total = getTally(this);
    if (total !== 1) {
      return `${total} ${TAPi18n.__('vote')}`;
    }
    return `${total} ${TAPi18n.__('vote')}`;
  },
  percentage() {
    // getTally(Template.instance().contract.get());
  },
});


Template.fork.events({
  'click #ballotCheckbox'() {
    if (!Session.get('showModal')) {
      // TODO consider multiple choice use case when feature becomes active.

      switch (Template.instance().contract.get().stage) {
        case 'DRAFT':
        case 'FINISH':
          Session.set('disabledCheckboxes', true);
          break;
        case 'LIVE':
        default:
          if (Template.instance().rightToVote.get()) {
            if (Template.instance().candidateBallot.get() === undefined || Template.instance().candidateBallot.get().length === 0) {
              Template.instance().candidateBallot.set(candidateBallot(Meteor.userId(), Template.instance().contract.get()._id));
            }
            const previous = Template.instance().candidateBallot.get();
            const wallet = new Vote(Session.get(this.voteId), Session.get(this.voteId).targetId, this.voteId);
            const template = Template.instance();
            wallet.inBallot = Session.get(this.voteId).inBallot;
            wallet.allocateQuantity = wallet.inBallot;
            wallet.allocatePercentage = parseFloat((wallet.inBallot * 100) / wallet.balance, 10).toFixed(2);
            const cancel = () => {
              template.candidateBallot.set(setBallot(template.contract.get()._id, previous));
            };
            this.tick = setVote(Template.instance().contract.get(), this);
            if (this.tick === true) {
              Session.set('noSelectedOption', this.voteId);
            }

            // vote
            if (this.tick === false && Session.get(this.voteId).inBallot > 0) {
              // remove all votes
              wallet.allocatePercentage = 0;
              wallet.allocateQuantity = 0;
              wallet.execute(cancel, true);
              return;
            } else if (Session.get(this.voteId).inBallot > 0) {
              // send new ballot
              wallet.execute(cancel);
            }
            break;
          }
      }
    }
  },
  'click #remove-fork'() {
    Contracts.update(Template.instance().contract.get()._id, { $pull: {
      ballot:
        { _id: this._id },
    } });
  },
});
