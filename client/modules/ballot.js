import {default as Modules} from "./_modules";

/*****
* @param {string} contractId - contract where this ballot belongs to
* @param {object} ballot - ballot object
******/
let _setVote = (contractId, ballot) => {
  var candidateBallot = new Array();

  //see candidate ballots
  if (Session.get('candidateBallot') != undefined) {
   candidateBallot = Session.get('candidateBallot');
  }
  var multipleChoice = Session.get('contract').multipleChoice;

  //fate
  if (ballot.tick == undefined) { ballot.tick = true } else { ballot.tick = !ballot.tick };

  //add or update ballot in memory
  var update = false;
  for (i in candidateBallot) {
    if (!multipleChoice) {
      candidateBallot[i].ballot.tick = false;
    }
    if (candidateBallot[i].contractId == contractId) {
      if (candidateBallot[i].ballot._id == ballot._id) {
        candidateBallot[i].ballot = ballot
        update = true;
      }
    }
  }
  if (!update) {
    candidateBallot.push({
      contractId: contractId,
      ballot: ballot
    })
  }

  //save to session var
  Session.set('candidateBallot', candidateBallot);
  return ballot.tick;
}

/*****
* @param {string} contractId - contract where this ballot belongs to
* @param {object} ballotId - ballotId to check
******/
let _getVote = (contractId, ballotId) => {
  if (Session.get('rightToVote') == false && Session.get('contract').stage != STAGE_DRAFT) {
    //check if user already voted
    var ledger = Session.get('contract').wallet.ledger
    for (i in ledger) {
      if (ledger[i].entityId == Meteor.user()._id) {
        ballot = ledger[i].ballot;
        for (k in ballot) {
          if (ballot[k]._id == ballotId) {
            return true;
          }
        }
      }
    }
    return false;
  } else {
    //check user current vote
    var votes = Session.get('candidateBallot');
    for (i in votes) {
      if (votes[i].contractId == contractId && votes[i].ballot._id == ballotId) {
        return votes[i].ballot.tick;
      }
    }
  }
}

/****
* checks if at least one item from ballot has been checked for voting
****/
let _ballotReady = () => {
  var votes = Session.get('candidateBallot');
  for (i in votes) {
    if (votes[i].ballot.tick == true) {
      return true;
    }
  }
  return false;
}


/****
* keeps only boolean true values in ballot
* @param {object} ballot - ballot object
* @return {object} options - array with only ticked true ballot options
****/
let _purgeBallot = (options) => {
  var finalBallot = new Array();
  for (i in options) {
    if (options[i].ballot.tick == true) {
      finalBallot.push(options[i].ballot);
    }
  }
  return finalBallot;
}


//adds a new proposal to contrat being edited
let addNewProposal = () => {
  if (Session.get('proposalURLStatus') == 'AVAILABLE') {
    Meteor.call("createNewContract", Session.get('newProposal'), function (error, data) {
      if (error && error.error == 'duplicate-fork') {
        Session.set('duplicateFork', true)
      } else {
        Meteor.call("addCustomForkToContract", Session.get('contract')._id, data, function (error) {
          if (error && error.error == 'duplicate-fork') {
            Session.set('duplicateFork', true)
          } else {
            Session.set('dbContractBallot', Contracts.findOne( { _id: Session.get('contract')._id }, {reactive: false}).ballot );
            ProposalSearch.search('');
            document.getElementById("searchInput").innerHTML = '';
            Session.set('proposalURLStatus', 'UNAVAILABLE');
            Session.set('createProposal', false);
            Session.set('emptyBallot', false);
          }
        });
      }
    });
  }

}

Modules.client.purgeBallot = _purgeBallot;
Modules.client.ballotReady = _ballotReady;
Modules.client.forkContract = addNewProposal;
Modules.client.setVote = _setVote;
Modules.client.getVote = _getVote;
